const ut = require('../core/utils');
const urls = require('./urls');
const plot_data = require('./plot_data');
const fix_geojson_layering = require('./fix_geojson_layering');

let currentController = null;

async function fetch_spc_data(type, category, day) {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    const path = urls?.[type]?.[category]?.[day];
    if (!path) return;

    if (currentController) currentController.abort();
    currentController = new AbortController();
    const { signal } = currentController;

    const formatted_day = `${capitalize(day.slice(0, 3))} ${day.slice(3)}`;
    const formatted_category = capitalize(category.replace('_', ' '));

    // CHANGE: Use AllOrigins to bypass the 403 Forbidden block
    const requestUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(path)}`;

    try {
        const response = await fetch(requestUrl, { signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const geojson = await response.json();

        // Check if data is valid before processing
        if (geojson && geojson.features) {
            const fixedData = fix_geojson_layering(geojson);
            plot_data(fixedData, formatted_day, formatted_category);
        }
    } catch (err) {
        if (err.name !== 'AbortError') console.error('SPC Fetch Error:', err);
    } finally {
        if (currentController?.signal === signal) currentController = null;
    }
}

module.exports = fetch_spc_data;