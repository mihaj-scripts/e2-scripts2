let config = {
    pageSize: 200,
}

const modules = [
    "https://dl.dropboxusercontent.com/scl/fi/scod3ajivefap9vt2xdz4/gen_init.js?rlkey=a6ucdw6t1ehn50qyzeny8j85r&st=nv2o18f0&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/kg7za6607j8sv1ihvvv81/gen_helper.js?rlkey=7xpk50kbkoo1syuprcshpd7pp&st=e7kflaos&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/bm1vxkl1f5lwzb3a983gy/gen_api.js?rlkey=6o4tzz5gltqy3mrj2k7a45buh&st=321616pj&dl=1"
];

for (let i = 0; i < modules.length; i++) {
    eval(await fetch(modules[i]).then(r => r.text()));
}

class api {
    getProperties = async (pageNumber) => {
        let params = {
            userId: auth0user.id, //"6d5176da-2321-4820-87da-b2a1fcab8a04", //"67e39dc8-2022-45be-9b32-5e695a3981af", // auth0user.id,
            perPage: config.pageSize,
            page: pageNumber
        };
        return (await _m.context.api.apiClient.get("/landfields", { params: params })).data;
    }

    getAllProperties = async () => {
        let firstPageData = await this.getProperties(1,);
        let propertyCount = firstPageData.meta.count;
        console.log("\tgot first page: ", firstPageData);
        let properties = firstPageData.data;
        if (propertyCount <= config.pageSize) {
            console.log(`\tonly one page, property count: ${propertyCount}`);
        } else {
            let pageCount = Math.ceil(propertyCount / config.pageSize);
            console.log(`\tmore than one page, [property count: ${propertyCount}, page count: ${pageCount}]`);
            for (let i = 2; i <= pageCount; i++) {
                console.log(`\tquery page [${i}/${pageCount}]`);
                let pageData = await this.getProperties(i);
                properties = [...properties, ...pageData.data];
            }
        }
        return properties;
    }
}

_m.api = new api();

let properties = await _m.api.getAllProperties();
let epls = properties.filter(p => p.attributes.epl).map(p => p.attributes.epl).sort();

_m.helper.shamelessPlug();

if(epls.length > 0){
    console.log(`your EPLs: \r\n\r\n${epls.join("\r\n")}`)
} else {
    console.log(`no EPLs found :|`);
}