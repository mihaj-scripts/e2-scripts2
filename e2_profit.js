//profit in cd, jewel and property trades
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

    Rollbar.configure({ enabled: false });
})();

//BAZAAR_PURCHASE,BAZAAR_PURCHASE_FEE,BAZAAR_SALE

class DATA_ACCESS {

    constructor(){
        this.itemsPerPage = 100;

        this.currentResult = [];
    }

    async getTransactionPage (pageNumber, balance_change_type) {
        const data = await ___reactContext.api.apiClient.get("/transactions/balance_changes", {
            params: {
                items: this.itemsPerPage,
                page: pageNumber,
                perPage: null,
                ticker: null,
                type: balance_change_type
            }})
        //console.log(`data [${pageNumber}]: `, data);

        return data.data;
    }

    async getAllTransactions (balance_change_type) {
        console.log(`getting all transactions for [${balance_change_type}]`)
        let firstPageData = await this.getTransactionPage(1, balance_change_type);

        let transactions = [];
        //throw new Error("test");

        let totalCount = firstPageData.meta.totalCount;
        let pageCount = Math.ceil(totalCount / this.itemsPerPage);

        let defaultWaitTime = 150;
        if (pageCount > 1000) {
            defaultWaitTime = 200;
            if (pageCount > 2000) {
                defaultWaitTime = 300;
            }
        }

        for (let i = 0; i <= pageCount; i++) {
            let pageNumber = i + 1;

            await helper.sleep(helper.getWaitTime(i, defaultWaitTime));


            let pageData = await this.getTransactionPage(pageNumber, balance_change_type);
            if (pageData) {
                transactions.push(pageData);
                this.currentResult.push(pageData);
            }
        }
        return transactions;
    }
}

let api = new DATA_ACCESS();
let bazaarTransactions = await api.getAllTransactions("BAZAAR_PURCHASE,BAZAAR_PURCHASE_FEE,BAZAAR_SALE");
let propertyTransactions = await api.getAllTransactions("PURCHASE,SALE");

let filterByAmount = (transactions, isBuy) => transactions.filter(tr => isBuy ? tr.attributes.amount < 0 : tr.attributes.amount > 0);

let sum = (transactions) => transactions.reduce((a,b) => a+b.attributes.amount, 0);

let summary = (allSpecificTransactions, prefix) => {
    let buys = filterByAmount(allSpecificTransactions, true);
    let sales = filterByAmount(allSpecificTransactions, false);
    let buysSum = sum(buys)*-1;
    let salesSum = sum(sales);
    console.log(`[${prefix}] buy: $${buysSum.toFixed(2)} | sale: ${salesSum.toFixed(2)} -> profit: ${(salesSum-buysSum).toFixed(2)} `);
}

let allPropertyTransactions = propertyTransactions.map(d => d.data).flat();
summary(allPropertyTransactions, "property");

let allBazaarTransactions = bazaarTransactions.map(d => d.data).flat()
let allDroidsTransactions = allBazaarTransactions.filter(t => t.relationships?.linkedObject?.data?.type === "bazaarDroidsDeal");
let allCivsTransactions = allBazaarTransactions.filter(t => t.relationships?.linkedObject?.data?.type === "bazaarCiviliansDeal");
let allJewelTransactions = allBazaarTransactions.filter(t => t.relationships?.linkedObject?.data === null || t.relationships?.linkedObject?.data?.type === "jewel");
let allHoloTransactions = allBazaarTransactions.filter(t => t.relationships?.linkedObject?.data?.type === "blueprintDeal" || t.relationships?.linkedObject?.data?.type === "blueprint");

summary(allDroidsTransactions, "droids");
summary(allCivsTransactions, "civs");
summary(allJewelTransactions, "jewel");
summary(allHoloTransactions, "holo");
