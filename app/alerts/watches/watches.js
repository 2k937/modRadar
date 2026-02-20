const ut = require('../../core/utils');
const kmz_to_geojson = require('../../hurricanes/kmz_to_geojson');
const get_polygon_colors = require('../colors/polygon_colors');
const turf = require('@turf/turf');
const map = require('../../core/map/map');
const set_layer_order = require('../../core/map/setLayerOrder');
const ModPopup = require('../../core/popup/ModPopup');
const display_attic_dialog = require('../../core/menu/attic_dialog');

const ALL_WATCHES_URL = `https://www.spc.noaa.gov/products/watch/ActiveWW.kmz`;

async function click_listener(e) {
    if (e.originalEvent.cancelBubble) return;
    
    const feature = e.features[0];
    const { id, event, full_desc, color } = feature.properties;
    const divId = `ww${id}`;

    const popup_html = `
        <div style="font-weight: bold; font-size: 13px;">${event}</div>
        <i id="${divId}" class="alert_popup_info icon-blue fa fa-circle-info" style="color: white; cursor: pointer;"></i>
    `;

    const popup = new ModPopup(e.lngLat, popup_html);
    popup.add_to_map();

    // Adjust popup size and position
    const $infoIcon = $(`.alert_popup_info`);
    popup.ModPopup_div.width(`+=${$infoIcon.outerWidth() + parseInt($infoIcon.css('paddingRight'))}`);
    popup.update_popup_pos();

    $(`#${divId}`).on('click', () => {
        display_attic_dialog({
            'title': event,
            'body': full_desc,
            'color': color,
            'textColor': 'white',
        });
    });
}

function _plot_watches(feature_collection) {
    // Duplicate features for border/outline styling
    const styled_features = feature_collection.features.flatMap((f) => {
        const border = JSON.parse(JSON.stringify(f));
        const outline = JSON.parse(JSON.stringify(f));
        border.properties.draw_type = 'border';
        outline.properties.draw_type = 'outline';
        return [border, outline];
    });

    const display_collection = turf.featureCollection(styled_features);
    const SOURCE_ID = 'watches_source';

    if (map.getSource(SOURCE_ID)) {
        map.getSource(SOURCE_ID).setData(display_collection);
    } else {
        map.addSource(SOURCE_ID, { type: 'geojson', data: display_collection });

        map.addLayer({
            'id': 'watches_layer',
            'type': 'line',
            'source': SOURCE_ID,
            'paint': {
                'line-color': [
                    'case',
                    ['==', ['get', 'draw_type'], 'outline'], ['get', 'color'],
                    ['==', ['get', 'draw_type'], 'border'], 'black',
                    'transparent'
                ],
                'line-width': [
                    'case',
                    ['==', ['get', 'draw_type'], 'outline'], 3,
                    ['==', ['get', 'draw_type'], 'border'], 7,
                    0
                ]
            }
        });

        map.addLayer({
            'id': 'watches_layer_fill',
            'type': 'fill',
            'source': SOURCE_ID,
            'paint': { 'fill-color': ['get', 'color'], 'fill-opacity': 0 }
        });

        map.on('mouseenter', 'watches_layer_fill', () => map.getCanvas().style.cursor = 'pointer');
        map.on('mouseleave', 'watches_layer_fill', () => map.getCanvas().style.cursor = '');
        map.on('click', 'watches_layer_fill', click_listener);

        set_layer_order();
    }
}

async function fetch_watches() {
    try {
        const response = await fetch(ALL_WATCHES_URL, { cache: 'no-store' });
        const blob = await response.blob();
        
        kmz_to_geojson(blob, async (kml_dom) => {
            const parsed_xml = ut.xmlToJson(kml_dom);
            let links = parsed_xml.kml?.Folder?.NetworkLink;
            if (!links) return;
            
            // Normalize to array if only one watch is active
            if (!Array.isArray(links)) links = [links];

            const active_features = [];

            for (const link of links) {
                const discussion_url = link.Link.href['#text'];
                const discussion_desc = link.name['#text'];
                
                // Extract "Tornado Watch 123"
                const match = /(.*? Watch \d+).*/.exec(discussion_desc);
                if (!match) continue;

                const event = match[1];
                const watch_type = event.substring(0, event.lastIndexOf(' '));
                const color = get_polygon_colors(watch_type).color;
                const id = event.split(' ').pop();

                // 1. Fetch individual KMZ geometry
                const geo_res = await fetch(discussion_url);
                const geo_blob = await geo_res.blob();
                
                kmz_to_geojson(geo_blob, async (geojson) => {
                    const feature = geojson.features[0];
                    
                    // 2. Fetch full text discussion
                    const padId = id.padStart(4, '0');
                    const text_res = await fetch(`https://www.spc.noaa.gov/products/watch/ww${padId}.html`);
                    const text_html = await text_res.text();
                    
                    const doc = new DOMParser().parseFromString(text_html, 'text/html');
                    const pre = doc.querySelector('pre');
                    
                    feature.properties = {
                        ...feature.properties,
                        event,
                        color,
                        id,
                        full_desc: pre ? pre.innerHTML : 'No discussion available.'
                    };

                    active_features.push(feature);
                    _plot_watches(turf.featureCollection(active_features));
                });
            }
        }, true);
    } catch (err) {
        console.error('Error fetching SPC Watches:', err);
    }
}

module.exports = fetch_watches;
