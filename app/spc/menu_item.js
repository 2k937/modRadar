const map = require('../core/map/map');
const armFunctions = require('../core/menu/atticRadarMenu');
const fetch_spc_data = require('./fetch_data');

function hide_layers() {
    if (!map || !map.getStyle) return;

    const style = map.getStyle();
    if (!style) return;

    style.layers.forEach(layer => {
        if (layer.id.toLowerCase().includes('spc')) {
            if (map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
            }
        }
    });

    Object.keys(style.sources).forEach(sourceId => {
        if (sourceId.toLowerCase().includes('spc')) {
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
        }
    });
}

function load_spc_toggleswitch(items_list) {
    if (typeof $ === 'undefined' || !map) return;

    items_list.forEach(([type, category, day]) => {
        const selector = `#armrSPC_${type}-${category}-${day}_BtnSwitchElem`;
        const elem = $(selector);
        if (!elem.length) return;

        armFunctions.toggleswitchFunctions(
            elem,

            function () {
                const run = () => {
                    hide_layers();
                    $('.spcToggleswitchBtn').prop('checked', false);
                    elem.prop('checked', true);
                    fetch_spc_data(type, category, day);
                };

                if (!map.loaded()) {
                    map.once('load', run);
                } else {
                    run();
                }
            },

            function () {
                hide_layers();
            }
        );
    });
}

load_spc_toggleswitch([
    ['convective', 'categorical', 'day1'],
    ['convective', 'categorical', 'day2'],
    ['convective', 'categorical', 'day3'],
    ['convective', 'probabilistic', 'day3'],
    ['convective', 'tornado', 'day1'],
    ['convective', 'tornado', 'day2'],
    ['convective', 'wind', 'day1'],
    ['convective', 'wind', 'day2'],
    ['convective', 'hail', 'day1'],
    ['convective', 'hail', 'day2']
]);