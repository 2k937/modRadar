const map = require('./map');
const map_funcs = require('./mapFunctions');

function move_layer_to_top(layer_name, before_layer) {
    if (!layer_name) return;
    if (!map || typeof map.moveLayer !== 'function') return;
    if (!map.getLayer || !map.getLayer(layer_name)) return;

    // Prevent moving before itself
    if (before_layer && layer_name === before_layer) return;

    // If before_layer doesn't exist, ignore it
    if (before_layer && map.getLayer(before_layer)) {
        map.moveLayer(layer_name, before_layer);
    } else {
        map.moveLayer(layer_name);
    }
}

function move_layer_group(layers, before_layer) {
    if (!Array.isArray(layers)) return;

    for (const layer of layers) {
        move_layer_to_top(layer, before_layer);
    }
}

function setLayerOrder() {
    if (!map) return;

    const before_layer = map_funcs?.get_base_layer?.();

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

    const atticData = typeof window !== 'undefined' ? window.atticData : null;

    move_layer_group(atticData?.storm_track_layers);
    move_layer_group(atticData?.tvs_layers);

    move_layer_to_top('metarSymbolLayer');
    move_layer_to_top('lightningLayer');
    move_layer_to_top('stationSymbolLayer');

    const hurricane_layers = atticData?.hurricane_layers;
    if (Array.isArray(hurricane_layers)) {

        move_layer_group(hurricane_layers);

        for (const layer of hurricane_layers) {
            if (typeof layer === 'string' && layer.includes('hurricane_outlook_point')) {
                move_layer_to_top(layer);
            }
        }

        for (const layer of hurricane_layers) {
            if (typeof layer === 'string' && !layer.includes('outlook')) {
                move_layer_to_top(layer);
            }
        }
    }

    const surface_fronts_layers = atticData?.surface_fronts_layers;
    if (Array.isArray(surface_fronts_layers)) {
        move_layer_group(surface_fronts_layers);
        move_layer_to_top('pressure_points_layer');
    }
}

module.exports = setLayerOrder;