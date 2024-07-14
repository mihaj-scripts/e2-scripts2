let config = {
    logResourceAndPropertyCounts: false,
    resource_qualities: ['copious', 'rich', 'moderate', 'sparse', 'deficient', 'unknown'],
    jewel_roles: {
        priming: "PRIMING", //priming resource production
        booster: "BOOSTER", //boosting resource production
        filler: "FILLER" //for filling remaining slots only (to make sure ether detection is 100%)
    },
    strategyNames: {
        naive: "naiveApproach",
        rarestFirst: "rarestResourceFirst",
        leastFirst: "leastAmountThenRarest"
    },
    jewel_qualities: [
        "LUMINOUS", "CLEAR", "COMMON", "CLOUDY", "CRACKED"
    ],
    plus3_jewels: [
        'AMBER', 'ANDALUSITE', 'AQUAMARINE', 'AZURITE',
        'BLOODSTONE',
        'CATSEYE','CHRYSOCOLLA',
        'EMERALD',
        'GARNET',
        'JADE',
        'MALACHITE',
        'OBSIDIAN','OPAL',
        /*'PERIDOT',*/ 'PREHNITE', 'PYRITE',
        'RUBY',
        'SERPENTINE', 'SLATE', 'SODALITE', 'SPINEL', 'SUNSTONE',
        'TANZANITE', 'TIGEREYE', 'TITANITE', 'TOPAZ', 'TURQUOISE',
        'ZIRCON'
    ],
    useInventoryJewelsOnly: true, //if set to true -> only uses jewels for calculation in your inventory | if set to false -> uses jewels in inventory and slotted too
    //BEWARE: if you set it to false, errors can occur... (I used it only for my own calculations, I'd recommend leaving it as is)
    avoidInterference: true, //if set to true -> avoids slotting jewels interfering with each other (e.g. yellow with black, anthracite with black, anthracite with yellow)

    calculateIdealPriming: false, //when set to true -> ignores available jewels and tells you how the slotting should be 
    //BEWARE: DO NOT try to actually slot with this
    calculateNeededDroids: false, //when set to true -> calculates the droids you need to have/buy
    onlyUseProspectorsForMaterialsPrimed: true, //if this is set to true -> we check only the materials primed on a property
    onlyAddDroidForOneResource: false, //if this is set to true -> only uses droids for the first resource found/processed for the current mentar
    skipT2D7_9: true, //when set to true the calculation won't assign a D7-9 resource a priming jewel if it is on T2 land

    useJewelStacks: true, //if you have loads of jewels -> set this to true
    //BEWARE: if you set this to true -> you can only use jewels in your inventory :| (so unslot all is recommended)

    tileLimits: { //change it to your own needs
        t1: [1, 750],
        t2: [1, 750]
    },
    showDroidsToBuySell: false, //when set to true -> gets your droid list, shows what you need to buy, and what amount of them you can sell

    slotOnly1PrimingJewelAndNothingElse_Between_T1: [1, 4], // between these tile limits only slot ONE priming jewel and nothing else for T1
    slotOnly1PrimingJewelAndNothingElse_Between_T2: [1, 4], // between these tile limits only slot ONE priming jewel and nothing else for T2

    slotOnlyT3MixToMaxBoostEther_Between_T1: [100, 750],
    slotOnlyT3MixToMaxBoostEther_Between_T2: [250, 750]
}

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

this.droidAppearances = new Map([
    ["CD001", "Sphera"],
    ["CD002", "Motus"],
    ["CD003", "Cephalo"],
    ["CD004", "Moleh"],
    ["CD005", "Salix"],
    ["CD006", "Fangmaw"],
    ["CD007", "Dela"],
    ["CD008", "CD008"],
    ["CD009", "CD009"],
    ["CD010", "CD010"],
    ["CD011", "Fury"],
    ["CD012", "Guli"],
    ["CD013", "CD013"],
    ["CD014", "Zephyr"],
    ["CD015", "CD015"],
    ["CD016", "Aurum"],
    ["CD017", "CD017"],
    ["CD018", "Gambit"],
    ["CD019", "CD019"],
    ["CD020", "Gileumbo"],
    ["CD021", "CD021"],
    ["CD022", "Necrosignal"],
    ["CD023", "Venator"],
    ["CD024", "Howler"],
    ["CD025", "Starlight Fury"],
    ["CD026", "CD026"],
    ["CD027", "Jingo"],
    ["CD028", "Caelifer"],
    ["CD029", "Blaizer"],
    ["CD030", "Ember"],
    ["CD031", "CD031"],
    ["CD032", "Zirah"],
    ["CD033", "CD033"],
    ["CD034", "Ohr"],
    ["CD035", "Roteor"],
    ["CD036", "Scarab"],
    ["CD037", "Magnetar"],
    ["CD038", "Alukah"],
]);

class DataAccess {
    async getData () {
        window.jewelData = await fetch("/api/v2/jewel_data/").then((r) => r.json());
        window.jewelData.jewel_types.forEach(jt => {
            jt.prod_increase_lower = jt.prod_increase ? jt.prod_increase.map(jtp => jtp.toLowerCase()) : [];
            jt.interferences = Object.keys(jt.interference_pct).map(jti => jewelData.jewel_types.find(jt2 => jt2.color_name_abbr === jti).color_name)
            jt.priming_lower = jt.priming ? jt.priming.map(p => p.toLowerCase()) : [];
        });

        window.allMentars = await e2api.getAllMentars();
        //window.allMentars.forEach((m) => (m.slottings = []));

        window.inventoryJewelStacks = await fetch("/api/v2/my/jewels/?stacked=true").then(r => r.json());
        if (!config.useJewelStacks) {
            window.inventoryJewels = await e2api.getAllJewels();
        }
        this.initAllJewels();

        await this.getResources(window.allMentars);
        console.log(`got mentars, jewels and resources`);

        window.allMentars = [
            ...window.allMentars.filter(m =>
                m.attributes.landfieldTier === 1
                && m.attributes.tilesCount >= config.tileLimits.t1[0]
                && m.attributes.tilesCount <= config.tileLimits.t1[1]
            ).sort((a, b) => a.attributes.tilesCount < b.attributes.tilesCount ? 1 : -1),
            ...window.allMentars.filter(m =>
                m.attributes.landfieldTier === 2
                && m.attributes.tilesCount >= config.tileLimits.t2[0]
                && m.attributes.tilesCount <= config.tileLimits.t2[1]
            ).sort((a, b) => a.attributes.tilesCount < b.attributes.tilesCount ? 1 : -1),
        ];

        window.mentarsWithResources = allMentars.filter((m) => m.resources?.length > 0);
        window.mentarsWithoutResources = allMentars.filter(m => !(m.resources?.length > 0));
        console.log(`total mentar count: ${allMentars.length} | with resources: ${window.mentarsWithResources.length} | without: ${window.mentarsWithoutResources.length}`);

        window.mentarsWithResources.forEach(m =>
            m.resources.forEach(mr => mr.discovery_tier = ___reactContext.constantsStore.resourcesConstantsStore.allMaterialOptions.find(cr => cr.id === mr.id).discovery_tier)
        );

        if (config.showDroidsToBuySell) {
            window.allDroids = await e2api.getAllDroids()
            window.allDroids.forEach(d => {
                d.code = d.attributes.appearance.substring(0, 5);
                d.name = droidAppearances.get(d.code);
                d.nameUpper = d.name.toUpperCase();
            });
        }
    }

    initAllJewels () {

        if (config.useJewelStacks) {
            window.alljewelStacks = window.inventoryJewelStacks.reverse();
            window.alljewelStacks.forEach(j => { j.color_name_abbr = jewelData.jewel_types.find(jt => jt.uid === j.uid).color_name_abbr });
        } else {
            if (config.useInventoryJewelsOnly) {
                window.allJewels = window.inventoryJewels.map((ij) => ({
                    id: ij.id,
                    base_effects: ij.base_effects,
                    color_name: ij.color_name,
                    effect_strength_pct: ij.effect_strength_pct,
                    quality_level: ij.quality_level,
                    quality_value: ij.quality_value,
                    tier: ij.tier,
                    full_value: ij.tier * 100 + ij.quality_value,
                    uid: ij.uid,
                    slotted_into_landfield_id: ij.slotted_into_landfield_id,
                    found_at: "inventory",
                }));
            } else {
                window.allJewels = [
                    ...window.inventoryJewels.map((ij) => ({
                        id: ij.id,
                        base_effects: ij.base_effects,
                        color_name: ij.color_name,
                        effect_strength_pct: ij.effect_strength_pct,
                        quality_level: ij.quality_level,
                        quality_value: ij.quality_value,
                        tier: ij.tier,
                        full_value: ij.tier * 100 + ij.quality_value,
                        uid: ij.uid,
                        slotted_into_landfield_id: ij.slotted_into_landfield_id,
                        found_at: "inventory",
                    })),
                    ...mentars
                        .map((m) => m.attributes.jewels.data)
                        .flat()
                        .map((mj) => ({
                            id: mj.id,
                            base_effects: mj.attributes.baseEffects,
                            color_name: mj.attributes.colorName,
                            effect_strength_pct: mj.attributes.effectStrengthPct,
                            quality_level: mj.attributes.qualityLevel,
                            quality_value: mj.attributes.qualityValue,
                            tier: mj.attributes.tier,
                            full_value: mj.attributes.tier * 100 + mj.attributes.qualityValue,
                            uid: mj.attributes.uid,
                            slotted_into_landfield_id: mj.attributes.slottedIntoLandfieldId,
                            found_at: "mentar",
                        })),
                ];
            }
            window.allJewels.forEach(j => { j.color_name_abbr = jewelData.jewel_types.find(jt => jt.uid === j.uid).color_name_abbr });
        }
    }

    initAllJewelsCopy () {
        if (config.useJewelStacks) {
            window.allJewelStacksCopy = JSON.parse(JSON.stringify(window.alljewelStacks));
        } else {
            window.allJewelsCopy = JSON.parse(JSON.stringify(window.allJewels)).sort((a, b) => a.full_value < b.full_value ? 1 : -1);
        }
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
            m.slottings = {
                naiveApproach: [],
                rarestResourceFirst: [],
                leastAmountThenRarest: [],
            };
            m.droids = {
                naiveApproach: [],
                rarestResourceFirst: [],
                leastAmountThenRarest: [],
            }
        });

        return result;
    }
}

let dataAccess = new DataAccess();
await dataAccess.getData();

// let materialNamesFromJewelData = jewelData.jewel_types.map(j => j.priming).flat().filter(j => j).map(j => j.toUpperCase());
// let materialNamesFromConstants = ___reactContext.constantsStore.resourcesConstantsStore.allMaterialOptions.map(m => m.id.toUpperCase());

class JewelSlotRules {

    constructor() {
        this.materials = ___reactContext.constantsStore.resourcesConstantsStore.allMaterialOptions.map(m => ({
            discovery_tier: m.discovery_tier,
            id: m.id,
            label: m.label,
            name: m.name,
            jewel: jewelData.jewel_types.find(j => j.priming?.map(jp => jp.toUpperCase()).includes(m.id.toUpperCase()))
        }));

        this.materialsSorted = this.materials.sort((a, b) => a.discovery_tier < b.discovery_tier ? 1 : -1)

        this.materialJewels = this.materials.reduce((map, obj) => map.set(obj.id, obj.jewel?.color_name), new Map());

        const arr = [
            [32, "iridium", 9, "MAGNETAR", "PURPLE"],
            [31, "thorium", 9, "ROTEOR", "TANZANITE"],
            //D8
            [30, "vanadium", 8, "SCARAB", "BLOODSTONE"],
            [29, "rhenium", 8, "OHR", "PERIDOT"],
            [28, "uranium", 8, "ALUKAH", "PREHNITE"],
            //D7
            [27, "tellurium", 7, "BLAIZER", "AQUAMARINE"],
            [26, "tantalum", 7, "BLAIZER", "OBSIDIAN"],
            [25, "boron", 7, "EMBER", "ANDALUSITE"],
            [24, "molybdenum", 7, "EMBER", "CATSEYE"],
            //D6
            [23, "titanium", 6, "ZIRAH", "TITANITE"],
            [22, "zirconium", 6, "HOWLER", "ZIRCON"],
            [21, "neodymium", 6, "HOWLER", "SLATE"],
            //D5
            [20, "diamond", 5, "STARLIGHT FURY", "TURQUOISE"],
            [19, "niobium", 5, "STARLIGHT FURY", "TOPAZ"],
            [18, "platinum", 5, "STARLIGHT FURY", "SODALITE"],
            //D4
            [17, "cobalt", 4, "JINGO", "AZURITE"],
            [16, "chromium", 4, "VENATOR", "SUNSET"],
            //D3
            [15, "tungsten", 3, "NECROSIGNAL", "AMBER"],
            [14, "nickel", 3, "CAELIFER", "TIGEREYE"],
            [13, "tin", 3, "GAMBIT", "RUBY"],
            [12, "silver", 3, "DELA", "PYRITE"],
            //D2
            [11, "zinc", 2, "FANGMAW", "SUNSTONE"],
            [10, "bauxite", 2, "ZEPHYR", "GARNET"],
            [9, "gold", 2, "AURUM", "YELLOW"],
            //D1
            [8, "copper", 1, "GULI", "MALACHITE"],
            [7, "coal", 1, "FURY", "ANTHRACITE"],
            [6, "oil", 1, "GILEUMBO", "BLACK"],
            [5, "iron", 1, "CEPHALO", "OCHRE"],
            [4, "limestone", 1, "MOTUS", "GREY"],
            [3, "water", 1, "SPHERA", "BLUE"],
            [2, "wood", 1, "SALIX", "GREEN"],
            [1, "sand", 1, "MOLEH", "SANDY"],
        ];
        this.materialDroids = new Map(arr.map((obj) => [obj[1], obj[3]]));
        this.jewelDroids = new Map(arr.map((obj) => [obj[4], obj[3]]));

    }

    CanPrimeMaterial (mentar, material) {
        const shouldntPrimeMaterial = material.discovery_tier >= 7 && mentar.attributes.landfieldTier === 2 && config.skipT2D7_9;
        return !shouldntPrimeMaterial;
    }

    IsJewelColorInSlottings (mentar, key, jewelName) {
        return mentar.slottings[key].find(j => j.color_name === jewelName)
    }

    IsMaterialPrimed (mentar, key, material) {
        const color_name = rules.materialJewels.get(material.id);
        return mentar.attributes.jewels.data.find(j => j.attributes.colorName === color_name)
            || mentar.slottings[key].find(j => j.color_name === color_name); //I hate property naming discrepancies (colorName, color_name)
    }

    HasEnoughSpaceInSlotting (mentar, key) {
        return mentar.slottings[key].length < mentar.attributes.slotsCount;
    }

    HasEnoughSpaceInSlottingAndSlotted (mentar, key) {
        return mentar.attributes.jewels.data.length + mentar.slottings[key].length < mentar.attributes.slotsCount;
    }

    CanAddJewel (mentar, key, jewel, role) {
        let hasEnoughSpace = true;
        if (config.calculateIdealPriming) {
            hasEnoughSpace = this.HasEnoughSpaceInSlotting(mentar, key);
        } else {
            hasEnoughSpace = this.HasEnoughSpaceInSlottingAndSlotted(mentar, key);
        }

        let result = hasEnoughSpace;
        if (result && config.avoidInterference) {
            //we can find a jewel either in the current slottings or in the newly calculated one
            //who's abbreviation
            let interferences = jewelData.jewel_types.find(jt => jt.color_name === jewel.color_name).interferences;
            let hasInterference = mentar.attributes.jewels.data.some(j => interferences.includes(j.color_name))
                || mentar.slottings[key].some(j => interferences.includes(j.color_name));
            result = result && !hasInterference;
        }

        if (result) {
            //if slotOnly1PrimingJewelAndNothingElse_Between_ is set and mentar is within tile limits:
            //* for priming we only allow one -> any present in slottings or already slotted -> result is false
            //* booster, filler -> not allowed
        }


        return result;
    }

    GetFakeJewel (color_name, role, priming_target) {
        return {
            color_name: color_name,
            role: role,
            base_effects: {
                priming: {
                    target: [priming_target]
                }
            }
        }
    }

    TryAddJewel (mentar, key, color_name, role) {
        if (!config.useJewelStacks) {

            let jewel = allJewelsCopy.find(j => j.color_name === color_name);
            if (jewel && this.CanAddJewel(mentar, key, jewel, role)) {
                jewel.role = role;
                mentar.slottings[key].push(jewel);
                allJewelsCopy = allJewelsCopy.filter(j => j.id !== jewel.id);
            }

        } else {
            let stack = allJewelStacksCopy.find(js => js.color_name === color_name && js.count > 0);
            if (stack) {
                let jewel_type = jewelData.jewel_types.find(jt => jt.uid === stack.uid)
                let jewel = this.GetFakeJewel(stack.color_name, role, jewel_type.priming_lower[0]);
                if (this.CanAddJewel(mentar, key, jewel, role)) {
                    jewel.role = role;
                    jewel.id = stack.id;
                    stack.count -= 1;
                    mentar.slottings[key].push(jewel);
                }

            }
        }
    }
}
let rules = new JewelSlotRules();

class Logger {
    static logProperty (mentar) {
        let mentarResources = mentar.resources.map(r => ({ message: `\r\n\t\t[${r.id} - %c${r.attributes.category}%c]`, color: this.getResourceQualityColor(r) }));

        let message = `[${mentar.id}] T%c${mentar.attributes.landfieldTier}%c TC:%c${mentar.attributes.tilesCount}%c\r\n`;
        message += `\t resources: ${mentarResources.map(r => r.message).flat()}`;
        let formats = [
            'color:deeppink;', 'color:snow;',
            'color:deepskyblue;', 'color:snow',
            ...mentarResources.map(r => [r.color, 'color:snow;']).flat()
        ];
        console.log(message, ...formats);
        console.log("\tslottings: ", mentar.slottings);
    }

    static getResourceQualityColor (resource) {
        let result = "color:"
        switch (resource.attributes.category) {
            case "copious":
                result += "gold"; break;
            case "rich":
                result += "lawngreen"; break;
            case "moderate":
                result += 'orange'; break;
            case "sparse":
                result += 'coral'; break;
            case "deficient":
                result += "crimson"; break;
            case "unknown":
                result += "khaki"; break;
            default:
                result += 'magenta'; break;
        }
        return `${result};`;
    }

    static logResourceAndPropertyCounts () {
        let resourceCounts = mentarsWithResources.reduce((counts, entity) => {
            const value = entity.resources.length;
            counts[value] = (counts[value] || 0) + 1;
            return counts;
        }, {});
        let resourceCountsArray = Object.keys(resourceCounts).map(okey => ({
            "resource count": parseInt(okey),
            "property count": resourceCounts[okey],
            "tier 1": mentarsWithResources.filter(m => m.attributes.landfieldTier === 1 && m.resources.length === parseInt(okey)).length,
            "tier 2": mentarsWithResources.filter(m => m.attributes.landfieldTier === 2 && m.resources.length === parseInt(okey)).length,
        })).sort()
        console.table(resourceCountsArray)
    }

    static getJewelCountMap (jewelsSlotted) {
        let jewelCounts = new Map();
        jewelsSlotted.forEach(jewel => {
            let color_name = jewel.color_name;
            if (!jewelCounts.get(color_name)) {
                jewelCounts.set(color_name, 0);
            }
            jewelCounts.set(color_name, jewelCounts.get(color_name) + 1);
        });
        return jewelCounts;
    }

    static getJewelCount (color_name) {
        if (config.useJewelStacks) {
            return alljewelStacks.filter(j => j.color_name === color_name).reduce((a, b) => a + b.count, 0);
        } else {
            return allJewels.filter(j => j.color_name === color_name).length //in inventory or already slotted
        }
    }

    static logSlottings (key) {

        let jewelNamesSorted = jewelData.color_names.sort();
        let allSlottings = allMentars.map(m => m.slottings);
        let allDroidsNeeded = allMentars.map(m => m.droids);

        const jewelsSlotted = allSlottings.map(m => m[key]).flat();
        const jewelCounts = this.getJewelCountMap(jewelsSlotted);

        let data = jewelNamesSorted.map(color_name => {
            let currentJewelCount = this.getJewelCount(color_name);
            let jewelCount = jewelCounts.get(color_name) ?? 0;

            let slottedByColor = jewelsSlotted.filter(j => j.color_name === color_name);

            //const droidName = rules.jewelDroids.get(color_name);
            let data = {
                jewel: color_name
            };
            data[`have in ${config.useInventoryJewelsOnly ? "inventory" : "inventory+slotted"}`] = currentJewelCount;
            if (!config.calculateIdealPriming) {

                data["total jewels needed"] = jewelCount;
                data["priming"] = slottedByColor.filter(j => j.role === config.jewel_roles.priming).length;
                data["boosting"] = slottedByColor.filter(j => j.role === config.jewel_roles.booster).length;
                data["filler"] = slottedByColor.filter(j => j.role === config.jewel_roles.filler).length;

            } else {
                data["total"] = jewelCount;
                data["to buy"] = Math.max(jewelCount - currentJewelCount, 0);
            }
            return data;

        });
        console.log(`jewels for '${key}' [%c${config.calculateIdealPriming ? "PRIMING ONLY" : "full slotting"}%c]`,
            ...[config.calculateIdealPriming ? "color:red" : "color:lime", "color:snow"]);
        console.table(data);

        if(config.calculateNeededDroids){
            this.logDroids(allDroidsNeeded, key);
        }
        
    }

    static logDroids (allDroidsNeeded, key) {
        let droids = allDroidsNeeded.map(m => m[key]).flat();

        let droidLogData = [];
        [...droidAppearances.values()].map(d => d.toUpperCase()).sort().forEach(droid_name => {
            let neededCount = droids.filter(d => d === droid_name).length;

            let entry = {
                "droid_name": droid_name,
                "needed": neededCount,
            };
            if (config.showDroidsToBuySell) {
                let haveCount = allDroids.filter(d => d.nameUpper === droid_name).length;
                entry["have currently"] = haveCount;
                entry["to buy"] = Math.max(neededCount - haveCount, 0);
                entry["to sell"] = Math.max(haveCount - neededCount, 0);
            }
            droidLogData.push(entry);
        })

        console.table(droidLogData);
    }
}

class JewelAndDroidNeedCalculator {

    calculate () {
        dataAccess.initAllJewels();

        this.naiveApproach();
        Logger.logSlottings(config.strategyNames.naive);
        this.rarestResourceFirst();
        Logger.logSlottings(config.strategyNames.rarestFirst);
        this.leastAmountThenRarest();
        Logger.logSlottings(config.strategyNames.leastFirst);
    }

    getMentarsOrdered (mentars) {
        return mentars.sort((a, b) => {
            //order by tier
            //then by resource count ascending
            if (a.resources.length > b.resources.length) {
                return 1;
            }

            if (a.attributes.tilesCount < b.attributes.tilesCount) {
                return 1;
            }

            return -1;
        })
    }

    naiveApproach () {
        //slot one property after another regardless of overall counts or yield
        //focus on the rarest resources possible
        console.log(`calculating [naive approach]`);
        let key = config.strategyNames.naive;
        this.resetSlottingAndDroid(key);
        dataAccess.initAllJewelsCopy();

        for (const mentar of mentarsWithResources) {

            const resources = mentar.resources.sort((a, b) => a.discovery_tier < b.discovery_tier ? 1 : -1) //sort by resource discovery level (rarest first)
                .slice(0, mentar.attributes.slotsCount) //only get jewels for the current slot count
            //mentar.slottings[key] = resources.map(res => rules.materialJewels.get(res.id));
            for (const material of resources) {
                if (rules.HasEnoughSpaceInSlotting(mentar, key)) {
                    let color_name = rules.materialJewels.get(material.id);
                    if (!rules.IsJewelColorInSlottings(mentar, key, color_name)) {

                        if (config.calculateIdealPriming) {
                            const jewel = rules.GetFakeJewel(color_name, config.jewel_roles.priming, material.id);
                            if (rules.CanAddJewel(mentar, key, jewel)) {
                                mentar.slottings[key].push(jewel);
                            }
                        } else {
                            rules.TryAddJewel(mentar, key, color_name, config.jewel_roles.priming);
                        }
                    }
                }
                this.addDroids(mentar, key, material);
            }
        }

        //only calculate boosters and fillers if we "really" slot
        if (!config.calculateIdealPriming) {
            this.addBoostersIfNeeded(mentarsWithResources, key);
            this.addFillerIfNeeded(mentarsWithResources, key);
            //add fillers for remaining plots
            this.addFillerIfNeeded(mentarsWithoutResources, key);
        }
    }

    rarestResourceFirst () {
        //go through each yield quality and slot for rarest first
        console.log(`calculating [highest yield level first - rarest first]`);
        let key = "rarestResourceFirst";
        this.resetSlottingAndDroid(key);

        dataAccess.initAllJewelsCopy();

        for (const yield_quality of config.resource_qualities) {
            for (const material of rules.materialsSorted) {
                for (const mentar of mentarsWithResources) {
                    if (mentar.resources.find(r => r.id === material.id)) {
                        //we have a [mentar] with a [material] of a [yield_quality]
                        //skip if resource D level is too high for T2 land (if set in config)
                        if (!rules.CanPrimeMaterial(mentar, material)) {
                            continue;
                        }

                        //add to slottings if we can
                        if (rules.HasEnoughSpaceInSlotting(mentar, key)) {
                            let color_name = rules.materialJewels.get(material.id);
                            if (!rules.IsJewelColorInSlottings(mentar, key, color_name)) {

                                if (config.calculateIdealPriming) {
                                    const jewel = rules.GetFakeJewel(color_name, config.jewel_roles.priming, material.id);
                                    if (rules.CanAddJewel(mentar, key, jewel)) {
                                        mentar.slottings[key].push(jewel);
                                    }
                                } else {
                                    rules.TryAddJewel(mentar, key, color_name, config.jewel_roles.priming);
                                }
                            }
                        }

                        this.addDroids(mentar, key, material);
                    }
                }
            }
        }

        //only calculate boosters and fillers if we "really" slot
        if (!config.calculateIdealPriming) {
            this.addBoostersIfNeeded(mentarsWithResources, key);
            this.addFillerIfNeeded(mentarsWithResources, key);
            //add fillers for remaining plots
            this.addFillerIfNeeded(mentarsWithoutResources, key);
        }

    }

    leastAmountThenRarest () {
        let key = config.strategyNames.leastFirst;
        this.resetSlottingAndDroid(key);

        let resourcesWithCounts = [];
        rules.materialsSorted.forEach(resource => {
            let mentarsWithMaterial = mentarsWithResources.filter(m => m.resources.some(mr => mr.id === resource.id));
            if (config.skipT2D7_9 && resource.discovery_tier >= 7) {
                mentarsWithMaterial = mentarsWithMaterial.filter(m => m.attributes.landfieldTier === 1);
            }
            resourcesWithCounts.push({
                resource: resource,
                mentars: mentarsWithMaterial
            });
        });

        resourcesWithCounts = resourcesWithCounts.sort((a, b) => {
            if (a.mentars.length > b.mentars.length) {
                return 1;
            }

            if (a.mentars.length < b.mentars.length) {
                return -1;
            }

            if (a.resource.discovery_tier < b.resource.discovery_tier) {
                return 1;
            }

            return -1;

        });

        dataAccess.initAllJewelsCopy();

        for (const resourceWithCount of resourcesWithCounts) {
            for (const mentar of resourceWithCount.mentars) {
                //add to slottings if we can
                if (rules.HasEnoughSpaceInSlotting(mentar, key)) {
                    let color_name = rules.materialJewels.get(resourceWithCount.resource.id);
                    if (!rules.IsJewelColorInSlottings(mentar, key, color_name)) {

                        if (config.calculateIdealPriming) {
                            const jewel = rules.GetFakeJewel(color_name, config.jewel_roles.priming, resourceWithCount.resource.id);
                            if (rules.CanAddJewel(mentar, key, jewel)) {
                                mentar.slottings[key].push(jewel);
                            }
                        } else {
                            rules.TryAddJewel(mentar, key, color_name, config.jewel_roles.priming);
                        }
                    }
                }

                this.addDroids(mentar, key, resourceWithCount.resource);
            }
        }

        //only calculate boosters and fillers if we "really" slot
        if (!config.calculateIdealPriming) {
            this.addBoostersIfNeeded(mentarsWithResources, key);
            this.addFillerIfNeeded(mentarsWithResources, key);
            //add fillers for remaining plots
            this.addFillerIfNeeded(mentarsWithoutResources, key);
        }
    }

    resetSlottingAndDroid (key) {
        mentarsWithResources.forEach(m => {
            m.slottings[key] = [];
            m.droids[key] = [];
        });
    }

    addDroids (mentar, key, material) {
        const droidCount = this.getDroidCount(mentar);
        if (droidCount > 0 && mentar.droids[key].length < droidCount) {

            if (config.onlyUseProspectorsForMaterialsPrimed && !rules.IsMaterialPrimed(mentar, key, material)) {
                //if we only want droids for the materials we primed, and the current material is present but not primed -> skip to next
                return;
            }

            const droidNameForMaterial = rules.materialDroids.get(material.id);
            if (!droidNameForMaterial) {
                console.warn(`no droid name for material [${material.id}]`);
            }

            mentar.droids[key].push(droidNameForMaterial);

            if (config.onlyAddDroidForOneResource) {
                while (mentar.droids[key].length < droidCount) {
                    mentar.droids[key].push(droidNameForMaterial);
                }
            }
        }
    }

    getDroidCount (mentar) {
        let tc = mentar.attributes.tilesCount;
        if (tc <= 3) {
            return 0;
        } else {
            switch (true) {
                case (this.between(tc, 4, 9)):
                    return 1
                case (this.between(tc, 10, 29)):
                    return 2
                case (this.between(tc, 30, 59)):
                    return 3
                case (this.between(tc, 60, 99)):
                    return 4
                case (this.between(tc, 100, 199)):
                    return 5
                case (this.between(tc, 200, 324)):
                    return 6
                case (this.between(tc, 325, 474)):
                    return 7
                case (this.between(tc, 475, 649)):
                    return 8
                case (this.between(tc, 650, 749)):
                    return 9
                case (tc >= 750):
                    return 10
            }
        }
    }

    between (number, limitLow, limitHigh) {
        return number >= limitLow && number <= limitHigh;
    }

    addBoostersIfNeeded (mentars, key) {
        // let mentars = mentarsWithResources;
        // let key = "rarestResourceFirst";
        for (let i = 0; i < mentars.length; i++) {

            const mentar = mentars[i];
            //console.log(`processing [${i + 1}/${mentars.length}]`, mentar);

            if (mentar.slottings[key].length > 0 && mentar.slottings[key].length < mentar.attributes.slotsCount) {
                //find booster jewels based on the jewels already slotted
                let potentialBoosters = jewelData.jewel_types.filter(jewel_type => //we need those prod_increase_lower entries where there's a match to the slotting array entries' base_effects.priming.target[0]
                    jewel_type.prod_increase_lower.filter(prod_increase =>
                        mentar.slottings[key].find(jewel => jewel.base_effects.priming.target[0].toLowerCase() === prod_increase)
                    ).length > 0
                    && !mentar.slottings[key].some(j => j.color_name === jewel_type.color_name)
                );
                if (potentialBoosters.length > 0) {
                    let boosterNames = potentialBoosters.map(boosterType => boosterType.color_name);
                    let boosterJewels = [];
                    if (!config.useJewelStacks) {
                        boosterJewels = boosterNames.map(boosterName => allJewelsCopy.find(j => j.color_name === boosterName)).filter(j => j).sort((a, b) => a.full_value < b.full_value ? 1 : -1);
                        if (config.calculateIdealPriming) {
                            boosterJewels = [];
                        }
                    } else {
                        boosterJewels = boosterNames.map(boosterName => allJewelStacksCopy.find(j => j.color_name === boosterName && j.count > 0)).filter(b => b);
                    }

                    if (boosterJewels.length > 0) {
                        for (const boosterJewel of boosterJewels) {
                            rules.TryAddJewel(mentar, key, boosterJewel.color_name, config.jewel_roles.booster);

                            if (mentar.slottings[key].length >= mentar.attributes.slotsCount) {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    addFillerIfNeeded (mentars, key) {
        // let mentars = mentarsWithResources;
        // let key = "rarestResourceFirst";
        // let allJewelsCopy = window.allJewels.filter(j => !mentars.map(m => m.slottings[key]).flat().find(sj => sj.id === j.id));
        for (let i = 0; i < mentars.length; i++) {
            const mentar = mentars[i];

            if (mentar.slottings[key].length < mentar.attributes.slotsCount) {
                //fill up with best remaining jewel

                if (config.calculateIdealPriming) {
                    return;
                }

                let fillerCount = mentar.attributes.slotsCount - mentar.attributes.jewels.data.length - mentar.slottings[key].length;
                if (fillerCount === 0) {
                    continue;
                }

                let fillers = [];
                if (!config.useJewelStacks) {
                    fillers = allJewelsCopy.filter(filler => rules.CanAddJewel(mentar, key, filler)).splice(0, fillerCount);
                    fillers.forEach(filler => {
                        filler.role = config.jewel_roles.filler;
                        mentar.slottings[key].push(filler);
                        allJewelsCopy = allJewelsCopy.filter(j => j.id !== filler.id);
                    });
                } else {
                    let t3mixedStacks = allJewelStacksCopy.filter(j => config.plus3_jewels.includes(j.color_name)).sort((a, b) => {
                        let indexA = config.jewel_qualities.indexOf(a.quality_level);
                        let indexB = config.jewel_qualities.indexOf(b.quality_level);
                        if (indexA > indexB) {
                            return 1;
                        } else if (indexA == indexB && a.color_name < b.color_name) {
                            return 1;
                        }
                        return -1
                    });
                    let others = allJewelStacksCopy.filter(j => !config.plus3_jewels.includes(j => j.color_name));

                    //let allPossibleStacks = [...t3mixedStacks, ...others].filter(jewel_stack => jewel_stack.count > 0);

                    for (let i = 0; i < fillerCount; i++) {
                        t3mixedStacks.forEach(stack => {
                            rules.TryAddJewel(mentar, key, stack.color_name, config.jewel_roles.filler);
                        })
                    }
                    for (let i = 0; i < fillerCount; i++) {
                        others.forEach(stack => {
                            rules.TryAddJewel(mentar, key, stack.color_name, config.jewel_roles.filler);
                        })
                    }
                    
                }
            }
        }

    }

    async doSlot (key) {

        if (config.calculateIdealPriming) {
            console.warn(`config for calculating ideal priming only is set, abort slutting`);
            return;
        }

        for (let i = 0; i < allMentars.length; i++) {
            let mentar = allMentars[i];
            console.log(`slotting: [${i + 1}/${allMentars.length}] T${mentar.attributes.landfieldTier} TC:${mentar.attributes.tilesCount}`, mentar);

            if (mentar.slottings[key].length !== 0) {
                if (!config.useJewelStacks) {
                    console.log(`\t ${mentar.slottings[key].map(j => `[ T${j.tier} ${j.quality_level} ${j.color_name}]`).join(" | ")}`);
                }


                for (const jewel of mentar.slottings[key]) {
                    if (!config.useJewelStacks) {
                        await ___reactContext.api.updateJewelSlotting({ id: jewel.id, slottedIntoLandfieldId: mentar.id });
                    } else {
                        await ___reactContext.api.apiClient.patch("jewel_stacks/" + jewel.id + "/", {
                            jewel_stack_id: jewel.id,
                            slotted_into_landfield_id: mentar.id
                        })
                    }

                }

                await helper.sleep(1000);
                if ((i + 1) % 10 === 0) {
                    if ((i + 1) % 50 === 0) {
                        await helper.sleep(5000);
                    }
                    await helper.sleep(5000);
                }
            }
        }
        console.log(".. done ..");
    }

    getNotFullySlutted = () => allMentars.filter(j => j.attributes.slotsCount !== j.attributes.jewels.data.length);
}
let slutter = new JewelAndDroidNeedCalculator();
slutter.calculate()
