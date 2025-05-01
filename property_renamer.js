let config = {
    pageSize: 200,
    getReport: false,
    useEPL: true, //if property has EPL -> put those at the end of the name
    partsToKeep: ["⛰️"], //put those at the beginning of the new name
}

const modules = [
    "https://dl.dropboxusercontent.com/scl/fi/scod3ajivefap9vt2xdz4/gen_init.js?rlkey=a6ucdw6t1ehn50qyzeny8j85r&st=nv2o18f0&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/kg7za6607j8sv1ihvvv81/gen_helper.js?rlkey=7xpk50kbkoo1syuprcshpd7pp&st=e7kflaos&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/if9b7cn2c5l2ze9m8jiya/countries_list.js?rlkey=zise2unpesrzd3ksqq0hoxsi9&st=53540jz4&dl=1"
];

for (let i = 0; i < modules.length; i++) {
    eval(await fetch(modules[i]).then(r => r.text()));
}

await _m.context.countriesRepositoryStore.fetchCountries()
_m.countries_repo = [..._m.context.countriesRepositoryStore.data.data_].map(d => d[1].value_)

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

    renameProperty = async (property, index) => {
        let p = {
            description: property.newDescription,
            forSale: property.attributes.forSale,
            forSaleEssence: undefined,
            landfieldId: property.id,
            price: property.attributes.price,
            priceEssence: undefined,
            propertyFlagCountry: property.attributes.propertyFlagCountry
        }
        await _m.context.api.updateLandfield(p, true);
        await _m.helper.sleep(_m.helper.getWaitTime(index, 500))
    }
}

_m.api = new api();

class Renamer {
    constructor() {
        this.counters = new Map();
    }

    processLandfields = async () => {
        console.log(`>> processing starts`);
        try {
            this.allProperties = await _m.api.getAllProperties();
            this.allProperties = this.allProperties.sort((a, b) => new Date(a.attributes.purchasedAt) > new Date(b.attributes.purchasedAt) ? 1 : -1);
            console.log(`\t got all properties, count: ${this.allProperties.length}`);
            for (let i = 0; i < this.allProperties.length; i++) {
                this.calculateNewDescription(i, this.allProperties[i]);
            }
        } catch (e) {
            console.log("error in [processLandfields] ", e);
        }
        if (config.getReport) {
            this.createReport();
        }
        console.log(`>> processing finished`);
    }

    renameAll = async () => {
        for (let i = 0; i < this.allProperties.length; i++) {
            let property = this.allProperties[i];
            console.log(`renaming ${i+1}/${this.allProperties.length} : ${property.attributes.description}`);
            await _m.api.renameProperty(property, i);
        }
    }

    calculateNewDescription = (index, property) => {
        console.log(`processing [${index + 1}]`);
        let name = property.attributes.description;
        let location = property.attributes.location;

        let locationParts = location.split(",").map(l => l.trim());
        let country = this.getCountryName(property, locationParts);

        if (!country) {
            console.warn(`[SKIP]\tno country found for [${property.attributes.country}]: ${location} `);
            console.log(`location parts: `, locationParts);
        } else {
            property.country = country;
            locationParts = this.cleanUpLocationParts(property, locationParts);
            locationParts = this.manualCleanupLocationParts(locationParts);
            this.manualCleanupCountry(property, locationParts);
            property.locationParts = locationParts;
            // console.log(
            //     `\t${index} | new location parts: [%c${country.countryName}%c] ${locationParts.join(" | ")}`,
            //     ...["color: gold", "color:snow"]
            // );

            let countryIndex = this.getCountryIndex(property)

            property.newDescription = "";
            config.partsToKeep.forEach(p => {
                if(property.attributes.description.includes(p)){
                    property.newDescription += p;
                }
            })

            if (property.locationParts.length > 0) {
                property.newDescription += `${property.country.countryName} ${countryIndex} | ${property.locationParts.join(" | ")}`;
            } else {
                property.newDescription += `${property.country.countryName} ${countryIndex}`;
            }

            if (config.useEPL && property.attributes.epl) {
                property.newDescription += ` EPL: /${property.attributes.epl} `
            }

            if (property.attributes.description.includes("#")) {
                let descriptionParts = property.attributes.description.split(" ");
                let hashtags = descriptionParts
                    .filter(dp => dp.startsWith("#"))
                    .map(h => h.replace("[", "").replace("]", ""));
                if (hashtags.length > 0) {
                    property.hashtags = hashtags;
                    property.newDescription += " " + hashtags.join(" ");
                }
            }

            if (!config.getReport) {
                this.logOldNewDescription(index, name, property);
            }
        }
    }

    getCountryName = (property, locationParts) => {
        let country = _m.countries_repo.find(c => c.countryCode === property.attributes.country);
        if (!country) {
            //no match by country code, try name
            country = _m.countries_repo.find(c => locationParts.find(lp => lp === c.countryName));
        }
        if (!country) {
            country = _m.countries.find(c => c.iso2 === property.attributes.country);
        }
        if (!country) {
            country = _m.countries.find(c => locationParts.find(lp => c.name === lp));
            if (!country)
                country = _m.countries.find(c => locationParts.find(lp => c.withLocale.includes(lp)));
        }
        return country;
    }

    cleanUpLocationParts = (property, locationParts) => {
        locationParts = locationParts.filter(l =>
            l !== property.country.countryName
            && !l.startsWith(property.country.countryName)
            && (property.country.countryName && !property.country.countryName.startsWith(l))
        );
        locationParts = [... new Set(locationParts)].reverse();
        return locationParts;
    }

    manualCleanupCountry (property, locationParts) {
        if (!property.country.countryName) {

            if (property.attributes.location.includes("n/a"))
                property.country.countryName = "International territory";

            if (property.attributes.location.includes("Kosovo"))
                property.country.countryName = "Kosovo";

            if (property.attributes.location.includes("Akrotiri"))
                property.country.countryName = "Akrotiri";

            if (property.attributes.location.includes("Spratly Islands"))
                property.country.countryName = "Spratly Islands";

            if(property.attributes.location.includes("Paracel Islands"))
                property.country.countryName = "Paracel Islands";

            if (!property.country.countryName) {
                console.warn("no country name for ", property.country);
                console.log(`location parts: ${locationParts.join(" | ")} (${property.attributes.location})`, property);
            }
            return;
        }


        if (property.country.countryName.includes("Taiwan"))
            property.country.countryName = "Taiwan";

        if (property.country.countryName.includes("United Kingdom")) {
            property.country.countryName = "United Kingdom";
        }
        if (property.country.countryName.includes("United States of America")) {
            property.country.countryName = "USA";
        }
        if (property.country.countryName.includes("Bolivia")) {
            property.country.countryName = "Bolivia";
        }
        if (property.country.countryName.includes("Venezuela")) {
            property.country.countryName = "Venezuela";
        }
        if (property.country.countryName.includes("Micronesia (Federated States of)")) {
            property.country.countryName = "Micronesia";
        }
        if (property.country.countryName.includes("Tanzania")) {
            property.country.countryName = "Tanzania";
        }
        if (property.country.countryName.includes("Russia")) {
            property.country.countryName = "Russia";
        }
        if (property.country.countryName.includes("Lao People's Democratic Republic")) {
            property.country.countryName = "Laos";
        }
        if (property.country.countryName.includes("Korea (Republic of)")) {
            property.country.countryName = "South Korea";
        }
        if (property.country.countryName.includes("Korea (Democratic People's Republic of)")) {
            property.country.countryName = "North Korea";
        }
    }

    manualCleanupLocationParts (locationParts) {
        locationParts = locationParts.filter(lp =>
            ![
                "United States",
                "Greater London",
                "US Virgin Islands",
                "England",
                "Jerusalem District",
                "Upper Austria",
                "Aland Islands"
            ].some(l => l == lp)
        );

        if (locationParts.find(lp => lp === "東京都"))
            locationParts = ["Tokyo"];

        if (locationParts.find(lp => lp === "京都市"))
            locationParts = ["Kyoto"];

        return locationParts;
    }

    getCountryIndex = (property) => {
        if (!this.counters.has(property.country.countryName)) {
            this.counters.set(property.country.countryName, 1)
        } else {
            this.counters.set(property.country.countryName, this.counters.get(property.country.countryName) + 1);
        }
        let countryIndex = this.counters.get(property.country.countryName);
        return countryIndex;
    }

    logOldNewDescription = (index, name, property) => {
        console.log(`${index}\r\nold: ${name}\r\nnew: ${property.newDescription}`);
        if (property.attributes.epl) {
            console.log(`\t EPL: %c${property.attributes.epl}`, ...["color:gold"]);
        }
        if (property.hashtags) {
            console.log(`\t tags: %c${property.hashtags.join(" ")}`, ...["color:deepskyblue"]);
        }
        console.log(`---`);
    }

    createReport = () => {
        console.log("creating report")
        try {
            let header = "id, current name, new name\r\n";
            let body = this.allProperties.map(p => `${p.id},${p.attributes.description.replaceAll(",", "|")},${p.newDescription}`).join("\r\n");
            _m.helper.createDownloadFile("renamer", header + body);
        } catch (e) {
            console.log("error in [createReport]: ", e);
        }
    }
}

async function renameAll(){
    await _m.renamer.renameAll();
}

_m.renamer = new Renamer();
await _m.renamer.processLandfields();
console.log(`please check the results, and if nothing is wrong with the new names:`)
console.log(`type into this console: %crenameAll()%c and hit enter`, ...["color:red","color:snow"]);