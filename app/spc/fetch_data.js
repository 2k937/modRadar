const ut = require('../core/utils');
const urls = require('./urls');
const plot_data = require('./plot_data');
const fix_geojson_layering = require('./fix_geojson_layering');

let latestRequestId = 0;

function fetch_spc_data(type, category, day) {

    function capitalize_first_letter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const split_at = (index, xs) => [xs.slice(0, index), xs.slice(index)];

    const split_day = split_at(3, day);
    const formatted_day = `${capitalize_first_letter(split_day[0])} ${split_day[1]}`;
    const formatted_category = capitalize_first_letter(category);

    /* --------------------------
       Validate URL Path
    -------------------------- */

    if (!urls?.[type]?.[category]?.[day]) {
        console.error('SPC URL not found:', type, category, day);
        return;
    }

    const requestId = ++latestRequestId;

    const requestUrl = ut.phpProxy + urls[type][category][day];

    fetch(requestUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(geojson => {

            // If another request started after this one, ignore this response
            if (requestId !== latestRequestId) return;

            if (!geojson || !geojson.features) {
                throw new Error('Invalid GeoJSON');
            }

            geojson = fix_geojson_layering(geojson);

            plot_data(geojson, formatted_day, formatted_category);
        })
        .catch(error => {
            console.error('SPC fetch error:', error);
        });
}

module.exports = fetch_spc_data;
