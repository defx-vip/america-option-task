import {fetch}  from 'cross-fetch';
import fs from 'fs';
import {createClient} from '@urql/core';
import Web3 from 'web3';

let web3  = new Web3("https://data-seed-prebsc-1-s1.binance.org:8545");
let thegraph_url = "https://api.thegraph.com/subgraphs/name/honcur/american-option";
const QUERY = `
query Test($first: Int!, $now: BigInt!) {
  options(first: $first, orderBy:source, 
    where: {state: 1, expiredtime_lt: $now}
    ) {
    optionId
    source
  }
}`;
let timeout = 1000;
async function start() {
    let args = process.argv.slice(2);
    if(!args[0] && !args[1]) {
        console.info("args error");
        return;
    }
    let key = args[0];
    let contractAddress = args[1];
    thegraph_url = args[2];
    if(args.length >= 4) {
        timeout = 1000 * args[3]
    }
    console.info(`key = ${key}, address: ${contractAddress}, thegraph_url: ${thegraph_url}, timeout: ${timeout}`);
 
    //通过ABI和地址创建合约
    let jsonInterfaceStr = fs.readFileSync("abi/facade.json").toString().trim();
    let jsonInterface = JSON.parse(jsonInterfaceStr);    
    var contract = new web3.eth.Contract(jsonInterface, contractAddress); 
    let account1 = await web3.eth.accounts.privateKeyToAccount(key);
    await web3.eth.accounts.wallet.add(key);
    console.info("app starting ..." );
    console.info("-------------------------------------" );
    
    const client = createClient({
        url: thegraph_url,
       fetch: fetch
    });
    
    next(client, account1, contract)
}

async function next(client, account1, contract) {
    setTimeout(async () => {
        try {
            let res =  await (client.query(QUERY, { first: 5, now: getNowSceond() }).toPromise())
            //console.info(res)
            console.info(res.data.options + getNowSceond())
            let map = data2map(res.data.options)
            handleData(map, account1, contract)
        } catch(e) {
            console.error(e)
        }
        next(client, account1, contract) 
    }, timeout)
    
}

function handleData(map, account, contract) {
    let keys = Object.keys(map);
    keys.forEach((item)=> {
        contract.methods.unlockAll(item, map[item]).estimateGas({from: account.address}).then(function(gasAmount) {
            console.info(`${contract._address} unlockAll gasAmount ${gasAmount} ids: ${map[item]}`)
            return contract.methods.unlockAll(item, map[item]).send({from: account.address, gas: gasAmount + 100})
        })
    })
}

function data2map(data) {
    let map = {};
    data.forEach(item => {
        if(!map[item.source]) {
            map[item.source] = []
        } 
        map[item.source].push(item.optionId)
    })
    return map
}

start();

function getNowSceond() {
    return Math.floor(Date.now()/ 1000)
}