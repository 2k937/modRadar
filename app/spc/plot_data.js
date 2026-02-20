const map = require('../core/map/map');
const set_layer_order = require('../core/map/setLayerOrder');
const turf = require('@turf/turf');
const { DateTime } = require('luxon');
const ModPopup = require('../core/popup/ModPopup');
const ut = require('../core/utils');

/**
 * Extracts and formats the validity period from GeoJSON properties.
 */
function return_time_range(json) {
    if (!json?.features?.length) return ['', ''];

    // Grab properties from the first feature (SPC usually keeps these consistent across a file)
    const props = json.features[0].properties;
    const { ISSUE: issue, EXPIRE: expire } = props;

    if (!issue || !expire) return ['', ''];

    const parse = (str) => {
        const d = DateTime.fromFormat(str, 'yyyyMMddHHmm', { zone: 'UTC' });
        return d.isValid ? d.toLocal().toFormat('EEE MMM d, h:mm a') : '';
    };

    return [parse(issue), parse(expire)];
}

/**
 * Handles cleanup and creation of Mapbox layers/sources.
 */
function update_map_layers(geojson) {
    const SOURCE_ID = 'spc_source';

    // Update data if source exists, otherwise create it
    if (map.getSource(SOURCE_ID)) {
        map.getSource(SOURCE_ID).setData(geojson);
    } else {
        map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });

        map.addLayer({
            id: 'spc_fill',
            type: 'fill',
            source: SOURCE_ID,
            paint: {
                'fill-outline-color': ['get', 'stroke'],
                'fill-color': ['get', 'fill'],
                'fill-opacity': 0.6 // Slightly transparent usually looks better for overlays
            },
            layout: { 'fill-sort-key': ['get', 'zindex'] }
        });

        map.addLayer({
            id: 'spc_border',
            type: 'line',
            source: SOURCE_ID,
            paint: {
                'line-color': ['get', 'stroke'],
                'line-width': 2
            },
            layout: { 'line-sort-key': ['get', 'zindex'] }
        });

        // Ensure listeners are only attached once during creation
        map.on('click', 'spc_fill', click_listener);
    }
    
    set_layer_order();
}

function click_listener(e) {
    const feature = e.features?.[0];
    if (!feature) return;

    // Use data attributes or a more robust way to get current state than parsing HTML text
    const $info = $('#spcDataInfo');
    const category = $info.data('category'); 
    const day = $info.data('day');

    const popup_html = `
        <div style="text-align:center">
            <strong style="font-size:14px">${feature.properties?.LABEL2 || 'N/A'}</strong>
            <hr style="margin:5px 0">
            <small>Click for full text discussion</small>
        </div>`;
    
    new ModPopup(e.lngLat, popup_html).add_to_map();
}

function plot_data(geojson, formatted_day, formatted_category) {
    if (!geojson) return;

    const [issue, expire] = return_time_range(geojson);
    const is_empty = !geojson.features?.length;

    // Build UI - Added data attributes for cleaner retrieval in listeners
    let html = `<b>${formatted_category} - ${formatted_day}</b>`;
    if (is_empty) html += `<p style="color:red; font-weight:bold;">NO HAZARDS DEFINED</p>`;
    
    const time_html = issue && expire ? `
        <p style="margin:0;font-size:11px">&nbsp;&nbsp;&nbsp;${issue} thru</p>
        <p style="margin:0;font-size:11px">&nbsp;&nbsp;&nbsp;${expire}</p>` : '';

    $('#spcDataInfo')
        .html(html + `<i class="helperText" style="opacity:0.7">${time_html}</i>`)
        .data('category', formatted_category)
        .data('day', formatted_day);

    update_map_layers(geojson);
}

module.exports = plot_data;
