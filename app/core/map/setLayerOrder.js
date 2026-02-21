const map = require('./map');
const map_funcs = require('./mapFunctions');

function moveLayer(layerId, beforeLayer) {
    if (!map || !map.getLayer || !map.moveLayer) return;
    if (!map.getLayer(layerId)) return;

    try {
        if (beforeLayer && map.getLayer(beforeLayer)) {
            map.moveLayer(layerId, beforeLayer);
        } else {
            // If no beforeLayer, it moves to the very top of the stack
            map.moveLayer(layerId);
        }
    } catch (e) {
        console.warn(`Could not move layer: ${layerId}`, e);
    }
}

function moveGroup(layers, beforeLayer) {
    if (!Array.isArray(layers)) return;
    layers.forEach(layer => moveLayer(layer, beforeLayer));
}

/**
 * Specifically handles SPC layers to ensure fills are below lines
 */
function moveSPCLayers(beforeLayer) {
    const layers = map.getStyle()?.layers || [];
    
    // 1. Move Fills first (bottom of SPC stack)
    layers.filter(l => l.id.toLowerCase().includes('spc') && l.type === 'fill')
          .forEach(l => moveLayer(l.id, beforeLayer));

    // 2. Move Lines/Borders second
    layers.filter(l => l.id.toLowerCase().includes('spc') && l.type === 'line')
          .forEach(l => moveLayer(l.id, beforeLayer));

    // 3. Move Symbols/Labels (top of SPC stack)
    layers.filter(l => l.id.toLowerCase().includes('spc') && l.type === 'symbol')
          .forEach(l => moveLayer(l.id, beforeLayer));
}

function setLayerOrder() {
    if (!map || !map.loaded()) return;

    const beforeLayer = map_funcs?.get_base_layer?.(); 
    const atticData = typeof window !== 'undefined' ? window.atticData : null;

    // --- BOTTOM STACK (Fills & Radar) ---
    moveLayer('baseReflectivity', beforeLayer);
    moveSPCLayers(beforeLayer); // SPC fills will go here
    
    moveLayer('discussions_layer_fill', beforeLayer);
    moveLayer('watches_layer_fill', beforeLayer);
    moveLayer('alertsLayerFill', beforeLayer);

    // --- MIDDLE STACK (Lines & Outlines) ---
    moveLayer('station_range_layer');
    
    // Move Fronts here so they are above SPC polygons
    if (atticData?.surface_fronts_layers) {
        // We move the line layer specifically
        moveLayer('fronts_layer'); 
    }

    moveLayer('discussions_layer');
    moveLayer('watches_layer');
    moveLayer('alertsLayerOutline');
    moveLayer('alertsLayer');

    // --- TOP STACK (Icons, Symbols, Labels) ---
    // Icons for fronts (Triangles/Semicircles) must be above the lines
    moveLayer('front_symbols_layer'); 
    moveLayer('pressure_points_layer');

    moveLayer('radioStationLayer');
    moveLayer('tide_station_layer');

    moveGroup(atticData?.storm_track_layers);
    moveGroup(atticData?.tvs_layers);

    moveLayer('metarSymbolLayer');
    moveLayer('lightningLayer');
    moveLayer('stationSymbolLayer');

    moveGroup(atticData?.hurricane_layers);
}

module.exports = setLayerOrder;
