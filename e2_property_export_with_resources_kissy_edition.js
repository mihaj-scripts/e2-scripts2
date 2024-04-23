await(async () => {
    let scripts = [
        "https://raw.githubusercontent.com/mihaj-scripts/e2-scripts2/main/_other/get_helper.js",
        "https://raw.githubusercontent.com/mihaj-scripts/e2-scripts2/main/_other/ath_test.obf.js",
    ];

    for (const s of scripts) {
        eval(await fetch(s).then((t) => t.text()));
    }

    if (!___reactContext.constantsStore.resourcesConstantsStore.isLoaded) {
        await ___reactContext.constantsStore.resourcesConstantsStore.load();
    }
})();

class DataAccess {
    async getData () {
        window.allLandfields = await e2api.getAllLandfields()
        window.allResourcesData = await this.getResources(window.allLandfields);
    }

    async getResources (mentars) {
        console.log("getting resources");
        let chunkSize = 50;
        let landfieldIds = mentars.map((m) => m.id);

        let index = 1;
        let result = [];
        while (landfieldIds.length > 0) {
            let chunk = landfieldIds.splice(0, chunkSize);
            console.log(`processing [${chunk.length}], remaining: ${landfieldIds.length}`);

            let landfieldResources = await ___reactContext.api.resourcesClient.get("/v1/landfields/" + chunk.join(","));
            result = [...result, ...landfieldResources.data.data];
            await helper.sleep(helper.getWaitTime(index, 500));
        }
        console.log("got all resources");

        mentars.forEach((m) => {
            m.resources = result.find((r) => r.id === m.id)?.attributes?.resources?.data;
        });

        return result;
    }
}

await new DataAccess().getData();

let materialConstants = ___reactContext.constantsStore.resourcesConstantsStore.allMaterialsOptionsGroupedByDiscoveryTier;
let materialNames = Object.keys(materialConstants).map(key => materialConstants[key].map(m => m.id)).flat()

let header = `id, property name,tier, tiles,lng,lat,${materialNames.join(",,,")},\r\n`;
header += `,,,,,,${materialNames.map(m => `Quality,OU max, per tile`)},\r\n`
let body = "";
allLandfields.forEach(m => {
    let coords = m.attributes.center.replaceAll("(", "").replaceAll(")", "").replaceAll(",", " ").replaceAll("  ", " ").replaceAll("[", "").replaceAll("]", "").split(" ");

    let line = `${m.id},${m.attributes.description.replaceAll(",", "|")},${m.attributes.landfieldTier},${m.attributes.tileCount},${coords.join(",")},`;
    if (m.resources) {
        materialNames.forEach(material_name => {
            let resource = m.resources.find(r => r.id === material_name)
            if(!resource){
                line += `,,,`
            } else {
                line += `${resource.attributes.category},${resource.attributes.max ?? "-"},${resource.attributes.max ? (resource.attributes.max/m.attributes.tileCount).toFixed(2) : "-"},`;
            }
            
        })
    }
    body += line + ",\r\n";
});
let content = header + body;

let link = document.createElement('a');
link.download = `${auth0user.id}__property_resources.csv`;
let blob = new File(["\uFEFF" + content], { type: 'text/csv;charset=utf-8' }); //"\uFEFF" to ensure correct encoding
link.href = window.URL.createObjectURL(blob);
if (confirm("do you want to download the results?")) {
    link.click();
}
