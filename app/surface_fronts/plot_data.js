const map = require('../core/map/map');
const turf = require('@turf/turf');
const set_layer_order = require('../core/map/setLayerOrder');
const icons = require('../core/map/icons/icons');

const COLORS = {
    blue: 'rgb(0, 100, 245)',
    red: 'rgb(234, 51, 35)',
    purple: 'rgb(95, 54, 196)',
    orange: 'rgb(194, 115, 47)'
};

function wait_for_map_load(func) {
    if (map.loaded()) {
        func();
    } else {
        map.once('load', func);
    }
}

/**
 * Inserts a midpoint between every existing coordinate to allow 
 * for symbol placement and multi-colored stationary segments.
 */
const add_midpoints = (coords = []) => {
    const newCoords = [];
    for (let i = 0; i < coords.length - 1; i++) {
        const p1 = coords[i];
        const p2 = coords[i + 1];
        const mid = turf.midpoint(turf.point(p1), turf.point(p2)).geometry.coordinates;
        newCoords.push(p1, mid);
    }
    newCoords.push(coords[coords.length - 1]);
    return newCoords;
};

/* ================= FRONTS ================= */

function _return_fronts_linestrings(key, SurfaceFronts) {
    const baseFronts = SurfaceFronts?.fronts?.[key];
    if (!baseFronts) return [];

    const lines = [];

    baseFronts.forEach(base => {
        if (!base?.coordinates || base.coordinates.length < 2) return;

        // Add midpoints so we have segments to color differently for stationary fronts
        const coords = add_midpoints(base.coordinates);

        const properties = {
            width: key === 'trough' ? 2.5 : 4,
            dasharray: key === 'trough' ? [2, 3] : [],
            color: COLORS.blue, // default
            strength: base.strength || null
        };

        if (key === 'warm') properties.color = COLORS.red;
        if (key === 'occluded') properties.color = COLORS.purple;
        if (key === 'trough') properties.color = COLORS.orange;

        if (key === 'stationary') {
            // Alternating segments for stationary
            for (let n = 0; n < coords.length - 1; n++) {
                const isEven = n % 2 === 0;
                lines.push(turf.lineString([coords[n], coords[n + 1]], {
                    ...properties,
                    color: isEven ? COLORS.blue : COLORS.red
                }));
            }
        } else {
            lines.push(turf.lineString(coords, properties));
        }
    });

    return lines;
}

/* ================= PRESSURE ================= */

function _return_pressure_points(key, SurfaceFronts) {
    const container = SurfaceFronts?.[`${key}s`]?.[`${key}s_formatted`];
    if (!container) return [];

    return container
        .filter(p => p?.coordinates)
        .map(p => turf.point(p.coordinates, {
            letter: key === 'high' ? 'H' : 'L',
            color: key === 'high' ? COLORS.blue : COLORS.red,
            pressure: p.pressure || null
        }));
}

/* ================= SYMBOLS ================= */

function _return_symbols_points(key, SurfaceFronts) {
    const fronts = SurfaceFronts?.fronts?.[key];
    if (!fronts || key === 'trough') return [];

    const points = [];
    fronts.forEach(front => {
        const coords = add_midpoints(front.coordinates);
        
        // Symbols go on the midpoints (every odd index)
        for (let i = 1; i < coords.length; i += 2) {
            const prev = coords[i - 1];
            const next = coords[i + 1];
            if (!prev || !next) continue;

            const bearing = turf.bearing(turf.point(prev), turf.point(next));
            
            let symbolType = 'semicircle';
            if (key === 'cold') symbolType = 'triangle';
            if ((key === 'occluded' || key === 'stationary') && (i % 4 === 1)) {
                symbolType = 'triangle';
            }

            const isTriangle = symbolType === 'triangle';
            
            // Determine Color
            let colorStr = 'blue';
            if (key === 'warm') colorStr = 'red';
            if (key === 'occluded') colorStr = 'purple';
            if (key === 'stationary') colorStr = isTriangle ? 'blue' : 'red';

            points.push(turf.point(coords[i], {
                bearing,
                image: `${symbolType}_${colorStr}`,
                size: isTriangle ? 0.14 : 0.2,
                offset: isTriangle ? [0, 0] : [0, 10],
                modifier: -90
            }));
        }
    });

    return points;
}

/* ================= LAYER UTILS ================= */

function _updateOrAddSource(id, fc, layerConfig) {
    const sourceId = `${id}_source`;
    if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(fc);
    } else {
        map.addSource(sourceId, { type: 'geojson', data: fc });
    }

    if (!map.getLayer(id)) {
        map.addLayer({ ...layerConfig, id, source: sourceId });
    }
}

/* ================= MAIN ================= */

function plot_data(SurfaceFronts) {
    if (!SurfaceFronts) return;

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
        icons.add_icon_svg([
            [icons.icons.blue_triangle, 'triangle_blue'],
            [icons.icons.purple_triangle, 'triangle_purple'],
            [icons.icons.red_semicircle, 'semicircle_red'],
            [icons.icons.purple_semicircle, 'semicircle_purple']
        ], () => {
            _updateOrAddSource('fronts_layer', all_fronts, {
                type: 'line',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': ['get', 'width'],
                    'line-dasharray': ['get', 'dasharray']
                }
            });

            _updateOrAddSource('pressure_points_layer', all_pressure, {
                type: 'symbol',
                layout: {
                    'text-field': ['get', 'letter'],
                    'text-size': 40,
                    'text-font': ['Open Sans Bold'],
                    'text-allow-overlap': true
                },
                paint: { 'text-color': ['get', 'color'] }
            });

            _updateOrAddSource('front_symbols_layer', all_symbols, {
                type: 'symbol',
                layout: {
                    'icon-image': ['get', 'image'],
                    'icon-size': ['get', 'size'],
                    'icon-offset': ['get', 'offset'],
                    'icon-anchor': 'bottom',
                    'icon-rotate': ['+', ['get', 'modifier'], ['get', 'bearing']],
                    'icon-allow-overlap': true
                }
            });

            set_layer_order();
        });
    });
}

module.exports = plot_data;
