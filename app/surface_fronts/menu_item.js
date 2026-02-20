const fetch_data = require('./fetch_data');
const armFunctions = require('../core/menu/atticRadarMenu');
const map = require('../core/map/map');

const div_elem = '#surfaceFrontsMenuItemDiv';
const icon_elem = '#surfaceFrontsMenuItemIcon';

const surface_fronts_layers = [
    'fronts_layer',
    'pressure_points_layer',
    'front_symbols_layer',
];

// Ensure atticData exists
if (!window.atticData) {
    window.atticData = {};
}
window.atticData.surface_fronts_layers = surface_fronts_layers;

// Safe helper
function safeSetVisibility(layerId, visibility) {
    if (map.getLayer && map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visibility);
    }
}

function enableSurfaceFronts() {
    if (!map || !map.loaded || !map.loaded()) {
        map.once('load', enableSurfaceFronts);
        return;
    }

    if (map.getLayer(surface_fronts_layers[0])) {
        // Layers already exist → just show them
        surface_fronts_layers.forEach(layer =>
            safeSetVisibility(layer, 'visible')
        );
    } else {
        // Layers don't exist → fetch & add
        fetch_data();
    }
}

function disableSurfaceFronts() {
    surface_fronts_layers.forEach(layer =>
        safeSetVisibility(layer, 'none')
    );
}

// Ensure jQuery exists before using it
if (typeof $ !== 'undefined') {
    armFunctions.toggleswitchFunctions(
        $('#armrSurfaceFrontsBtnSwitchElem'),
        enableSurfaceFronts,
        disableSurfaceFronts
    );
}
