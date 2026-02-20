const turf = require('@turf/turf');

function fix_geojson_layering(geojson) {

    if (!geojson || !geojson.features) return geojson;

    /* ------------------------------
       1. Flatten MultiPolygons
    ------------------------------ */

    const flattened = geojson.features.flatMap(feature => {
        if (!feature.geometry) return [];

        if (feature.geometry.type === 'MultiPolygon') {
            return turf.getCoords(feature).map(coords =>
                turf.polygon(coords, { ...feature.properties })
            );
        }

        if (feature.geometry.type === 'Polygon') {
            return feature;
        }

        return [];
    });

    /* ------------------------------
       2. Initialize zindex once
    ------------------------------ */

    flattened.forEach(f => {
        f.properties = f.properties || {};
        f.properties.zindex = 0;
    });

    /* ------------------------------
       3. Containment + hole merging
    ------------------------------ */

    for (let i = 0; i < flattened.length; i++) {
        const outer = flattened[i];

        for (let j = 0; j < flattened.length; j++) {
            if (i === j) continue;

            const inner = flattened[j];

            // If inner is fully within outer
            if (turf.booleanWithin(inner, outer)) {

                // Avoid duplicate merge
                const alreadyMerged = outer.geometry.coordinates.some(ring =>
                    turf.booleanEqual(
                        turf.polygon([ring]),
                        turf.polygon([inner.geometry.coordinates[0]])
                    )
                );

                if (!alreadyMerged) {
                    // Add as hole
                    outer.geometry.coordinates.push(
                        ...inner.geometry.coordinates
                    );

                    inner.properties.zindex = outer.properties.zindex + 1;
                }
            }
        }
    }

    geojson.features = flattened;
    return geojson;
}

module.exports = fix_geojson_layering;
