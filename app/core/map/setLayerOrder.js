const map = require('./map');
const map_funcs = require('./mapFunctions');

function moveLayer(layerId, beforeLayer) {
    if (!map || !map.getLayer(layerId)) return;
    try {
        const target = (beforeLayer && map.getLayer(beforeLayer)) ? beforeLayer : undefined;
        map.moveLayer(layerId, target);
    } catch (e) {}
}

function setLayerOrder() {
    if (!map || !map.loaded()) return;

    // Attempt to find the first label layer to stay UNDER city names
    const layers = map.getStyle().layers;
    const labelLayer = layers.find(l => l.type === 'symbol' && l.layout['text-field'])?.id;
    
    const beforeLayer = map_funcs?.get_base_layer?.() || labelLayer;

    // Move SPC Fills deep (above land, below roads/labels)
    moveLayer('spc_fill', beforeLayer);
    
    // Radar
    moveLayer('baseReflectivity', 'spc_fill');

    // SPC Borders (above fills/radar)
    moveLayer('spc_border', 'baseReflectivity');

    // Weather warnings/watches
    moveLayer('alertsLayerFill', 'spc_border');
    moveLayer('alertsLayerOutline', 'alertsLayerFill');
    
    // Everything else to top
    moveLayer('lightningLayer');
    moveLayer('stationSymbolLayer');
}

module.exports = setLayerOrder;