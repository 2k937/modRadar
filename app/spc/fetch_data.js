const ut = require('../core/utils');
const urls = require('./urls');
const plot_data = require('./plot_data');
const fix_geojson_layering = require('./fix_geojson_layering');

// Use a scoped object if this module is initialized multiple times
let currentController = null;

/**
 * Fetches SPC GeoJSON data with request cancellation and layering fixes.
 */
async function fetch_spc_data(type, category, day) {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    // 1. Validate URL path existence early
    const path = urls?.[type]?.[category]?.[day];
    if (!path) {
        console.error(`SPC URL mapping missing for: ${type} > ${category} > ${day}`);
        return;
    }

    // 2. Handle AbortController logic
    if (currentController) {
        currentController.abort();
    }
    currentController = new AbortController();
    const { signal } = currentController;

    // 3. Prepare display strings
    const formatted_day = `${capitalize(day.slice(0, 3))} ${day.slice(3)}`;
    const formatted_category = capitalize(category);
    const requestUrl = ut.phpProxy + path;

    try {
        const response = await fetch(requestUrl, { signal });

        if (!response.ok) {
            throw new Error(`SPC Fetch failed: ${response.status} ${response.statusText}`);
        }

        let geojson = await response.json();

        if (!geojson || !geojson.features) {
            throw new Error('Invalid GeoJSON structure received from SPC');
        }

        // 4. Process and Plot
        geojson = fix_geojson_layering(geojson);
        plot_data(geojson, formatted_day, formatted_category);

    } catch (err) {
        if (err.name === 'AbortError') {
            // Silently handle expected cancellations
            return;
        }
        console.error('SPC Data Pipeline Error:', err.message);
    } finally {
        // Clean up controller reference if this was the active one
        if (currentController?.signal === signal) {
            currentController = null;
        }
    }
}

module.exports = fetch_spc_data;
