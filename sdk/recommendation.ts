import { Item, RootObject } from "./covalent_transactions_parse";
import fetch, {Response} from 'node-fetch';
import { Permission } from "./interfaces";
import * as dotenv from "dotenv";
import { getCombinedNodeFlags, getNameOfDeclaration } from "typescript";
import DappInfoJSON from "./dappinfo.json";
import { ContractInfos } from "./etherscan_parse";
import { sleep } from "@axelar-network/axelarjs-sdk";
import { getHotDapps } from "./db/prisma/dapps";
import { dapp } from "@prisma/client";

dotenv.config();

export async function getRecommendedProtocols(masterkey: string): Promise<dapp[]> {
    // TODO: check if masterkey is in dataabase, if so fetch the pre-computed result and return immediately, if this is first request, then fetch all historitcal tx
    // TODO: add covalent chain id and fetch from all supported chains
    // const allTxURL = `https://api.covalenthq.com/v1/1/address/${masterkey}/transactions_v2/`
    // const resp = await fetch(allTxURL, {
    //     headers: {
    //         'Authorization': 'Basic '+btoa(process.env.COVALENT_API+":"),
    //         'Content-Type': 'application/json'}
    // });
    
    // var permissions : Permission[] = []
    // // console.log(resp)
    // const data: RootObject = JSON.parse(await resp.text());
    // // console.log(data);
    // if (data.error) {
    //     throw new Error("fail to parse historical transaction from covalent api");
    // }
    // // console.log(data)
    // // for (const item of data.data.items) {
    // //     console.log(item.to_address, item.to_address_label);
    // // }
    // let dappsNames = await computeHomePageRecommendation(data.data.items)

    // return [Dapp.GMX, ...dappsNames]
    const dapps = await getHotDapps(80);
    return randomSelect<dapp>(dapps, 20);

}

function randomSelect<T>(array: T[], n: number): T[] {
    // Define a comparator function that compares objects based on their indices
    const compare = (a: T, b: T) => {
      const indexA = array.indexOf(a);
      const indexB = array.indexOf(b);
      return indexA - indexB;
    };
  
    // Shuffle the array to randomize the order of the elements
    const shuffled = array.sort(() => Math.random() - 0.5);
  
    // Sort the shuffled array by index in ascending order
    const sorted = shuffled.sort(compare);
  
    // Select the first k elements, where k is a value larger than n and proportional to the index of each element in the sorted array
    const k = Math.ceil(n * (array.length - 1) / 2);
    const selected = sorted.slice(0, k);
  
    // Shuffle the selected elements to randomize their order
    const shuffledSelected = selected.sort(() => Math.random() - 0.5);
  
    // Return the first n elements from the shuffled and selected array
    return shuffledSelected.slice(0, n);
}

interface DappInfo {
    txhash: string;
    address: string;
    contractname: string;
}

function getContractName(addresses: string[]) : any[] {
    // const dappinfos: DappInfo[] = DappInfoJSON;
    const dapps = DappInfoJSON.filter((dapp) => addresses.includes(dapp.ContractAddress));
    return dapps
}

const TX_HISTORY_LOOKBACK = 20;
async function computeHomePageRecommendation(items: Item[]) : Promise<string[]> {
    if (items.length > TX_HISTORY_LOOKBACK) {
        items = items.slice(0, TX_HISTORY_LOOKBACK);
    }
    const etherscanApi = process.env.ETHERSCAN_API;
    let resps : Response[] = []
    let names = new Set<string>();
    const BATCH_IN_PARALLEL = 5; // etherscan rate limit is 5/second
    for (let i = 0; i < items.length; i++){
        let promises : Promise<Response>[]= [];
        for (let j=0; j<BATCH_IN_PARALLEL && i<items.length; i++,j++) {
            promises.push(fetch(`https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${items[i].to_address}&apikey=${etherscanApi}`)); // create the promise here!
        }
        for (const resp of await Promise.all(promises)) {
            const data: ContractInfos  = JSON.parse(await resp.text());
            for(const res of data.result){
                if (res.ContractName !== undefined && res.ContractName !== "") {
                    names.add(res.ContractName)
                }
                // console.log(res.ContractName)
            }
        }
        // need to use own crawler and database / upgrade to etherscan, very expensive tho, prob not worth it, need to index our own data anyway
        await sleep(0.3);
    }
    return Array.from(names);
    // let i = 0;
    // let resps : Response[] = [];
    // while (i < promises.length){
    //     const endIdx = Math.max(i+5, promises.length);
    //     const ress = await Promise.all(promises.slice(i, endIdx));
    //     resps.push(...ress);
    //     i = i + 5; // etherscan rate limit is 5/second
    // }
    // console.log(resps);

    // const resp = await fetch()
   
    // readdappinfo()
    // const addresses = items.map(item => item.to_address);
    // console.log(addresses)
    // console.log(getContractName(addresses))
    // console.log(addresses)
    // console.log(getContractName(addresses))
    
    // let promises = []
    // for(const item of items) {
    //     getContractName(item.to_address)
    // }
    
    // console.log(dappinfo);
    
}

if (require.main == module) {
    (async () => {
        console.log(await getRecommendedProtocols("0x3D71c08d432710123eaf8fC7278431518366A335"));
    })();
}