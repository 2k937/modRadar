const SurfaceFronts = require('./SurfaceFronts');
const plot_data = require('./plot_data');
const ut = require('../core/utils');

let latestFrontsRequestId = 0;

function _remove_empty_strings_from_array(array) {
    return array.filter(line => line.trim() !== '');
}

function normalizeText(text) {
    // safer than replaceAll for broader compatibility
    return text.replace(/\r/g, '');
}

function fetch_data() {

    const hires_file_url = `https://tgftp.nws.noaa.gov/data/raw/as/asus02.kwbc.cod.sus.txt`;
    const lowres_file_url = `https://tgftp.nws.noaa.gov/data/raw/as/asus01.kwbc.cod.sus.txt`;

    const requestId = ++latestFrontsRequestId;

    function fetchFile(url) {
        return fetch(ut.phpProxy + url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.text();
            });
    }

    // Try hires first
    fetchFile(hires_file_url)
        .catch(() => {
            console.warn('Hires failed. Falling back to lowres.');
            return fetchFile(lowres_file_url);
        })
        .then(data => {

            if (requestId !== latestFrontsRequestId) return;

            if (!data || typeof data !== 'string') {
                throw new Error('Invalid surface fronts text');
            }

            let formatted_lines = normalizeText(data).split('\n');
            formatted_lines = _remove_empty_strings_from_array(formatted_lines);
            formatted_lines = formatted_lines.join('\n');

            if (!formatted_lines.length) {
                throw new Error('Empty surface fronts file');
            }

            const fronts = new SurfaceFronts(formatted_lines);

            plot_data(fronts);
        })
        .catch(error => {
            console.error('Surface Fronts fetch error:', error);
        });
}

module.exports = fetch_data;
