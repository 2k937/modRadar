const map = require('../core/map/map');
const armFunctions = require('../core/menu/atticRadarMenu');
const fetch_spc_data = require('./fetch_data');

/* ================= SAFE HIDE ================= */

function _hide_layers() {
    if (!map) return;

    if (map.getLayer && map.getLayer('spc_fill')) {
        map.removeLayer('spc_fill');
    }

    if (map.getLayer && map.getLayer('spc_border')) {
        map.removeLayer('spc_border');
    }

    if (map.getSource && map.getSource('spc_source')) {
        map.removeSource('spc_source');
    }
}

/* ================= TOGGLE SETUP ================= */

function _load_spc_toggleswitch(items_list) {
    if (typeof $ === 'undefined') return;

    items_list.forEach(([type, category, day]) => {

        const selector = `#armrSPC_${type}-${category}-${day}_BtnSwitchElem`;
        const elem = $(selector);

        if (!elem.length) return; // element not found → skip safely

        armFunctions.toggleswitchFunctions(
            elem,

            // ON
            function () {
                if (!map || !map.loaded || !map.loaded()) {
                    map.once('load', () => fetch_spc_data(type, category, day));
                    return;
                }

                // Uncheck all SPC toggles
                $('.spcToggleswitchBtn').each(function () {
                    this.checked = false;
                });

                // Check current one
                this.checked = true;

                fetch_spc_data(type, category, day);
            },

            // OFF
            function () {
                _hide_layers();
            }
        );
    });
}

/* ================= REGISTER TOGGLES ================= */

_load_spc_toggleswitch([
    ['convective', 'categorical', 'day1'],
    ['convective', 'categorical', 'day2'],
    ['convective', 'categorical', 'day3'],

    ['convective', 'probabilistic', 'day3'],

    ['convective', 'tornado', 'day1'],
    ['convective', 'tornado', 'day2'],

    ['convective', 'wind', 'day1'],
    ['convective', 'wind', 'day2'],

    ['convective', 'hail', 'day1'],
    ['convective', 'hail', 'day2'],
]);
