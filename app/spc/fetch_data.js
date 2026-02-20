const ut = require('../core/utils');
const urls = require('./urls');
const plot_data = require('./plot_data');
const fix_geojson_layering = require('./fix_geojson_layering');

let currentController = null;

function fetch_spc_data(type, category, day) {
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    if (!urls?.[type]?.[category]?.[day]) {
        console.error('SPC URL not found:', type, category, day);
        return;
    }

    if (currentController) {
        currentController.abort();
    }

    currentController = new AbortController();

    const formatted_day = `${capitalize(day.slice(0, 3))} ${day.slice(3)}`;
    const formatted_category = capitalize(category);
    const requestUrl = ut.phpProxy + urls[type][category][day];

    fetch(requestUrl, { signal: currentController.signal })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(geojson => {
            if (!geojson?.features) throw new Error('Invalid GeoJSON');
            geojson = fix_geojson_layering(geojson);
            plot_data(geojson, formatted_day, formatted_category);
        })
        .catch(err => {
            if (err.name !== 'AbortError') {
                console.error('SPC fetch error:', err);
            }
        });
}

module.exports = fetch_spc_data;
