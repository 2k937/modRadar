const map = require('./map');
const map_funcs = require('./mapFunctions');

function moveLayer(layerId, beforeLayer) {
    if (!map || !map.getLayer || !map.moveLayer) return;
    if (!map.getLayer(layerId)) return;

    if (beforeLayer && map.getLayer(beforeLayer)) {
        map.moveLayer(layerId, beforeLayer);
    } else {
        map.moveLayer(layerId);
    }
}

function moveGroup(layers, beforeLayer) {
    if (!Array.isArray(layers)) return;
    layers.forEach(layer => moveLayer(layer, beforeLayer));
}

function moveSPCLayers(beforeLayer) {
    const layers = map.getStyle()?.layers || [];
    layers.forEach(layer => {
        if (layer.id.toLowerCase().includes('spc')) {
            moveLayer(layer.id, beforeLayer);
        }
    });
}

function setLayerOrder() {
    if (!map) return;

    const beforeLayer = map_funcs?.get_base_layer?.();
    const atticData = typeof window !== 'undefined' ? window.atticData : null;

    moveLayer('station_range_layer', beforeLayer);

    // Move ALL SPC layers (fill, border, day1, day2, prob, etc.)
    moveSPCLayers(beforeLayer);

    moveGroup(atticData?.surface_fronts_layers);
    moveLayer('pressure_points_layer');

    moveLayer('baseReflectivity', beforeLayer);

    moveLayer('radioStationLayer');
    moveLayer('tide_station_layer');

    moveLayer('discussions_layer');
    moveLayer('discussions_layer_fill');

    moveLayer('watches_layer');
    moveLayer('watches_layer_fill');

    moveLayer('alertsLayerOutline');
    moveLayer('alertsLayer');
    moveLayer('alertsLayerFill');

    moveGroup(atticData?.storm_track_layers);
    moveGroup(atticData?.tvs_layers);

    moveLayer('metarSymbolLayer');
    moveLayer('lightningLayer');
    moveLayer('stationSymbolLayer');

    moveGroup(atticData?.hurricane_layers);
}

module.exports = setLayerOrder;