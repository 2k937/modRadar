const turf = require('@turf/turf');

function fix_geojson_layering(geojson) {
    if (!geojson || !geojson.features) return geojson;

    const flattened = geojson.features.flatMap(feature => {
        if (!feature.geometry) return [];
        if (feature.geometry.type === 'MultiPolygon') {
            return feature.geometry.coordinates.map(coords =>
                turf.polygon(coords, { ...feature.properties })
            );
        }
        if (feature.geometry.type === 'Polygon') {
            return turf.polygon(feature.geometry.coordinates, { ...feature.properties });
        }
        return [];
    });

    flattened.forEach(f => {
        f.properties = f.properties || {};
        f.properties.zindex = 0;
    });

    for (let i = 0; i < flattened.length; i++) {
        let depth = 0;
        for (let j = 0; j < flattened.length; j++) {
            if (i === j) continue;
            if (
                turf.booleanIntersects(flattened[i], flattened[j]) &&
                turf.booleanWithin(flattened[i], flattened[j])
            ) {
                depth++;
            }
        }
        flattened[i].properties.zindex = depth;
    }

    for (let i = 0; i < flattened.length; i++) {
        for (let j = 0; j < flattened.length; j++) {
            if (i === j) continue;
            if (
                flattened[j].properties.zindex === flattened[i].properties.zindex + 1 &&
                turf.booleanWithin(flattened[j], flattened[i])
            ) {
                flattened[i].geometry.coordinates.push(
                    ...flattened[j].geometry.coordinates
                );
            }
        }
        flattened[i].geometry = turf.rewind(flattened[i].geometry, { reverse: false });
    }

    geojson.features = flattened;
    return geojson;
}

module.exports = fix_geojson_layering;
