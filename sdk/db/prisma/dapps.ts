// name varchar [not null]
//   dappid varchar [not null, unique] // unique id:  name-chainid
//   logourl varchar
//   chainid bigint [not null]
//   created_at timestamp [default: `now()`]

import assert from "assert";
import  prisma  from "./client";
import type { dapp } from '@prisma/client'

interface Dapp {
    dapp: dapp;
    chains: number[];
}

// Add a new dapp
export async function addDapp(name_id: string, name: string, logo_url: string, home_page_link: string, description: string, chain_id: number, token_address: string, token_symbol: string, gecko_id: string, cmc_id: string, twitter: string, category: string, tvl: number)  {
    const insertQuery = `INSERT INTO dapp (name_id, name, logo_url, home_page_link, description, chain_id, token_address, token_symbol, gecko_id, cmc_id, twitter, category, tvl) VALUES ('${name_id}', '${name}', '${logo_url}', '${home_page_link}', '${description}', ${chain_id}, '${token_address}', '${token_symbol}', '${gecko_id}', '${cmc_id}', '${twitter}', '${category}', ${tvl})`;
    console.log(insertQuery);
    const result: number = await prisma.$executeRawUnsafe(insertQuery);
    assert(result==1, "insert fail");
}

export async function readDappByNameIdAndChainId(name_id: string, chain_id: number) : Promise<dapp> {
    const findQuery = `SELECT * FROM dapp WHERE name_id = '${name_id}' and chain_id = ${chain_id}`;
    const res = await prisma.$queryRawUnsafe<dapp[]>(findQuery);
    return res[0];
}

export async function readDappByNameId(name_id: string) : Promise<Dapp> {
    const findQuery = `SELECT * FROM dapp WHERE name_id = '${name_id}'`;
    console.log(findQuery);
    let res: dapp[] = [];
    let chainIds: Set<number> = new Set<number>();
    try {
        res =  await prisma.$queryRawUnsafe<dapp[]>(findQuery);
        for (const dapp of res){
            console.log(dapp.chain_id);
            chainIds.add(Number(dapp.chain_id));
        }
        await prisma.$disconnect();
    } catch (error) {
        await prisma.$disconnect();
    }
    return {dapp: res[0], chains: Array.from(chainIds)};
}

export async function readDappByChainId(chain_id: number, n?: number) : Promise<dapp[]>{
    if(!n) {
        n = 10;
    }
    const findQuery = `SELECT * FROM dapp WHERE chain_id = ${chain_id} order by tvl desc limit ${n}`;
    const res =  await prisma.$queryRawUnsafe<dapp[]>(findQuery);
    return res;
}

export async function readAllDapps() {
    const alldapps = await prisma.dapp.findMany();
    return alldapps;
}

export async function getHotDapps(num : number) : Promise<dapp[]> {
    const findQuery = `select distinct on (name_id, tvl) * from dapp where category = 'Dexes' or category = 'Yield' or category = 'Derivatives' or category = 'Options' or category = 'NFT Lending' order by tvl desc limit ${num}`;
    const res = await prisma.$queryRawUnsafe<dapp[]>(findQuery);
    return res;
}

interface nameId {
    name_id: string
}
export async function getDappSearchRes(query: string): Promise<Dapp[]> {
    const findQuery = `select distinct on (name_id, tvl) name_id from dapp where similarity(name, '${query}')>0.3 or similarity(category, '${query}')>0.5 order by tvl desc limit 30;`;
    const res = await prisma.$queryRawUnsafe<nameId[]>(findQuery);
    let promises : Promise<Dapp>[] = [];
    for(const name_id of res){
        promises.push(readDappByNameId(name_id.name_id));
    }
    const ress = await Promise.all(promises);
    console.log(ress);
    return ress;
}

if (require.main === module) {
    (async () => {
        await getDappSearchRes("yiel")
    })();
}

