const map = require('../core/map/map');
const set_layer_order = require('../core/map/setLayerOrder');
const { DateTime } = require('luxon');
const ModPopup = require('../core/popup/ModPopup');

function update_map_layers(geojson) {
    const SOURCE_ID = 'spc_source';

    if (!geojson.features) return;

    // 1. Sort features: Smallest areas (High Risk) draw last (on top).
    geojson.features.sort((a, b) => {
        const areaA = a.properties?.Shape_Area || 0;
        const areaB = b.properties?.Shape_Area || 0;
        return areaB - areaA;
    });

    // 2. Manage Source
    if (map.getSource(SOURCE_ID)) {
        map.getSource(SOURCE_ID).setData(geojson);
    } else {
        map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });
    }

    // 3. Fill Layer
    if (!map.getLayer('spc_fill')) {
        map.addLayer({
            id: 'spc_fill',
            type: 'fill',
            source: SOURCE_ID,
            paint: {
                'fill-color': [
                    'case',
                    ['has', 'fill'], ['get', 'fill'], // Use Day 1 pre-styled colors
                    ['match', ['get', 'LABEL'],
                        // Categorical
                        'TSTM', '#c1e3ff', 'MRGL', '#66bb6a', 'SLGT', '#ffee58',
                        'ENH', '#ffb74d', 'MOD', '#ef5350', 'HIGH', '#d32f2f',
                        // Probabilities (Tornado/Wind/Hail)
                        '2%', '#008b00', '5%', '#8b4726', '15%', '#ffc125',
                        '30%', '#ff0000', '45%', '#ff3e96', '60%', '#104e8b',
                        'SIGN', '#000000',
                        '#808080' // Default Gray
                    ]
                ],
                'fill-opacity': 0.5
            }
        });
        map.on('click', 'spc_fill', click_listener);
    }

    // 4. Border Layer
    if (!map.getLayer('spc_border')) {
        map.addLayer({
            id: 'spc_border',
            type: 'line',
            source: SOURCE_ID,
            paint: {
                'line-color': '#333333',
                'line-width': 1.5
            }
        });
    }
    
    // 5. Apply Order with delay to ensure layers exist in Mapbox style
    setTimeout(() => {
        set_layer_order();
    }, 150);
}

function plot_data(geojson, formatted_day, formatted_category) {
    if (!geojson) return;

    // Update UI info
    $('#spcDataInfo').html(`<b>${formatted_category} - ${formatted_day}</b>`);

    update_map_layers(geojson);
}

function click_listener(e) {
    const feature = e.features?.[0];
    if (!feature) return;
    const label = feature.properties?.LABEL2 || feature.properties?.LABEL || 'SPC Outlook';
    new ModPopup(e.lngLat, `<strong>${label}</strong>`).add_to_map();
}

module.exports = plot_data;