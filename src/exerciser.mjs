import {fetch}  from 'cross-fetch';
import fs from 'fs';
import {createClient} from '@urql/core';
import Web3 from 'web3';
import {BNB_AGGREGATOR, ETH_AGGREGATOR} from './constants.mjs';
const QUERY = `
query Test($first: Int!, $now: BigInt!, $excrciserTime: BigInt!) {
  options(first: $first, orderBy:source, 
    where: {state: 1, expiredtime_gt: $now, expiredtime_lt: $excrciserTime}
    ) {
    optionId
    strike
    direction
    symbol
    user {
        id
        
    }
  }
}`;

let timeout ;
let exerciser_bf_time;
let web3;
let contract;
let options_manager_contract;
let account;
let client;
let exerciser;
let bnb_aggregator;
let eth_aggregator;
/** 
 * args[0] = 用户秘钥
 * args[1] = Exerciser合约地址
 * args[2] = OptionsManager合约地址
 * args[3] = 定时器间隔(s)
 * args[4] = 提前多少秒进行自动行权(s)
 * args[5] = rpc_url
 * args[6] = 查询期权订单thegraph URL
 * */ 
async function start() {
    let args = process.argv.slice(2);
    if(args.length < 7) {
        console.info("args error");
        return;
    }
    exerciser = args[1].trim();
    timeout = 1000 * args[3]
    exerciser_bf_time = Number(args[4])
   
    console.info(`
        key = ${args[0]}, Exerciser: ${args[1]},
        OptionsManager: ${args[2]}
        timeout: ${args[3]}, exerciser_bf_time: ${args[4]}
        web3_url: ${args[5]}, thegraph_url: ${args[6]},
      
    `);

    web3 = new Web3(args[5].trim());
    await initAccount(args[0].trim());
    initContract(args[1].trim(), args[2].trim());
    client = createClient({
        url: args[6].trim(),
       fetch: fetch
    });
    console.info("app starting ..." );
    console.info("-------------------------------------" ); 
    next()
}

async function initAccount(key) {
    account = await web3.eth.accounts.privateKeyToAccount(key);
    await web3.eth.accounts.wallet.add(key);
}

function initContract(exercise_address,  options_manager_address) {
    //通过ABI和地址创建合约
    let json_interface_str = fs.readFileSync("abi/Facade.json").toString().trim();
    let json_interface = JSON.parse(json_interface_str);    
    contract = new web3.eth.Contract(json_interface, exercise_address); 
  
    json_interface_str = fs.readFileSync("abi/OptionsManager.json").toString().trim();
    json_interface = JSON.parse(json_interface_str);    
    options_manager_contract = new web3.eth.Contract(json_interface, options_manager_address);
    
    json_interface_str = fs.readFileSync("abi/AggregatorV3Interface.json").toString().trim();
    json_interface = JSON.parse(json_interface_str);    
    bnb_aggregator = new web3.eth.Contract(json_interface, BNB_AGGREGATOR);

    json_interface_str = fs.readFileSync("abi/AggregatorV3Interface.json").toString().trim();
    json_interface = JSON.parse(json_interface_str);    
    eth_aggregator = new web3.eth.Contract(json_interface, ETH_AGGREGATOR);
    
}
async function next() {
    setTimeout(async () => {
        try {
            let now = getNowSceond();
            let excrciser_time = now + exerciser_bf_time;
            console.info(`excrciser_time = ${excrciser_time}`)
            let res =  await (client.query(QUERY, { first: 100, now: now, excrciserTime: excrciser_time }).toPromise())
            //console.info(res)
            console.info(JSON.stringify(res.data.options) + getNowSceond())
            exercise(res.data.options)
        } catch(e) {
            console.error(e)
        }
        next() 
    }, timeout)
}

/**
 * 
 * @param {*} options 
 */
async function exercise(options) {
    options.forEach(async (item)=> {
        let isApprovedForAll = await options_manager_contract.methods.isApprovedForAll(item.user.id, exerciser).call();
        console.info(`user: ${item.user.id} , exerciser: ${exerciser} , isApprovedForAll: ${isApprovedForAll}`)
        if(!isApprovedForAll) return ;
        let lastPrice = 0;
        if ("bnb" == item.symbol.toLowerCase()) {
            let data = await bnb_aggregator.methods.latestRoundData().call();
            lastPrice = data.answer;
        } else if("eth" == item.symbol.toLowerCase()) {
            let data = await eth_aggregator.methods.latestRoundData().call();
            lastPrice = data.answer;
        } else {
            return;
        }
        let price_sub = lastPrice - item.strike;
        if(item.direction == 0 && price_sub < 0) {
            contract.methods.exercise(item.optionId).estimateGas({from: account.address}).then(function(gasAmount) {
                console.info(`${contract._address} exercise gasAmount ${gasAmount} `)
                return contract.methods.exercise(item.optionId).send({from: account.address, gas: gasAmount + 100})
            })
        } else if(item.direction == 1 && price_sub > 0) {
            contract.methods.exercise(item.optionId).estimateGas({from: account.address}).then(function(gasAmount) {
                console.info(`${contract._address} exercise gasAmount ${gasAmount} `)
                return contract.methods.exercise(item.optionId).send({from: account.address, gas: gasAmount + 100})
            })
        }
        
    })
}

start();

function getNowSceond() {
    return Math.floor(Date.now()/ 1000)
}