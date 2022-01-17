import {fetch}  from 'cross-fetch';
import fs from 'fs';
import {createClient} from '@urql/core';
import Web3 from 'web3';
import config from './config.js'
let web3;
let client;
let contract;
let account;
let poolAbi;
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

async function start() {
    
    web3 = new Web3(config.rpc_url)
    await initAccount(config.secret_key.trim());
    initContract(config.options_facade_address.trim());
    console.info("app starting ..." );
    console.info("-------------------------------------" );
    client = createClient({
       url: thegraph_url,
       fetch: fetch
    });
    next(config.interval * 1000)
}

async function initAccount(key) {
    account = await web3.eth.accounts.privateKeyToAccount(key);
    await web3.eth.accounts.wallet.add(key);
}

function initContract(options_facade_address) {
    //通过ABI和地址创建合约
    let jsonInterfaceStr = fs.readFileSync("abi/Facade.json").toString().trim();
    let jsonInterface = JSON.parse(jsonInterfaceStr);
    poolAbi = fs.readFileSync("abi/Pool.json").toString().trim();
    poolAbi = JSON.parse(poolAbi);
    contract = new web3.eth.Contract(jsonInterface, options_facade_address); 
}

async function next(interval) {
    setTimeout(async () => {
        try {
            let res =  await (client.query(QUERY, { first: 10, now: getNowSceond() }).toPromise())
            //console.info(res)
            console.info(res.data.options + getNowSceond())
            let map = data2map(res.data.options)
            await handleData(map, account, contract)
        } catch(e) {
            console.error(e)
            next(interval) 
        }
        next(interval) 
    }, interval)
    
}

async function handleData(map, account, contract) {
    let keys = Object.keys(map);
    keys.forEach(async (item)=> {
       let poolContract = getPoolContract(item);
       console.info(`item = ${item} ${map[item]}`)
       let first = await poolContract.methods.options(map[item][0]).call();
       console.info(`-------------------------------------`)
       if(first.state != 1) {
        //console.info(first)
        return
       }
       await contract.methods.unlockAll(item, map[item]).estimateGas({from: account.address}).then(function(gasAmount) {
            console.info(`${contract._address} unlockAll gasAmount ${gasAmount} ids: ${map[item]}`)
            return contract.methods.unlockAll(item, map[item]).send({from: account.address, gas: gasAmount + 100})
        })
    })
}


function getPoolContract(poolAddress) {
    return new web3.eth.Contract(poolAbi, poolAddress); 
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