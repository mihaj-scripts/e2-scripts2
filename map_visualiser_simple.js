/* HOW TO USE:
go to "buy land" (map view) -> load script. It will show your properties as colored dots on the map.
You can control the colors by setting config values below.
Default setting is: T1 - blue, T2 - red, T3 - green
Flexes (750 tile) has a yellow circle around.
Any questions, suggestions -> discord: @mihaj
*/

let config = {
    pageSize: 200,
    innerColorT1: '#81D4FA',
    innerColorT2: '#F44336',
    innerColorT3: '#00FF00',
    outerColorFlex: '#f4d03f',
    outerColorOther: '#d7bde2'
}

let loadScript = async (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.onload = resolve;
        script.onerror = reject;
        script.src = src;
        document.head.append(script);
    })
};

await loadScript('https://npmcdn.com/@turf/turf/turf.min.js');
console.log("turf.js loaded");

const modules = [
    "https://dl.dropboxusercontent.com/scl/fi/scod3ajivefap9vt2xdz4/gen_init.js?rlkey=a6ucdw6t1ehn50qyzeny8j85r&st=nv2o18f0&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/kg7za6607j8sv1ihvvv81/gen_helper.js?rlkey=7xpk50kbkoo1syuprcshpd7pp&st=e7kflaos&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/bm1vxkl1f5lwzb3a983gy/gen_api.js?rlkey=6o4tzz5gltqy3mrj2k7a45buh&st=321616pj&dl=1"
];

for (let i = 0; i < modules.length; i++) {
    eval(await fetch(modules[i]).then(r => r.text()));
}

await _m.context.countriesRepositoryStore.fetchCountries()
_m.countries_repo = [..._m.context.countriesRepositoryStore.data.data_].map(d => d[1].value_)

window.landfields = await _m.api.profile.getAllProperties();
console.log(`got ${landfields.length} landfields`);

class MapHandler {
    constructor() {
        window.mapgl = _m.context.mapStore.map;
        mapgl.on('styledata', (e) => {
            this.load();
        });
    }

    load = () => {
        this.addCountryBorder();
        this.addPropertyDots();
        mapgl.setZoom(1);
    }

    addCountryBorder = () => {
        const sourceName = "m-countryborders";
        if (!mapgl.getSource("m-countryborders")) {
            mapgl.addSource(sourceName, { type: 'vector', url: 'mapbox://mapbox.boundaries-adm0-v3' });
            mapgl.addLayer({
                id: 'm-country-borders', type: 'line', source: sourceName, 'source-layer': 'boundaries_admin_0',
                paint: {
                    'line-color': '#FF00FF',
                    'line-width': 2,
                    'line-blur': 2,
                }
            });
        }
    }

    addPropertyDots = () => {
        _m.mapData = landfields.map(landfield => {
            let t = landfield.attributes;
            let centerString = t.center.replaceAll("(", "").replaceAll(")", "").replaceAll("[", "").replaceAll("]", "")
            let dt = {
                center: centerString.split(centerString.includes(",") ? "," : " "),
                tier: t.landfieldTier,
                class: t.tileClass,
                tiles: t.tileCount
            }
            return turf.point(dt.center.map(p => parseFloat(p)), { tier: dt.tier, class: dt.class, tiles: dt.tiles })
        });

        let sourceName = "properties-source";
        if (mapgl.getSource(sourceName))
            return;

        let source = { 'type': 'geojson', 'data': turf.featureCollection(_m.mapData) };
        window.mapgl.addSource(sourceName, source);

        let colorExpression = [
            'match',
            ['get', 'tier'],
            1, config.innerColorT1,
            2, config.innerColorT2,
            /* other */ config.innerColorT3
        ];

        let colorOuterExpression = [
            'match',
            ['get', 'tiles'],
            750, config.outerColorFlex,
            config.outerColorOther
        ];
        let opacityExpression = ['match', ['get', 'tiles'], 750, 1, 0.1];

        mapgl.addLayer({
            'id': 'properties-layer-6',
            'type': 'circle',
            'source': sourceName,
            'paint': {
                //'circle-radius': 15,
                'circle-radius': 4,
                'circle-color': config.outerColorOther,
                'circle-opacity': opacityExpression,
                'circle-stroke-color': colorOuterExpression,// "#03A9F4",
                'circle-stroke-opacity': opacityExpression,
                'circle-stroke-width': 4
            }
        });

        mapgl.addLayer({
            'id': 'properties-layer-5',
            'type': 'circle',
            'source': sourceName,
            'paint': {
                'circle-radius': 2,
                'circle-color': colorExpression,
                'circle-opacity': 0.125,
                'circle-stroke-color': colorExpression,// "#03A9F4",
                'circle-stroke-width': 2
            }
        });

    }
}

new MapHandler().load();

_m.helper.shamelessPlug();