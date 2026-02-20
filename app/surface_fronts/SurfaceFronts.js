/**
 * https://www.wpc.ncep.noaa.gov/html/read_coded_bull.shtml
 */

const FRONTAL_TYPES = ['WARM', 'COLD', 'STNRY', 'OCFNT', 'TROF'];
const FRONTAL_STRENGTH_TYPES = ['WK', 'MDT', 'STG'];

class SurfaceFronts {
    constructor(raw_text) {
        this._extra = {};
        this.lines = this._removeEmpty(raw_text.split('\n'));

        this.parse_header();
        this.parse_highs_lows();
        this.parse_fronts();
    }

    /* ================= HEADER ================= */

    parse_header() {
        this.header = {};
        const header_lines = this.lines.slice(0, 6);

        this.header.message_type = header_lines[1] || null;
        this.header.message_description = header_lines[2] || null;
        this.header.message_author = header_lines[3] || null;
        this.header.date_string = header_lines[4] || null;
        this.header.valid_time = header_lines[5] || null;
    }

    /* ================= HIGHS & LOWS ================= */

    parse_highs_lows() {
        this.highs = { highs_formatted: [] };
        this.lows = { lows_formatted: [] };

        let highs_lows_lines = [];

        for (let i = 6; i < this.lines.length; i++) {
            if (FRONTAL_TYPES.some(type => this.lines[i].startsWith(type))) {
                this._extra.fronts_pointer = i;
                break;
            } else {
                highs_lows_lines.push(this.lines[i]);
            }
        }

        const combined = highs_lows_lines.join(' ');
        const split = combined.split('LOWS');

        if (split.length < 2) return;

        const highs_raw = split[0];
        const lows_raw = 'LOWS' + split[1];

        this.highs.highs_formatted = this._parse_highs_lows_raw(highs_raw);
        this.lows.lows_formatted = this._parse_highs_lows_raw(lows_raw);
    }

    _parse_highs_lows_raw(data) {
        data = data.replace('HIGHS', '').replace('LOWS', '');

        const parts = this._removeEmpty(data.split(' '));
        const pressures = [];
        const coordinates = [];

        if (parts.length === 0) return [];

        // Remove bad first value if not pressure
        if (!(parseInt(parts[0]) > 800 && parseInt(parts[0]) < 1200)) {
            parts.shift();
        }

        for (let i = 0; i < parts.length; i++) {
            if (i % 2 === 0) {
                const pressure = parseInt(parts[i]);
                if (!isNaN(pressure)) pressures.push(pressure);
            } else {
                const coord = this._parse_coordinates(parts[i]);
                if (coord) coordinates.push(coord);
            }
        }

        return pressures.map((p, i) => ({
            pressure: p,
            coordinates: coordinates[i] || null
        }));
    }

    /* ================= FRONTS ================= */

    parse_fronts() {
        this.fronts = {
            warm: [],
            cold: [],
            stationary: [],
            occluded: [],
            trough: []
        };

        let last_front_type = null;
        const start = this._extra.fronts_pointer || 0;
        const front_lines = this.lines.slice(start);

        for (let line of front_lines) {
            const parts = this._removeEmpty(line.split(' '));
            if (!parts.length) continue;

            if (FRONTAL_TYPES.includes(parts[0])) {
                const typeKey = this._parse_front_type(parts[0]);
                last_front_type = typeKey;

                const strength = this._parse_frontal_strength(parts[1]);
                const sliceIndex = strength ? 2 : 1;

                const coords = this._parse_front_row(parts.slice(sliceIndex));

                this.fronts[typeKey].push({
                    strength: strength,
                    coordinates: coords
                });

            } else if (last_front_type) {
                const coords = this._parse_front_row(parts);
                const group = this.fronts[last_front_type];

                if (group.length && coords.length) {
                    group[group.length - 1].coordinates.push(...coords);
                }
            }
        }
    }

    _parse_front_row(rows) {
        const parsed = [];

        for (let row of rows) {
            const coord = this._parse_coordinates(row);
            if (coord) parsed.push(coord);
        }

        return parsed;
    }

    /* ================= HELPERS ================= */

    _parse_coordinates(coordString) {
        if (!coordString || coordString.length < 4) return null;

        const split_pos = Math.floor(coordString.length / 2);
        let lat = coordString.slice(0, split_pos);
        let lon = coordString.slice(split_pos);

        if (lat.length < 3 || lon.length < 3) return null;

        lat = parseFloat(lat.slice(0, 2) + '.' + lat.slice(2));
        lon = -parseFloat(lon.slice(0, 3) + '.' + lon.slice(3));

        if (isNaN(lat) || isNaN(lon)) return null;

        return [lon, lat];
    }

    _parse_front_type(abbv) {
        switch (abbv) {
            case 'WARM': return 'warm';
            case 'COLD': return 'cold';
            case 'STNRY': return 'stationary';
            case 'OCFNT': return 'occluded';
            case 'TROF': return 'trough';
            default: return 'unknown';
        }
    }

    _parse_frontal_strength(abbv) {
        switch (abbv) {
            case 'WK': return 'weak';
            case 'MDT': return 'moderate';
            case 'STG': return 'strong';
            default: return null;
        }
    }

    _removeEmpty(arr) {
        return arr.filter(x => x && x.trim() !== '');
    }
}

module.exports = SurfaceFronts;
