const map = require('../core/map/map');
const turf = require('@turf/turf');
const set_layer_order = require('../core/map/setLayerOrder');
const icons = require('../core/map/icons/icons');

/**
 * https://www.wpc.ncep.noaa.gov/html/fntcodes2.shtml
 */

const blue = 'rgb(0, 100, 245)';
const red = 'rgb(234, 51, 35)';
const purple = 'rgb(95, 54, 196)';
const orange = 'rgb(194, 115, 47)';

function wait_for_map_load(func) {
    if (map.loaded && map.loaded()) {
        func();
    } else {
        map.on('load', func);
    }
}

function _copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/* ================= MIDPOINT ================= */

const calculate_midpoint = (p1, p2) =>
    turf.midpoint(turf.point(p1), turf.point(p2)).geometry.coordinates;

const add_midpoints = (array = []) =>
    array.flatMap((point, i) =>
        i < array.length - 1
            ? [point, calculate_midpoint(point, array[i + 1])]
            : [point]
    );

/* ================= FRONTS ================= */

function _return_fronts_linestrings(key, SurfaceFronts) {
    if (!SurfaceFronts?.fronts?.[key]) return [];

    const baseFronts = SurfaceFronts.fronts[key];
    const lines = [];

    for (let i = 0; i < baseFronts.length; i++) {
        const base = baseFronts[i];
        if (!base?.coordinates?.length) continue;

        const coords = add_midpoints(_copy(base.coordinates));

        const properties = {
            width: 4,
            dasharray: [],
            strength: base.strength || null
        };

        if (key === 'warm') properties.color = red;
        else if (key === 'cold') properties.color = blue;
        else if (key === 'occluded') properties.color = purple;
        else if (key === 'trough') {
            properties.color = orange;
            properties.width = 2.5;
            properties.dasharray = [2, 3];
        }

        if (key === 'stationary') {
            let last_color = red;

            for (let n = 0; n < coords.length - 2; n += 2) {
                last_color = last_color === red ? blue : red;

                const sub_array = coords.slice(n, n + 3);
                if (sub_array.length < 2) continue;

                const lineProps = _copy(properties);
                lineProps.color = last_color;

                lines.push(turf.lineString(sub_array, lineProps));
            }
        } else {
            if (coords.length >= 2) {
                lines.push(turf.lineString(coords, properties));
            }
        }
    }

    return lines;
}

/* ================= PRESSURE ================= */

function _return_pressure_points(key, SurfaceFronts) {
    const container = SurfaceFronts?.[`${key}s`]?.[`${key}s_formatted`];
    if (!container) return [];

    const properties = {};
    if (key === 'high') {
        properties.color = blue;
        properties.letter = 'H';
    } else {
        properties.color = red;
        properties.letter = 'L';
    }

    return container
        .filter(p => p?.coordinates)
        .map(p =>
            turf.point(p.coordinates, {
                ...properties,
                pressure: p.pressure || null
            })
        );
}

/* ================= SYMBOLS ================= */

function _return_symbols_points(key, SurfaceFronts) {
    if (!SurfaceFronts?.fronts?.[key]) return [];

    const semicircle_offset = [0, 10];
    const semicircle_size = 0.2;
    const semicircle_modifier = -90;

    const triangle_offset = [0, 0];
    const triangle_size = 0.14;
    const triangle_modifier = -90;

    const points = [];
    const fronts = SurfaceFronts.fronts[key];

    for (let n = 0; n < fronts.length; n++) {
        const coords = fronts[n]?.coordinates;
        if (!coords?.length) continue;

        let last_symbol = 'semicircle';

        for (let i = 0; i < coords.length - 1; i++) {
            if (i % 2 !== 0) continue; // only midpoints

            const current = coords[i];
            const next = coords[i + 1];
            if (!current || !next) continue;

            const bearing = turf.bearing(
                turf.point(current),
                turf.point(next)
            );

            let properties = {
                bearing
            };

            if (key === 'warm') {
                properties = {
                    ...properties,
                    image: 'semicircle_red',
                    size: semicircle_size,
                    offset: semicircle_offset,
                    modifier: semicircle_modifier
                };
            } else if (key === 'cold') {
                properties = {
                    ...properties,
                    image: 'triangle_blue',
                    size: triangle_size,
                    offset: triangle_offset,
                    modifier: triangle_modifier
                };
            } else if (key === 'occluded' || key === 'stationary') {
                last_symbol =
                    last_symbol === 'semicircle' ? 'triangle' : 'semicircle';

                const isTriangle = last_symbol === 'triangle';

                properties = {
                    ...properties,
                    image:
                        key === 'occluded'
                            ? `${last_symbol}_purple`
                            : isTriangle
                                ? 'triangle_blue'
                                : 'semicircle_red',
                    size: isTriangle ? triangle_size : semicircle_size,
                    offset: isTriangle ? triangle_offset : semicircle_offset,
                    modifier: isTriangle
                        ? triangle_modifier
                        : semicircle_modifier
                };
            }

            const midpoint = turf.point(current, properties);
            points.push(midpoint);
        }
    }

    return points;
}

/* ================= MAP LAYERS ================= */

function _safeAddLayer(layer) {
    if (map.getLayer(layer.id)) {
        map.removeLayer(layer.id);
    }
    map.addLayer(layer);
}

function _add_fronts_layer(fc) {
    _safeAddLayer({
        id: 'fronts_layer',
        type: 'line',
        source: { type: 'geojson', data: fc },
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'width'],
            'line-dasharray': ['get', 'dasharray']
        }
    });
}

function _add_pressure_point_layer(fc) {
    _safeAddLayer({
        id: 'pressure_points_layer',
        type: 'symbol',
        source: { type: 'geojson', data: fc },
        layout: {
            'text-field': ['get', 'letter'],
            'text-size': 50,
            'text-font': ['Open Sans Bold']
        },
        paint: {
            'text-color': ['get', 'color']
        }
    });
}

function _add_front_symbols_layer(fc) {
    _safeAddLayer({
        id: 'front_symbols_layer',
        type: 'symbol',
        source: { type: 'geojson', data: fc },
        layout: {
            'icon-image': ['get', 'image'],
            'icon-size': ['get', 'size'],
            'icon-offset': ['get', 'offset'],
            'icon-anchor': 'bottom',
            'icon-rotate': ['+', ['get', 'modifier'], ['get', 'bearing']]
        }
    });
}

/* ================= MAIN ================= */

function plot_data(SurfaceFronts) {
    const all_fronts = turf.featureCollection([
        ..._return_fronts_linestrings('warm', SurfaceFronts),
        ..._return_fronts_linestrings('cold', SurfaceFronts),
        ..._return_fronts_linestrings('occluded', SurfaceFronts),
        ..._return_fronts_linestrings('trough', SurfaceFronts),
        ..._return_fronts_linestrings('stationary', SurfaceFronts)
    ]);

    const all_symbols = turf.featureCollection([
        ..._return_symbols_points('warm', SurfaceFronts),
        ..._return_symbols_points('cold', SurfaceFronts),
        ..._return_symbols_points('occluded', SurfaceFronts),
        ..._return_symbols_points('stationary', SurfaceFronts)
    ]);

    const all_pressure = turf.featureCollection([
        ..._return_pressure_points('high', SurfaceFronts),
        ..._return_pressure_points('low', SurfaceFronts)
    ]);

    wait_for_map_load(() => {
        icons.add_icon_svg(
            [
                [icons.icons.blue_triangle, 'triangle_blue'],
                [icons.icons.purple_triangle, 'triangle_purple'],
                [icons.icons.red_semicircle, 'semicircle_red'],
                [icons.icons.purple_semicircle, 'semicircle_purple']
            ],
            () => {
                _add_fronts_layer(all_fronts);
                _add_pressure_point_layer(all_pressure);
                _add_front_symbols_layer(all_symbols);
                set_layer_order();
            }
        );
    });
}

module.exports = plot_data;
