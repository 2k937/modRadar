const map = require('../core/map/map');
const set_layer_order = require('../core/map/setLayerOrder');
const turf = require('@turf/turf');
const luxon = require('luxon');
 const ModPopup = require('../core/popup/ModPopup'); // FIXED
const ut = require('../core/utils');

function _return_time_range(json) {
    if (!json || !json.features || json.features.length === 0) {
        return ['', ''];
    }

    let issue;
    let expire;

    turf.propEach(json, (current_properties) => {
        expire = current_properties.EXPIRE;
        issue = current_properties.ISSUE;
    });

    if (!issue || !expire) return ['', ''];

    function _parse_format_date_string(date_string) {
        const date = luxon.DateTime.fromFormat(
            date_string,
            'yyyyMMddHHmm',
            { zone: 'UTC' }
        );

        if (!date.isValid) return '';

        return date.toLocal().toFormat('EEE MMM d, h:mm a');
    }

    const issue_formatted = _parse_format_date_string(issue);
    const expire_formatted = _parse_format_date_string(expire);

    return [issue_formatted, expire_formatted];
}

function _return_time_range_html(issue_formatted, expire_formatted) {
    if (!issue_formatted && !expire_formatted) return '';

    return `
<p style="margin: 0px; font-size: 11px">&nbsp;&nbsp;&nbsp;${issue_formatted} thru</p>
<p style="margin: 0px; font-size: 11px">&nbsp;&nbsp;&nbsp;${expire_formatted}</p>`;
}

function _hide_layers() {
    if (map.getLayer('spc_fill')) {
        map.removeLayer('spc_fill');
    }

    if (map.getLayer('spc_border')) {
        map.removeLayer('spc_border');
    }

    if (map.getSource('spc_source')) {
        map.removeSource('spc_source');
    }
}

function _get_text_url(category, day) {
    if (category === 'Categorical') {
        return `https://tgftp.nws.noaa.gov/data/raw/ac/acus0${day}.kwns.swo.dy${day}.txt`;
    }
    return null;
}

function _click_listener(e) {
    const features = map.queryRenderedFeatures(e.point);
    if (!features.length) return;

    if (features[0].layer.id === "stationSymbolLayer") return;

    const properties = e.features?.[0]?.properties;
    if (!properties) return;

    let current_info = $('#spcDataInfo').find('b').text();
    current_info = current_info.split(' ');
    const category = current_info[0];
    const day = current_info[current_info.length - 1];

    const text_url = _get_text_url(category, day);

    if (text_url) {
        fetch(ut.phpProxy + text_url)
            .then(response => response.text())
            .then(text => {
                console.log(text);
            })
            .catch(err => console.error(err));
    }

    const popup_html = `
<div><b>${properties.LABEL2 || ''}</b></div>
`;

    new AtticPopup(e.lngLat, popup_html).add_to_map();
}

function plot_data(geojson, formatted_day, formatted_category) {
    if (!geojson) return;

    const is_empty = !geojson.features || geojson.features.length === 0;

    const [issue_formatted, expire_formatted] =
        _return_time_range(geojson);

    let spc_info_html =
`<b>${formatted_category} - ${formatted_day}</b>`;

    if (is_empty) {
        spc_info_html +=
`<p style="margin: 0px; font-size: 13px; font-weight: bold" class="old-file">EMPTY DATA</p>`;
    }

    spc_info_html +=
`<i class="helperText" style="opacity: 50%">
${_return_time_range_html(issue_formatted, expire_formatted)}
</i>`;

    $('#spcDataInfo').html(spc_info_html);

    _hide_layers();

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
            'fill-opacity': 1,
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

    map.off('click', 'spc_fill', _click_listener);
    map.on('click', 'spc_fill', _click_listener);
}

module.exports = plot_data;
