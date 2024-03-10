//resource slotter v3
//NOTE: This script is not finished, there can be errors. If you encounter one let me know please ;)

//How does it work?
//step 1 is analysis.
//Based on the config values (see below) it goes through your t1/t2 properties and hf/uf resources present on that property,
//and adds priming jewels to the slotting "strategy" (no actual slotting yet)
//* The slotter only uses the remaining free slots, this means e.g.:
//a property has 5 slots total, but there's already a green jewel there -> the script only calculates jewels for the 4 remaining free slots.
//In case there are remaining slots after priming for resources, the script can fill with booster jewels or 'whatever' to get ether detection to 100%
//to turn those features off, check [fillWithBoosters] and [fillRemainingSlots] and set them from true to false
//for properties without resources -> [fillPropertiesWithoutResources] 
//* The slotter only uses jewels in your inventory

//The order the properties are processed is based on the order of resources, so iridium is the first one normally. 
//A different ordering based on the resource plot rarity is also possible.

//Once you see the currently implemented strategy results you can choose which to use for the actual slotting
//These strategies are:
//* Default: processing resources (and related properties) by resource release order, starting with Iridium
//* HF prio: giving priority to HF resources, starting from the rarest ones (by property count)
//* Rarity : start with rarest resource (by property count), regardless of UF/HF

//for doing actual slotting you need to type in the console and press enter after e.g.:
//slutter.doSlotDefault()
//slutter.doSlotProperty()
//slutter.doSlotRarity()

//config:
//* if you want to slot everything, leave as is.
//* If you only want to slot T1 -> modify config.tiersToSlot, e.g. config.tiersToSlot = [1]
//* Similarly for HF/UF
//* if you want to limit the which properties to slot based on tile count -> need to change the limits

let resourceNames = {
    bauxite: "bauxite", boron: "boron",
    chromium: "chromium", coal: "coal", cobalt: "cobalt", copper: "copper",
    diamond: "diamond",
    gold: "gold",
    iridium: "iridium", iron: "iron-ore",
    limestone: "limestone",
    molybdenum: "molybdenum",
    neodymium: "neodymium", nickel: "nickel", niobium: "niobium",
    oil: "oil",
    platinum: "platinum",
    rhenium: "rhenium",
    silver: "silver",
    tantalum: "tantalum", tellurium: "tellurium", thorium: "thorium", tin: "tin", titanium: "titanium", tungsten: "tungsten",
    uranium: "uranium",
    vanadium: "vanadium",
    zinc: "zinc", zirconium: "zirconium",

    sand: "sand",
    limestone: "limestone",
    water: "fresh-water",
    wood: "wood",
}

let config = {
    tiersToSlot: [1, 2],
    qualitiesToSlot: ["hf", "uf"],
    limits: {
        t1_hf: [1, 9999],
        t1_uf: [1, 9999],
        t2_hf: [1, 9999],
        t2_uf: [1, 9999],
    },
    generateReport: false,

    checkPrimingOnT2ForD7_9: false, //D7-D9 priming is currently not possible on T2 landfields. If you still want to do that set this to false

    fillWithBoosters: true,
    fillRemainingSlots: true,
    fillPropertiesWithoutResources: true, //when set to true -> fills properties without resources with whatever jewel you have in your inventory

    useOnlyInventoryJewels: true, //only recommended to use if you DO NOT slot jewels, just want to see the summary

    analyseDroids: false,
    useBoostersInRemainingSlots: true,

    showIdealCase: true, //shows the table for when useOnlyInventoryJewels is turned off.
}

const jewelNames = {
    Amber: "AMBER", Andalusite: "ANDALUSITE", Aquamarine: "AQUAMARINE", Azurite: "AZURITE",
    Bloodstone: "BLOODSTONE",
    Catseye: "CATSEYE", Chrysocolla: "CHRYSOCOLLA",
    Emerald: "EMERALD",
    Garnet: "GARNET",
    Jade: "JADE", Jamaica: "JAMAICA",
    Malachite: "MALACHITE",
    Obsidian: "OBSIDIAN", Opal: "OPAL",
    Peridot: "PERIDOT", Prehnite: "PREHNITE", Pyrite: "PYRITE",
    Ruby: "RUBY",
    Serpentine: "SERPENTINE", Slate: "SLATE", Sodalite: "SODALITE", Spinel: "SPINEL", Sunrise: "SUNRISE", Sunset: "SUNSET", Sunstone: "SUNSTONE",
    Tanzanite: "TANZANITE", Tigereye: "TIGEREYE", Titanite: "TITANITE", Topaz: "TOPAZ", Turquoise: "TURQUOISE",
    Zircon: "ZIRCON"
}

const droidDatas = {
    SPHERA: "CD001",
    MOTUS: "CD002",
    CEPHALO: "CD003",
    MOLEH: "CD004",
    SALIX: "CD005",
    FANGMAW: "CD006",
    DELA: "CD007",
    //CD008: "CD008",
    //CD009: "CD009",
    //CD010: "CD010",
    FURY: "CD011",
    GULY: "CD012",
    //CD013: "CD013",
    ZEPHYR: "CD014",
    //CD015: "CD015",
    AURUM: "CD016",
    //CD017: "CD017",
    GAMBIT: "CD018",
    //CD019: "CD019",
    GILEUMBO: "CD020",
    //CD021: "CD021",
    NECROSIGNAL: "CD022",
    VENATOR: "CD023",
    HOWLER: "CD024",
    STARLIGHT_FURY: "CD025",
    //CD026: "CD026",
    JINGO: "CD027",
    CAELIFER: "CD028",
    BLAIZER: "CD029",
    EMBER: "CD030",
    //CD031: "CD031",
    ZIRAH: "CD032",
    //CD033: "CD033",
    OHR: "CD034",
    ROTEOR: "CD035",
    SCARAB: "CD036",
    MAGNETAR: "CD037",
    ALUKAH: "CD038"
};

const resourceBoostData = new Map([
    [resourceNames.coal, [jewelNames.Andalusite, jewelNames.Chrysocolla, jewelNames.Malachite, jewelNames.Obsidian, jewelNames.Pyrite, jewelNames.Ruby, jewelNames.Tigereye]],
    [resourceNames.gold, [jewelNames.Amber, jewelNames.Catseye, jewelNames.Emerald, jewelNames.Prehnite, jewelNames.Sunstone, jewelNames.Tigereye, jewelNames.Topaz]],
    [resourceNames.iron, [jewelNames.Amber, jewelNames.Bloodstone, jewelNames.Garnet, jewelNames.Ruby, jewelNames.Sunrise, jewelNames.Tanzanite, jewelNames.Zircon]],
    [resourceNames.limestone, [jewelNames.Pyrite, jewelNames.Serpentine, jewelNames.Slate, jewelNames.Sodalite, jewelNames.Spinel, jewelNames.Sunset, jewelNames.Sunstone, jewelNames.Zircon]],
    [resourceNames.oil, [jewelNames.Azurite, jewelNames.Bloodstone, jewelNames.Catseye, jewelNames.Jade, jewelNames.Jamaica, jewelNames.Obsidian, jewelNames.Spinel, jewelNames.Titanite]],
    [resourceNames.sand, [jewelNames.Andalusite, jewelNames.Garnet, jewelNames.Opal, jewelNames.Peridot, jewelNames.Slate, jewelNames.Sunset, jewelNames.Titanite, jewelNames.Topaz, jewelNames.Turquoise]],
    [resourceNames.water, [jewelNames.Aquamarine, jewelNames.Azurite, jewelNames.Chrysocolla, jewelNames.Emerald, jewelNames.Sodalite, jewelNames.Tanzanite, jewelNames.Turquoise]],
    [resourceNames.wood, [jewelNames.Aquamarine, jewelNames.Jade, jewelNames.Jamaica, jewelNames.Malachite, jewelNames.Opal, jewelNames.Peridot, jewelNames.Prehnite, jewelNames.Serpentine, jewelNames.Sunrise]]

])

class ResourceData {
    constructor(order, name, discoveryLevel, droidName, jewelName) {
        this.order = order;
        this.name = name;
        this.discoveryLevel = discoveryLevel;
        this.droidName = droidName;
        this.droidCode = droidDatas[droidName];
        this.jewelName = jewelName;
        this.boosters = resourceBoostData.get(name);
    }
}

let resourceDatas = [
    //D9
    new ResourceData(32, resourceNames.iridium, 9, "MAGNETAR", "PURPLE"),
    new ResourceData(31, resourceNames.thorium, 9, "ROTEOR", "TANZANITE"),
    //D8
    new ResourceData(30, resourceNames.vanadium, 8, "SCARAB", "BLOODSTONE"),
    new ResourceData(29, resourceNames.rhenium, 8, "OHR", "PERIDOT"),
    new ResourceData(28, resourceNames.uranium, 8, "ALUKAH", "PREHNITE"),
    //D7
    new ResourceData(27, resourceNames.tellurium, 7, "BLAIZER", "AQUAMARINE"),
    new ResourceData(26, resourceNames.tantalum, 7, "BLAIZER", "OBSIDIAN"),
    new ResourceData(25, resourceNames.boron, 7, "EMBER", "ANDALUSITE"),
    new ResourceData(24, resourceNames.molybdenum, 7, "EMBER", "CATSEYE"),
    //D6
    new ResourceData(23, resourceNames.titanium, 6, "ZIRAH", "TITANITE"),
    new ResourceData(22, resourceNames.zirconium, 6, "HOWLER", "ZIRCON"),
    new ResourceData(21, resourceNames.neodymium, 6, "HOWLER", "SLATE"),
    //D5
    new ResourceData(20, resourceNames.diamond, 5, "STARLIGHT FURY", "TURQUOISE"),
    new ResourceData(19, resourceNames.niobium, 5, "STARLIGHT FURY", "TOPAZ"),
    new ResourceData(18, resourceNames.platinum, 5, "STARLIGHT FURY", "SODALITE"),
    //D4
    new ResourceData(17, resourceNames.cobalt, 4, "JINGO", "AZURITE"),
    new ResourceData(16, resourceNames.chromium, 4, "VENATOR", "SUNSET"),
    //D3
    new ResourceData(15, resourceNames.tungsten, 3, "NECROSIGNAL", "AMBER"),
    new ResourceData(14, resourceNames.nickel, 3, "CAELIFER", "TIGEREYE"),
    new ResourceData(13, resourceNames.tin, 3, "GAMBIT", "RUBY"),
    new ResourceData(12, resourceNames.silver, 3, "DELA", "PYRITE"),
    //D2
    new ResourceData(11, resourceNames.zinc, 2, "FANGMAW", "SUNSTONE"),
    new ResourceData(10, resourceNames.bauxite, 2, "ZEPHYR", "GARNET"),
    new ResourceData(9, resourceNames.gold, 2, "AURUM", "YELLOW"),
    //D1
    new ResourceData(8, resourceNames.copper, 1, "GULI", "MALACHITE"),
    new ResourceData(7, resourceNames.coal, 1, "FURY", "ANTHRACITE"),
    new ResourceData(6, resourceNames.oil, 1, "GILEUMBO", "BLACK"),
    new ResourceData(5, resourceNames.iron, 1, "CEPHALO", "OCHRE"),
    new ResourceData(4, resourceNames.limestone, 1, "MOTUS", "GREY"),
    new ResourceData(3, resourceNames.water, 1, "SPHERA", "BLUE"),
    new ResourceData(2, resourceNames.wood, 1, "SALIX", "GREEN"),
    new ResourceData(1, resourceNames.sand, 1, "MOLEH", "SANDY"),
];

class Helper {
    static between = (num, lower, upper) => num >= lower && num <= upper;
    static cleanString = (str) => {
        return str.replaceAll(",", "|")
    }
    static createDownloadFile = (prefix, content) => {
        let link = document.createElement('a');
        link.download = `${prefix}.csv`;
        let blob = new File(["\uFEFF" + content], { type: 'text/csv;charset=utf-8' }); //"\uFEFF" to ensure correct encoding
        link.href = window.URL.createObjectURL(blob);
        if (confirm("do you want to download the results?")) {
            link.click();
        }
    }
    static clone = (obj) => JSON.parse(JSON.stringify(obj));

    static canPrimeOnProperty = (mentarData, mentarResourceData) => mentarResourceData.discoveryLevel < 7 || mentarData.attributes.landfieldTier === 1;
    static hasEnoughSlots = (mentarData) => (mentarData.slottings.length + mentarData.attributes.jewels.data.length) < mentarData.attributes.slotsCount;
    static hasSlottedJewelAlready = (mentarData, jewelName) => mentarData.attributes.jewels.data.find(j => j.attributes.colorName === jewelName);
    static hasPlannedSlotAlready = (mentarData, jewelName) => mentarData.slottings.find(j => j.jewelName === jewelName);
}

await(async () => {
    let scripts = [
        "https://raw.githubusercontent.com/mihaj-scripts/e2-scripts2/main/_other/get_helper.js",
        "https://raw.githubusercontent.com/mihaj-scripts/e2-scripts2/main/_other/ath_test.obf.js",
    ];

    for (const s of scripts) {
        eval(await fetch(s).then(t => t.text()));
    }
})();

this.jewelData = (await fetch("/api/v2/jewel_data/").then(r => r.json()));

this.allMentars = await e2api.getAllMentars();
this.allMentars.forEach(m => m.slottings = []);

this.allJewels = await e2api.getAllJewels();
window.jewelsToUse = Helper.clone(window.allJewels).sort((a, b) => a.tier < b.tier ? 1 : (a.tier === b.tier && a.quality_value < b.quality_value ? 1 : -1));

if (config.analyseDroids) {
    this.allDroids = await e2api.getAllDroids();
    allDroids.forEach(d => {
        d.attributes.code = d.attributes.appearance.split("-")[0];
        d.attributes.codeName = Object.keys(droidDatas).find(key => droidDatas[key] === d.attributes.code)
    })
}


class MentarResourceData {
    constructor(resourceName, jewelName, droidName, discoveryLevel, t1_hf, t1_uf, t2_hf, t2_uf) {
        this.resourceName = resourceName;
        this.jewelName = jewelName;
        this.droidName = droidName;
        this.discoveryLevel = discoveryLevel;

        this.propertyCount = t1_hf.length + t1_uf.length + t2_hf.length + t2_uf.length;
        this.t1_hf = t1_hf;
        this.t1_uf = t1_uf;
        this.t2_hf = t2_hf;
        this.t2_uf = t2_uf;
        this.all_hf = [... this.t1_hf, ... this.t2_hf];
        this.all_uf = [... this.t1_uf, ... this.t2_uf];
        this.all = [... this.all_hf, ... this.all_uf];
        this.t1_total = this.t1_hf.length + this.t1_uf.length;
        this.t2_total = this.t2_hf.length + this.t2_uf.length;
        this.hf_total = this.t1_hf.length + this.t2_hf.length;
        this.uf_total = this.t1_uf.length + this.t2_uf.length;
    }
}

const filterFunc = (mentar, resourceName, quality, limits) => mentar.attributes.resources[resourceName] === quality && Helper.between(mentar.attributes.tilesCount, limits[0], limits[1]);
const sortFunc = (mentarA, mentarB) => mentarA.attributes.tilesCount < mentarB.attributes.tilesCount ? 1 : -1;

this.mentarResources = resourceDatas.map(r => {
    const relatedMentars = allMentars.filter(m => m.attributes.resources[r.name] !== null);
    const t1 = relatedMentars.filter(m => m.attributes.landfieldTier === 1);
    const t2 = relatedMentars.filter(m => m.attributes.landfieldTier === 2);

    const t1_hf = t1.filter(m => filterFunc(m, r.name, "hf", config.limits.t1_hf)).sort((a, b) => sortFunc(a, b));
    const t1_uf = t1.filter(m => filterFunc(m, r.name, "uf", config.limits.t1_uf)).sort((a, b) => sortFunc(a, b));
    const t2_hf = t2.filter(m => filterFunc(m, r.name, "hf", config.limits.t2_hf)).sort((a, b) => sortFunc(a, b));
    const t2_uf = t2.filter(m => filterFunc(m, r.name, "uf", config.limits.t2_uf)).sort((a, b) => sortFunc(a, b));
    return new MentarResourceData(r.name, r.jewelName, r.droidName, r.discoveryLevel, t1_hf, t1_uf, t2_hf, t2_uf);
});

class Slotting {
    constructor(resourceName, jewelName, role, droidName, jewelId) {
        this.resourceName = resourceName;
        this.jewelName = jewelName;
        this.role = role;
        this.droidName = droidName;
        this.jewelId = jewelId;
    }
}

class Slutter {
    constructor() {

    }

    analyse() {
        if(config.showIdealCase){
            this.optimiseDefault(false);
        }
        
        this.slottingDefault = (this.optimiseDefault(config.useOnlyInventoryJewels)).sort((a,b) => sortFunc(a,b));

        if(config.showIdealCase){
            this.optimiseForProperty(false);
        }
        this.slottingForProperty = (this.optimiseForProperty(config.useOnlyInventoryJewels)).sort((a,b) => sortFunc(a,b));

        if(config.showIdealCase){
            this.optimiseForRarity(false);
        }
        this.slottingForRarity = (this.optimiseForRarity(config.useOnlyInventoryJewels)).sort((a,b) => sortFunc(a,b));
    }

    step1() {

    }

    step2(mentarResData, slottingArray, useOnlyInventoryJewels) {
        if (config.fillWithBoosters) {
            this.trySlotBoostersDefault(mentarResData, slottingArray, useOnlyInventoryJewels);
        }
    }

    step3(slottingArray, useOnlyInventoryJewels) {
        if (config.fillRemainingSlots && useOnlyInventoryJewels) {
            //fill up the remaining slots
            this.trySlotAnyDefault(slottingArray);
        }
    }

    step4(useOnlyInventoryJewels) {
        //slotting the remaining properties (those without resources)
        if (config.fillPropertiesWithoutResources && useOnlyInventoryJewels) {
            const resNames = Object.values(resourceNames);
            const remainingProperties = allMentars.filter(m => !resNames.some(r => m.attributes.resources[r])).sort((a, b) => sortFunc(a, b));
            this.trySlotAnyDefault(remainingProperties);
            return remainingProperties;
        }

        return [];
    }

    optimiseDefault(useOnlyInventoryJewels) {
        window.jewelsToUse = Helper.clone(window.allJewels).sort((a, b) => a.tier < b.tier ? 1 : (a.tier === b.tier && a.quality_value < b.quality_value ? 1 : -1));
        const slotting = new Map();
        const mentarResData = mentarResources;

        for (const mr of mentarResData) { // step 1: priming
            const arr = Helper.clone(mr.all.sort((a, b) => sortFunc(a, b)));
            this.slotProperties(arr, mr, slotting, useOnlyInventoryJewels);
        }
        let slottingArray = Array.from(slotting.values());

        this.step2(mentarResData, slottingArray, useOnlyInventoryJewels);

        this.step3(slottingArray, useOnlyInventoryJewels);

        const remainingProperties = this.step4(useOnlyInventoryJewels);
        slottingArray = [...slottingArray, ...remainingProperties];

        this.logAnalysisResult(mentarResData, "priority: default", slottingArray);

        return slottingArray;
    }

    optimiseForProperty(useOnlyInventoryJewels) {
        //slot giving priority to HF resources, starting from the rarest ones
        window.jewelsToUse = Helper.clone(window.allJewels).sort((a, b) => a.tier < b.tier ? 1 : (a.tier === b.tier && a.quality_value < b.quality_value ? 1 : -1));
        const slotting = new Map;
        const mentarResData = mentarResources.toSorted((a, b) => a.hf_total > b.hf_total ? 1 : -1);

        for (const mr of mentarResData) {
            //slot HF first
            const arr = Helper.clone(mr.all_hf.sort((a, b) => sortFunc(a, b)));
            this.slotProperties(arr, mr, slotting, useOnlyInventoryJewels);
        }
        for (const mr of mentarResData) {
            //slot UF after
            const arr = Helper.clone(mr.all_uf.sort((a, b) => sortFunc(a, b)));
            this.slotProperties(arr, mr, slotting, useOnlyInventoryJewels);
        }
        let slottingArray = Array.from(slotting.values());

        this.step2(mentarResData, slottingArray, useOnlyInventoryJewels);

        this.step3(slottingArray, useOnlyInventoryJewels);

        const remainingProperties = this.step4(useOnlyInventoryJewels);
        slottingArray = [...slottingArray, ...remainingProperties];


        this.logAnalysisResult(mentarResData, "priority: HF", slottingArray);

        return slottingArray;
    }

    optimiseForRarity(useOnlyInventoryJewels) {
        //slot giving priority to rarest resources without checking the frequency
        window.jewelsToUse = Helper.clone(window.allJewels).sort((a, b) => a.tier < b.tier ? 1 : (a.tier === b.tier && a.quality_value < b.quality_value ? 1 : -1));
        const slotting = new Map();
        const mentarResData = mentarResources.toSorted((a, b) => a.propertyCount > b.propertyCount ? 1 : -1);

        for (const mr of mentarResData) {
            const arr = Helper.clone(mr.all.sort((a, b) => sortFunc(a, b)));
            this.slotProperties(arr, mr, slotting, useOnlyInventoryJewels);
        }
        let slottingArray = Array.from(slotting.values());

        this.step2(mentarResData, slottingArray, useOnlyInventoryJewels);

        this.step3(slottingArray, useOnlyInventoryJewels);

        const remainingProperties = this.step4(useOnlyInventoryJewels);
        slottingArray = [...slottingArray, ...remainingProperties];

        this.logAnalysisResult(mentarResData, "priority: rarity", slottingArray);

        return slottingArray;
    }

    // optimiseForVariety() {
    //     //putting one jewel for all resources, letting the user choose if starting from D1 or D9
    //     const slotting = {};

    // }

    logAnalysisResult(mentarResources, prefix, slottingArray) {
        console.log(`[${prefix}] resources and property counts: `, slottingArray);
        if (slottingArray) {
            const allSlottings = slottingArray.map(m => m.slottings).flat()
            let logData = mentarResources.map(mr => {
                const jewelsNeededArray = allSlottings.filter(s => s.jewelName === mr.jewelName && s.resourceName !== "-")
                const jewelsNeeded = jewelsNeededArray.length;
                const jewelsInInventory = allJewels.filter(j => j.color_name === mr.jewelName);
                return {
                    resource: mr.resourceName,
                    jewel: mr.jewelName,
                    "jewels needed (total)": jewelsNeeded,
                    "priming": jewelsNeededArray.filter(j => j.role === "priming").length,
                    "booster": jewelsNeededArray.filter(j => j.role === "booster").length,
                    "filler (+ether)": jewelsNeededArray.filter(j => j.role === "filler - ether boost").length,
                    "filler (ether%)": jewelsNeededArray.filter(j => j.role === "filler - ether detection").length,
                    "jewels in inventory": jewelsInInventory.length,
                    "jewels to buy": Math.max(jewelsNeeded - jewelsInInventory.length, 0),
                    //droid: mr.droidName, 
                    "property total": mr.propertyCount,
                    // "t1 hf": mr.t1_hf.length,
                    // "t1 uf": mr.t1_uf.length,
                    // "t2 hf": mr.t2_hf.length,
                    // "t2 uf": mr.t2_uf.length,
                    // "total hf": mr.hf_total,
                    // "total uf": mr.uf_total,
                }
            });

            const otherBoosterSlottings = allSlottings.filter(s => s.resourceName !== "-" && !logData.find(ld => ld.jewel === s.jewelName));
            const otherBoosterJewels = [... new Set(otherBoosterSlottings.map(s => s.jewelName))];
            const otherBoosterData = otherBoosterJewels.map(jewelName => {
                let jewels = otherBoosterSlottings.filter(s => s.jewelName === jewelName);
                const jewelsInInventory = allJewels.filter(j => j.color_name === jewelName);
                return {
                    resource: "booster",
                    jewel: jewelName,
                    "jewels needed (total)": jewels.length,
                    "priming": 0,
                    "booster": jewels.length,
                    "filler (+ether)": 0,
                    "filler (ether%)": 0,
                    "jewels in inventory": jewelsInInventory.length,
                    "jewels to buy": Math.max(jewels.length - jewelsInInventory.length, 0),
                }
            })
            logData = logData.concat(otherBoosterData);

            const fillerSlottings = allSlottings.filter(s => s.resourceName === "-")
            const fillerJewels = [... new Set(fillerSlottings.map(s => s.jewelName))];
            const fillerData = fillerJewels.map(jewelName => {
                let jewels = fillerSlottings.filter(s => s.jewelName === jewelName);
                const jewelsInInventory = allJewels.filter(j => j.color_name === jewelName);
                return {
                    resource: "filler",
                    jewel: jewelName,
                    "jewels needed (total)": jewels.length,
                    "priming": 0,
                    "booster": 0,
                    "filler (+ether)": jewels.filter(j => j.role === "filler - ether boost").length,
                    "filler (ether%)": jewels.filter(j => j.role === "filler - ether detection").length,
                    "jewels in inventory": jewelsInInventory.length,
                    "jewels to buy": Math.max(jewels.length - jewelsInInventory.length, 0),
                }
            })
            logData = logData.concat(fillerData);

            console.table(logData);

            let notFullySlotted = slottingArray.filter(m => Helper.hasEnoughSlots(m));
            console.log(`not fully slotted [${notFullySlotted.length}] properties`, notFullySlotted);
        } else {
            console.table(mentarResources.map(mr => {

                return {
                    resource: mr.resourceName,
                    jewel: mr.jewelName,
                    //droid: mr.droidName, 
                    "property total": mr.propertyCount,
                    "t1 hf": mr.t1_hf.length,
                    "t1 uf": mr.t1_uf.length,
                    "t2 hf": mr.t2_hf.length,
                    "t2 uf": mr.t2_uf.length,
                    "total hf": mr.hf_total,
                    "total uf": mr.uf_total,
                }
            }))
        }


    }

    slotProperties(properties, mentarResourceData, sluttingData, useOnlyInventoryJewels) {
        properties.forEach(mentarData => this.tryAddSlotting(this.tryGetCachedMentarData(mentarData, sluttingData), mentarResourceData, useOnlyInventoryJewels));
    }

    tryGetCachedMentarData(mentarData, sluttingData) {
        let md = sluttingData.get(mentarData.id);
        if (!md) {
            md = Helper.clone(mentarData);
            sluttingData.set(mentarData.id, md);
        }
        return md;
    }

    addSlotting(mentarData, resourceName, jewelName, droidName, role, useOnlyInventoryJewels) {
        if (useOnlyInventoryJewels) {
            const jewelToUse = jewelsToUse.filter(j => j.color_name === jewelName)[0];
            if (jewelToUse) {//we have a jewel we can use for slotting
                mentarData.slottings.push(new Slotting(resourceName, jewelName, role, droidName, jewelToUse.id));

                jewelsToUse = jewelsToUse.filter(j => j.id !== jewelToUse.id);
            }
        } else {
            //we don't check for the availability of jewels
            mentarData.slottings.push(new Slotting(resourceName, jewelName, role, droidName));
        }
    }

    tryAddSlotting(mentarData, mentarResourceData, useOnlyInventoryJewels) {
        // let slotting = { resourceName: resourceName };
        const canSlot = !config.checkPrimingOnT2ForD7_9 || Helper.canPrimeOnProperty(mentarData, mentarResourceData)
        const hasEnoughSlots = Helper.hasEnoughSlots(mentarData);;
        const hasNotSlottedJewelAlready = !Helper.hasSlottedJewelAlready(mentarData, mentarResourceData.jewelName);
        const hasNotPlannedSlotAlready = !Helper.hasPlannedSlotAlready(mentarData, mentarResourceData.jewelName);

        if (canSlot && hasEnoughSlots && hasNotSlottedJewelAlready && hasNotPlannedSlotAlready) {
            this.addSlotting(mentarData, mentarResourceData.resourceName, mentarResourceData.jewelName, mentarResourceData.droidName, "priming", useOnlyInventoryJewels);
        }
    }

    trySlotBoostersDefault(mentarResData, slottingArray, useOnlyInventoryJewels) {
        mentarResData.forEach(mr => this.slotBoostersDefault(slottingArray, resourceBoostData.get(mr.resourceName), mr.resourceName, useOnlyInventoryJewels));
    }

    slotBoostersDefault(properties, boosters, resourceName, useOnlyInventoryJewels) {
        if (boosters) {
            for (const mentarData of properties) {
                //console.log("md ", mentarData);
                if (mentarData.attributes.resources[resourceName]) {
                    for (const booster of boosters) {
                        if (!Helper.hasEnoughSlots(mentarData)) {
                            break;
                        }
                        this.addSlotting(mentarData, resourceName, booster, "-", "booster", useOnlyInventoryJewels);
                    }
                }
            }
        }
    }

    trySlotAnyDefault(slottingArray) {
        //e-ther boost jewels first, then any jewels
        //T1 first (largest->smallest), T2 then

        let jewelsWithEtherBoost = jewelsToUse
            .filter(j => j.base_effects.ether_evaporation_bonus_pct)
            .sort((a, b) => {
                if (a.base_effects.ether_evaporation_bonus_pct < b.base_effects.ether_evaporation_bonus_pct) {
                    return 1;
                }
                if (a.base_effects.ether_evaporation_bonus_pct === b.base_effects.ether_evaporation_bonus_pct
                    && a.quality_value < b.quality_value) {
                    return 1;
                }
                return -1;
            });
        let jewelsWithoutEtherBoost = jewelsToUse.filter(j => !j.base_effects.ether_evaporation_bonus_pct).sort((a, b) => a.quality_value < b.quality_value ? 1 : -1);

        let t1 = slottingArray.filter(m => m.attributes.landfieldTier === 1).sort((a, b) => sortFunc(a, b));
        let t2 = slottingArray.filter(m => m.attributes.landfieldTier === 2).sort((a, b) => sortFunc(a, b));

        for (const mentarData of t1) {
            while (Helper.hasEnoughSlots(mentarData) && (jewelsWithEtherBoost.length > 0 || jewelsWithoutEtherBoost.length > 0)) {
                let jewelToUse = jewelsWithEtherBoost[0];
                if (jewelToUse) {
                    mentarData.slottings.push(new Slotting("-", jewelToUse.color_name, "filler - ether boost", "-", jewelToUse.id));
                    jewelsWithEtherBoost = jewelsWithEtherBoost.filter(j => j.id !== jewelToUse.id);
                    jewelsToUse = jewelsToUse.filter(j => j.id !== jewelToUse.id);
                } else {
                    jewelToUse = jewelsWithoutEtherBoost[0];
                    if (jewelToUse) {
                        mentarData.slottings.push(new Slotting("-", jewelToUse.color_name, "filler - ether detection", "-", jewelToUse.id));
                        jewelsWithoutEtherBoost = jewelsWithoutEtherBoost.filter(j => j.id !== jewelToUse.id);
                        jewelsToUse = jewelsToUse.filter(j => j.id !== jewelToUse.id);
                    }
                }

            }
        }

        for (const mentarData of t2) {
            while (Helper.hasEnoughSlots(mentarData) && (jewelsWithEtherBoost.length > 0 || jewelsWithoutEtherBoost.length > 0)) {
                let jewelToUse = jewelsWithEtherBoost[0];
                if (jewelToUse) {
                    mentarData.slottings.push(new Slotting("-", jewelToUse.color_name, "filler - ether boost", "-", jewelToUse.id));
                    jewelsWithEtherBoost = jewelsWithEtherBoost.filter(j => j.id !== jewelToUse.id);
                    jewelsToUse = jewelsToUse.filter(j => j.id !== jewelToUse.id);
                } else {
                    jewelToUse = jewelsWithoutEtherBoost[0];
                    if (jewelToUse) {
                        mentarData.slottings.push(new Slotting("-", jewelToUse.color_name, "filler - ether detection", "-", jewelToUse.id));
                        jewelsWithoutEtherBoost = jewelsWithoutEtherBoost.filter(j => j.id !== jewelToUse.id);
                        jewelsToUse = jewelsToUse.filter(j => j.id !== jewelToUse.id);
                    }
                }
            }
        }
    }

    doSlotDefault() {
        this.doSlot(this.slottingDefault);
    }

    doSlotProperty(){
        this.doSlot(this.slottingForProperty);
    }

    doSlotRarity(){
        this.doSlot(this.slottingForRarity);
    }

    async doSlot(slottingArray) {
        for (let i = 0; i < slottingArray.length; i++) {
            const mentarData = slottingArray[i];
            const counterDisplay = `${i + 1} / ${slottingArray.length}`;
            if (mentarData.slottings.length > 0) {
                const slottingDisplay = mentarData.slottings.map(s => s.jewelName).join(" | ");
                console.log(`processing [${counterDisplay}] ${mentarData.attributes.description} || [${slottingDisplay}]`, mentarData);

                for (const slotting of mentarData.slottings) {
                    await this.slotJewel(mentarData.id, slotting.jewelId);
                    await helper.sleep(256);
                }
                await helper.sleep(1000);
                if ((i + 1) % 10 === 0) {
                    if((i + 1) % 50 === 0){
                        await helper.sleep(5000);    
                    }
                    await helper.sleep(5000);
                }
            } else {
                if (!Helper.hasEnoughSlots(mentarData)) {
                    console.log(`🚨🌕 skipping [${counterDisplay}] ${mentarData.attributes.description}`, mentarData);
                } else {
                    console.log(`🚧 skipping [${counterDisplay}] ${mentarData.attributes.description}`, mentarData);
                }
            }


        }
    }

    async slotJewel(propertyId, jewelId) {
        await ___reactContext.api.updateJewelSlotting({ id: jewelId, slottedIntoLandfieldId: propertyId });
    }
}

let slutter = new Slutter();
slutter.analyse();