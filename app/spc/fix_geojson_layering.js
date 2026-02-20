const turf = require('@turf/turf');

function fix_geojson_layering(geojson) {
    if (!geojson || !Array.isArray(geojson.features)) return geojson;

    const flattened = [];

    geojson.features.forEach(feature => {
        if (!feature.geometry) return;

        if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(coords => {
                flattened.push(
                    turf.polygon(coords, { ...feature.properties })
                );
            });
        } else if (feature.geometry.type === 'Polygon') {
            flattened.push(
                turf.polygon(feature.geometry.coordinates, { ...feature.properties })
            );
        }
    });

    flattened.forEach(f => {
        f.geometry = turf.rewind(f.geometry, { reverse: false });
    });

    return {
        type: 'FeatureCollection',
        features: flattened
    };
}

module.exports = fix_geojson_layering;