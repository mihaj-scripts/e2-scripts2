/*
* Info: this script lets you fill up empty slots with the first available jewel
* (T1, T2 or T3)
*/

let config = {
    pageSize: 200,
}

Rollbar.configure({ enabled: false });

const modules = [
    "https://dl.dropboxusercontent.com/scl/fi/kg7za6607j8sv1ihvvv81/gen_helper.js?rlkey=7xpk50kbkoo1syuprcshpd7pp&st=e7kflaos&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/scod3ajivefap9vt2xdz4/gen_init.js?rlkey=a6ucdw6t1ehn50qyzeny8j85r&st=nv2o18f0&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/bm1vxkl1f5lwzb3a983gy/gen_api.js?rlkey=6o4tzz5gltqy3mrj2k7a45buh&st=321616pj&dl=1"
];

for (let i = 0; i < modules.length; i++) {
    eval(await fetch(modules[i]).then(r => r.text()));
}
_m.helper.createLogger("slotter_logger", "JWL", "sandybrown");

_m.data ||= {};
_m.data.inventoryJewelStacks = await _m.api.jewels.getJewelStacks();
_m.slotter_logger.info("got jewel stacks");

_m.data.mentars = await _m.api.mentars.getAllMentars();

class Slotter {
    constructor() {
        this.jewelStacks = JSON.parse(JSON.stringify(_m.data.inventoryJewelStacks));
    }

    calculate = () => {
        _m.slotter_logger.info(`calculating slottings`);
        const propertiesWithFreeSlots = _m.data.mentars.filter(m => m.attributes.jewels.data.length !== m.attributes.slotsCount);
        const propertyCount = propertiesWithFreeSlots.length;
        _m.slotter_logger.info(`Properties with free jewel slots: ${propertyCount}`);
        for (let i = 0; i < propertyCount; i++) {
            this.processProperty(propertiesWithFreeSlots[i], i, propertyCount);
        }
        _m.slotter_logger.info(`slottings calculated`);
    }

    processProperty = (property, index, total) => {
        try {
            property.slottings = [];
            const attr = property.attributes;
            const freeCount = attr.slotsCount - attr.jewels.data.length
            //_m.slotter_logger.log(`[${index + 1} / ${total}] Processing ${attr.description} \r\n* free jewel slots: ${freeCount} / ${attr.slotsCount}`);
            for (let i = 0; i < freeCount; i++) {
                let availableStack = this.getAvailableStack();
                if (!availableStack) {
                    _m.slotter_logger.warn(`\tNo suitable jewel for ${attr.description} this slot ${i + 1} / ${attr.slotsCount}!`);
                    break;
                }
                //_m.slotter_logger.log(`\t ${i+1} available stack found ${this.getSlottingFormatted(availableStack)}`);

                property.slottings.push({
                    stack_id: availableStack.id,
                    tier: availableStack.tier,
                    quality_level: availableStack.quality_level,
                    color_name: availableStack.color_name
                });
                availableStack.count--;
            }
            property.slottingsFormatted = property.slottings.map(s => this.getSlottingFormatted(s)).join("\r\n");
            //_m.slotter_logger.log(`slotting: \r\n${slottingsFormatted}`);
        } catch (e) {
            _m.slotter_logger.warn("an error occure while processing the property ", e);
        }
    }

    getAvailableStack = () => {
        let availableStack = null;
        for (let j = 1; j <= 3; j++) {
            availableStack = this.jewelStacks.find(s => s.tier === j && s.count > 0);
            if (availableStack)
                break;
        }
        return availableStack;
    }

    getSlottingFormatted = (s) => `* T${s.tier} ${s.quality_level.toLowerCase()} ${s.color_name.toLowerCase()}`;

    doSlot = async () => {
        try {
            let toSlut = _m.data.propertiesToSlut;
            for (let i = 0; i < toSlut.length; i++) {
                let p = toSlut[i];
                _m.slotter_logger.info(`slotting [${i + 1} / ${toSlut.length}]: ${p.attributes.description}`);
                for (let j = 0; j < p.slottings.length; j++) {
                    let s = p.slottings[j]
                    await _m.api.jewels.slotJewelStack(s.stack_id, p.id);
                    await _m.helper.sleep(500);
                }
                await _m.helper.sleep(500);
            }
            _m.slotter_logger.info("slotting finished");
            _m.helper.shamelessPlug()
        } catch (e) {
            console.warn("error in [doSlot]: ", e);
        }
    }
}

async function doSlot () {
    await _m.slutter.doSlot();
}

_m.slutter = new Slotter();
_m.slutter.calculate();

_m.data.propertiesToSlut = _m.data.mentars.filter(p => p.slottings);
if (_m.data.propertiesToSlut.length === 0) {
    _m.slotter_logger.info("no properties to slot :)");
} else {
    for (let i = 0; i < _m.data.propertiesToSlut.length; i++) {
        let p = _m.data.propertiesToSlut[i];
        const attr = p.attributes;
        const freeCount = attr.slotsCount - attr.jewels.data.length;
        console.log(`${i + 1} ${attr.description} | Slots: ${freeCount} / ${attr.slotsCount}\r\nSlottings:\r\n${p.slottingsFormatted}`);
    }
    _m.slotter_logger.info("For initiating actual slotting please type: ");
    console.log(`%cawait doSlot()`, 'color:deepskyblue');
    console.log(`and press enter :)`)
}

