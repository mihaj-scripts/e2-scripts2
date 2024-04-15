//HOW TO USE:
//1) check config values, by default it checks for properties with 16 tiles or more, and just lists the civs that should be built
//NOTE: build cost is 10x civs to build in e-ther
//2) if you run it once and want to build, change the value of doAddGeologist to true and run again
//or type this into console and press enter (without reloading the page): api.AddGeologists(landfieldsToAddCiv) 

let config = {
    minTileCount: 16,
    doAddGeologist: false,
}

Rollbar.configure({ enabled: false });

window.___reactContext = Array.from(document.querySelectorAll("*"))
  .filter((t) => Object.keys(t).some((tk) => tk.includes("reactFiber")))
  .map((el) => el[Object.keys(el).find((tk) => tk.includes("reactFiber"))])
  .find(
    (zu) => zu.return?.dependencies?.firstContext?.context
  ).return.dependencies.firstContext.context._currentValue;

eval(
  await fetch(
    "https://raw.githubusercontent.com/mihaj-scripts/e2-scripts2/main/_other/get_helper.js"
  ).then((t) => t.text())
);

class E2API {
  async GetAllCivilianLandfields() {
    const firstPageData = await this.GetCivilianLandfieldPage(1);
    console.log("first page: ", firstPageData);
    const pageCount = firstPageData.meta.pages;
    const defaultWaitTime = this.GetDefaultWaitTime(pageCount);

    let civilianLandfields = firstPageData.data; 
    for (let i = 2; i <= pageCount; i++) {
        console.log(`getting landfields, page [${i}/${pageCount}]`);
        let pageData = await this.GetCivilianLandfieldPage(i);
        civilianLandfields = [...civilianLandfields,...pageData.data];
        await helper.sleep(helper.getWaitTime(i, defaultWaitTime));
    }

    console.log("got all civilian landfields");
    return civilianLandfields;
  }

  GetDefaultWaitTime(pageCount) {
    return pageCount <= 50
      ? 128
      : pageCount <= 100
      ? 256
      : pageCount <= 500
      ? 512
      : 1024;
  }

  async GetCivilianLandfieldPage(pageNumber) {
    return (
      await ___reactContext.api.apiClient.get("/civilians/landfields", {
        params: {
          page: pageNumber,
          q: "",
          sortBy: "description",
          sortDir: "asc",
        },
      })
    ).data;
  }

  async GetAndAddAllCivilians(civilianLandfields){
    let chunkSize = 25;
    let civIds = civilianLandfields.map(cl => cl.meta.civilianIds).flat();

    let civilians = [];
    while(civIds.length > 0){
        let chunk = civIds.splice(0,chunkSize);
        console.log(`processing [${chunk.length}], remaining: ${civIds.length}`);

        let civData = await this.GetCivilians(chunk);
        civilians = [...civilians,...civData.data];
        await helper.sleep(helper.getWaitTime(0, 500));
    }

    console.log(`got all civilians`)

    for(const civ of civilians){
        const matchingLandfield = civilianLandfields.find(l => l.id === civ.attributes.landfieldId)
        if(!matchingLandfield.civilians){
            matchingLandfield.civilians = [];
        }
        matchingLandfield.civilians.push(civ);
    }

    console.log(`assigned all civ to landfields`)

    return civilians;
  }

  async GetCivilians(civilianIds){
    //let civilianIds = ['435b0b34-9c57-4d3b-9c6a-e43618640446','9dcfe3ca-b95c-4fe2-8aeb-2aa48c3fcbd3']
    let result = (await ___reactContext.api.apiClient.get("/civilians", {
        params: {
            ids: civilianIds,
        }
    })).data;
    return result;
  }

  async GetResources(civilianLandfields){
    console.log("getting resources")
    let chunkSize = 50;
    let landfieldIds = civilianLandfields.map(m => m.id);

    let index = 1;
    let result = [];
    while(landfieldIds.length > 0){
        let chunk = landfieldIds.splice(0,chunkSize);
        console.log(`processing [${chunk.length}], remaining: ${landfieldIds.length}`);
        let landfieldResources = await ___reactContext.api.resourcesClient.get("/v1/landfields/"+chunk.join(","));
        result = [... result, ... landfieldResources.data.data];
        await helper.sleep(helper.getWaitTime(index,500));
    }
    console.log("got all resources");
    
    for(const civilianLandfield of civilianLandfields){
        civilianLandfield.resources = result.find(r => r.id === civilianLandfield.id);
    }

    return result;
  }

  async AddGeologists(landfields){
    console.log(`landfields to process: ${landfields.length}`);
    for(let i = 0; i<landfields.length; i++){
        console.log(`processing ${i+1}/${landfields.length}`);
        const landfield = landfields[i];
        ___reactContext.civiliansRepositoryStore.createCivilians({
            landfieldId: landfield.id,
            occupations: ["geologist"]
        })
        await helper.sleep(helper.getWaitTime(i,500));
    }
    
  }
}

const api = new E2API();
const civilianLandfields = await api.GetAllCivilianLandfields();

const civilians = await api.GetAndAddAllCivilians(civilianLandfields);

const resources = await api.GetResources(civilianLandfields);

console.log(`total landfield count: ${civilianLandfields.length}`);
let landfieldsWithResources = civilianLandfields.filter(l => l.resources?.attributes?.resources?.data?.length > 0);
console.log(`landfields with resources: ${landfieldsWithResources.length}`);
let landfieldsWithResourcesWithoutGeologist = landfieldsWithResources.filter(l => !l.civilians || !l.civilians.find(c => c.attributes.occupation === "geologist"));
console.log(`landfields with resources, without geologist: ${landfieldsWithResourcesWithoutGeologist.length}`);
let landfieldsToUse = landfieldsWithResourcesWithoutGeologist.filter(l => l.attributes.tileCount >= config.minTileCount);
console.log(`landfields with resources, without geologist, >= ${config.minTileCount} tiles: ${landfieldsToUse.length}`);

let landfieldsToAddCiv = landfieldsToUse.sort((a,b) => a.attributes.tileCount < b.attributes.tileCount ? 1 : -1)

console.log(`civilians to add: ${landfieldsToAddCiv.length}`)

if(config.doAddGeologist){
    api.AddGeologists(landfieldsToAddCiv);
}

