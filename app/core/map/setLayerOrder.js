const map = require('./map');
const map_funcs = require('./mapFunctions');

function move_layer_to_top(layer_name, before_layer) {
    if (!layer_name) return;
    if (!map.getLayer?.(layer_name)) return;

    if (before_layer) {
        map.moveLayer(layer_name, before_layer);
    } else {
        map.moveLayer(layer_name);
    }
}

function move_layer_group(layers, before_layer) {
    if (!Array.isArray(layers)) return;
    for (let i = 0; i < layers.length; i++) {
        move_layer_to_top(layers[i], before_layer);
    }
}

function setLayerOrder() {
    const before_layer = map_funcs.get_base_layer();

    move_layer_to_top('station_range_layer', before_layer);

    move_layer_to_top('spc_fill', before_layer);
    move_layer_to_top('spc_border', before_layer);

    move_layer_to_top('baseReflectivity', before_layer);

    move_layer_to_top('radioStationLayer');
    move_layer_to_top('tide_station_layer');

    move_layer_to_top('discussions_layer');
    move_layer_to_top('discussions_layer_fill');

    move_layer_to_top('watches_layer');
    move_layer_to_top('watches_layer_fill');

    move_layer_to_top('alertsLayerOutline');
    move_layer_to_top('alertsLayer');
    move_layer_to_top('alertsLayerFill');

    move_layer_group(window?.atticData?.storm_track_layers);
    move_layer_group(window?.atticData?.tvs_layers);

    move_layer_to_top('metarSymbolLayer');
    move_layer_to_top('lightningLayer');
    move_layer_to_top('stationSymbolLayer');

    const hurricane_layers = window?.atticData?.hurricane_layers;
    if (Array.isArray(hurricane_layers)) {
        move_layer_group(hurricane_layers);

        for (let i = 0; i < hurricane_layers.length; i++) {
            if (hurricane_layers[i].includes('hurricane_outlook_point')) {
                move_layer_to_top(hurricane_layers[i]);
            }
        }

        for (let i = 0; i < hurricane_layers.length; i++) {
            if (!hurricane_layers[i].includes('outlook')) {
                move_layer_to_top(hurricane_layers[i]);
            }
        }
    }

    const surface_fronts_layers = window?.atticData?.surface_fronts_layers;
    if (Array.isArray(surface_fronts_layers)) {
        move_layer_group(surface_fronts_layers);
        move_layer_to_top('pressure_points_layer');
    }
}

module.exports = setLayerOrder;
