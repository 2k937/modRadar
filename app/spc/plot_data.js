const map = require('../core/map/map');
const set_layer_order = require('../core/map/setLayerOrder');
const turf = require('@turf/turf');
const luxon = require('luxon');
const ModPopup = require('../core/popup/ModPopup');
const ut = require('../core/utils');

function return_time_range(json) {
    if (!json?.features?.length) return ['', ''];

    let issue;
    let expire;

    turf.propEach(json, props => {
        issue = props.ISSUE;
        expire = props.EXPIRE;
    });

    if (!issue || !expire) return ['', ''];

    const parse = str => {
        const d = luxon.DateTime.fromFormat(str, 'yyyyMMddHHmm', { zone: 'UTC' });
        return d.isValid ? d.toLocal().toFormat('EEE MMM d, h:mm a') : '';
    };

    return [parse(issue), parse(expire)];
}

function return_time_range_html(issue, expire) {
    if (!issue && !expire) return '';
    return `
<p style="margin:0;font-size:11px">&nbsp;&nbsp;&nbsp;${issue} thru</p>
<p style="margin:0;font-size:11px">&nbsp;&nbsp;&nbsp;${expire}</p>`;
}

function hide_layers() {
    if (map.getLayer?.('spc_fill')) map.removeLayer('spc_fill');
    if (map.getLayer?.('spc_border')) map.removeLayer('spc_border');
    if (map.getSource?.('spc_source')) map.removeSource('spc_source');
}

function get_text_url(category, day) {
    if (category === 'Categorical') {
        return `https://tgftp.nws.noaa.gov/data/raw/ac/acus0${day}.kwns.swo.dy${day}.txt`;
    }
    return null;
}

function click_listener(e) {
    const feature = e.features?.[0];
    if (!feature || feature.layer.id === 'stationSymbolLayer') return;

    let current_info = $('#spcDataInfo').find('b').text();
    const parts = current_info.split(' ');
    const category = parts[0];
    const day = parts[parts.length - 1];

    const text_url = get_text_url(category, day);

    if (text_url) {
        fetch(ut.phpProxy + text_url)
            .then(r => r.text())
            .then(text => console.log(text))
            .catch(err => console.error(err));
    }

    const popup_html = `<div><b>${feature.properties?.LABEL2 || ''}</b></div>`;
    new ModPopup(e.lngLat, popup_html).add_to_map();
}

function plot_data(geojson, formatted_day, formatted_category) {
    if (!geojson) return;

    const is_empty = !geojson.features?.length;
    const [issue, expire] = return_time_range(geojson);

    let html = `<b>${formatted_category} - ${formatted_day}</b>`;

    if (is_empty) {
        html += `<p style="margin:0;font-size:13px;font-weight:bold" class="old-file">EMPTY DATA</p>`;
    }

    html += `<i class="helperText" style="opacity:50%">
${return_time_range_html(issue, expire)}
</i>`;

    $('#spcDataInfo').html(html);

    hide_layers();

    map.addSource('spc_source', {
        type: 'geojson',
        data: geojson
    });

    map.addLayer({
        id: 'spc_fill',
        type: 'fill',
        source: 'spc_source',
        paint: {
            'fill-outline-color': ['get', 'stroke'],
            'fill-color': ['get', 'fill'],
            'fill-opacity': 1
        },
        layout: {
            'fill-sort-key': ['get', 'zindex']
        }
    });

    map.addLayer({
        id: 'spc_border',
        type: 'line',
        source: 'spc_source',
        paint: {
            'line-color': ['get', 'stroke'],
            'line-width': 3
        },
        layout: {
            'line-sort-key': ['get', 'zindex']
        }
    });

    set_layer_order();

    map.off('click', 'spc_fill', click_listener);
    map.on('click', 'spc_fill', click_listener);
}

module.exports = plot_data;
