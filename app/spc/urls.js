// https://www.spc.noaa.gov/gis/

const BASE = 'https://www.spc.noaa.gov/products';

const urls = {
    convective: {
        categorical: {
            day1: `${BASE}/outlook/day1otlk_cat.lyr.geojson`,
            day2: `${BASE}/outlook/day2otlk_cat.lyr.geojson`,
            day3: `${BASE}/outlook/day3otlk_cat.lyr.geojson`,
        },

        probabilistic: {
            day3: `${BASE}/outlook/day3otlk_prob.lyr.geojson`,
            day4: `${BASE}/exper/day4-8/day4prob.lyr.geojson`,
            day5: `${BASE}/exper/day4-8/day5prob.lyr.geojson`,
            day6: `${BASE}/exper/day4-8/day6prob.lyr.geojson`,
            day7: `${BASE}/exper/day4-8/day7prob.lyr.geojson`,
            day8: `${BASE}/exper/day4-8/day8prob.lyr.geojson`,
        },

        significant_probabilistic: {
            day3: `${BASE}/outlook/day3otlk_sigprob.lyr.geojson`,
        },

        tornado: {
            day1: `${BASE}/outlook/day1otlk_torn.lyr.geojson`,
            day2: `${BASE}/outlook/day2otlk_torn.lyr.geojson`,
        },

        significant_tornado: {
            day1: `${BASE}/outlook/day1otlk_sigtorn.lyr.geojson`,
            day2: `${BASE}/outlook/day2otlk_sigtorn.lyr.geojson`,
        },

        wind: {
            day1: `${BASE}/outlook/day1otlk_wind.lyr.geojson`,
            day2: `${BASE}/outlook/day2otlk_wind.lyr.geojson`,
        },

        significant_wind: {
            day1: `${BASE}/outlook/day1otlk_sigwind.lyr.geojson`,
            day2: `${BASE}/outlook/day2otlk_sigwind.lyr.geojson`,
        },

        hail: {
            day1: `${BASE}/outlook/day1otlk_hail.lyr.geojson`,
            day2: `${BASE}/outlook/day2otlk_hail.lyr.geojson`,
        },

        significant_hail: {
            day1: `${BASE}/outlook/day1otlk_sighail.lyr.geojson`,
            day2: `${BASE}/outlook/day2otlk_sighail.lyr.geojson`,
        }
    },

    fire: {
        dryt: {
            day1: `${BASE}/fire_wx/day1fw_dryt.lyr.geojson`,
            day2: `${BASE}/fire_wx/day2fw_dryt.lyr.geojson`
        },

        windrh: {
            day1: `${BASE}/fire_wx/day1fw_windrh.lyr.geojson`,
            day2: `${BASE}/fire_wx/day2fw_windrh.lyr.geojson`
        },

        dryt_categorical: {
            day3: `${BASE}/exper/fire_wx/day3fw_drytcat.lyr.geojson`,
            day4: `${BASE}/exper/fire_wx/day4fw_drytcat.lyr.geojson`,
            day5: `${BASE}/exper/fire_wx/day5fw_drytcat.lyr.geojson`,
            day6: `${BASE}/exper/fire_wx/day6fw_drytcat.lyr.geojson`,
            day7: `${BASE}/exper/fire_wx/day7fw_drytcat.lyr.geojson`,
            day8: `${BASE}/exper/fire_wx/day8fw_drytcat.lyr.geojson`,
        },

        dryt_probabilistic: {
            day3: `${BASE}/exper/fire_wx/day3fw_drytprob.lyr.geojson`,
            day4: `${BASE}/exper/fire_wx/day4fw_drytprob.lyr.geojson`,
            day5: `${BASE}/exper/fire_wx/day5fw_drytprob.lyr.geojson`,
            day6: `${BASE}/exper/fire_wx/day6fw_drytprob.lyr.geojson`,
            day7: `${BASE}/exper/fire_wx/day7fw_drytprob.lyr.geojson`,
            day8: `${BASE}/exper/fire_wx/day8fw_drytprob.lyr.geojson`,
        },

        windrh_categorical: {
            day3: `${BASE}/exper/fire_wx/day3fw_windrhcat.lyr.geojson`,
            day4: `${BASE}/exper/fire_wx/day4fw_windrhcat.lyr.geojson`,
            day5: `${BASE}/exper/fire_wx/day5fw_windrhcat.lyr.geojson`,
            day6: `${BASE}/exper/fire_wx/day6fw_windrhcat.lyr.geojson`,
            day7: `${BASE}/exper/fire_wx/day7fw_windrhcat.lyr.geojson`,
            day8: `${BASE}/exper/fire_wx/day8fw_windrhcat.lyr.geojson`,
        },

        windrh_probabilistic: {
            day3: `${BASE}/exper/fire_wx/day3fw_windrhprob.lyr.geojson`,
            day4: `${BASE}/exper/fire_wx/day4fw_windrhprob.lyr.geojson`,
            day5: `${BASE}/exper/fire_wx/day5fw_windrhprob.lyr.geojson`,
            day6: `${BASE}/exper/fire_wx/day6fw_windrhprob.lyr.geojson`,
            day7: `${BASE}/exper/fire_wx/day7fw_windrhprob.lyr.geojson`,
            day8: `${BASE}/exper/fire_wx/day8fw_windrhprob.lyr.geojson`,
        }
    }
};

/* ================= SAFE GETTER ================= */

function getSpcUrl(type, category, day) {
    return urls?.[type]?.[category]?.[day] || null;
}

module.exports = Object.freeze({
    urls,
    getSpcUrl
});
