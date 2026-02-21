const turf = require('@turf/turf');

function fix_geojson_layering(geojson) {
    // SAFETY CHECK: If the fetch failed (403), geojson is undefined.
    // This stops the "Cannot read properties of undefined (reading 'flatMap')" error.
    if (!geojson || !geojson.features || !Array.isArray(geojson.features)) {
        console.error("SPC Data Error: No features found. The proxy might be blocked.");
        return { type: "FeatureCollection", features: [] };
    }

    // Now it is safe to use flatMap or forEach
    const flattenedFeatures = geojson.features.flatMap(feature => {
        if (!feature.geometry) return [];
        
        const props = feature.properties || {};
        
        if (feature.geometry.type === 'MultiPolygon') {
            return feature.geometry.coordinates.map(coords => turf.polygon(coords, props));
        } else if (feature.geometry.type === 'Polygon') {
            return [turf.polygon(feature.geometry.coordinates, props)];
        }
        return [];
    });

    const collection = turf.featureCollection(flattenedFeatures);

    try {
        // Mapbox requires the Right-Hand Rule (reverse: true) for fills to show up
        return turf.rewind(collection, { reverse: true, mutate: true });
    } catch (e) {
        return collection;
    }
}

module.exports = fix_geojson_layering;