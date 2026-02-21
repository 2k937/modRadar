const fetch_data = require('./fetch_data');
const armFunctions = require('../core/menu/atticRadarMenu');
const map = require('../core/map/map');

const surface_fronts_layers = [
    'fronts_layer',
    'pressure_points_layer',
    'front_symbols_layer',
];

// State tracking to prevent "ghost" layers if fetch finishes after disable
let isEnabled = false;

function enableSurfaceFronts() {
    isEnabled = true;
    
    if (!map.loaded()) {
        map.once('load', enableSurfaceFronts);
        return;
    }

    // Check if the FIRST layer exists in the style
    if (map.getLayer(surface_fronts_layers[0])) {
        surface_fronts_layers.forEach(layer => {
            if (map.getLayer(layer)) {
                map.setLayoutProperty(layer, 'visibility', 'visible');
            }
        });
    } else {
        // Only fetch if we aren't already in the middle of a request
        // and ensure the user still wants them enabled when the data arrives
        fetch_data().then(() => {
            if (!isEnabled) disableSurfaceFronts();
        }).catch(err => console.error("Fronts fetch failed:", err));
    }
}

function disableSurfaceFronts() {
    isEnabled = false;
    surface_fronts_layers.forEach(layer => {
        if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, 'visibility', 'none');
        }
    });
}

// Initialization
if (typeof $ !== 'undefined') {
    $(document).ready(() => {
        armFunctions.toggleswitchFunctions(
            $('#armrSurfaceFrontsBtnSwitchElem'),
            enableSurfaceFronts,
            disableSurfaceFronts
        );
    });
}
