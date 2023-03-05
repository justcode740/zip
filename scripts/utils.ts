import { ethers } from "ethers"
// const fs = require("fs")

// which address
export async function fetchUniV3PoolsToFile(provider: ethers.providers.JsonRpcProvider, filename?: string) {
    if (filename == undefined) {
        filename = "UniV3Pools.json"
    }
    console.log((await provider.getNetwork()).chainId)
    console.log((await provider.getNetwork()).name)
    const curBlock = await provider.getBlockNumber()
    
    
    // const events = await uniV3Contract()
    // .queryFilter("*", 0, curBlock)

    // // console.log(events)
    // var argsArray: ethers.utils.Result[] = []
    // for (const event of events){
    //     if (event.event == 'PoolCreated') {
    //         argsArray.push(event.args!)
    //     }
    // }
    // var argsStr = JSON.stringify(argsArray);
    // fs.writeFile(filename, argsStr, 'utf8', (err: Error) => {
    //     if (err) {
    //         console.error(err);
    //         return;
    //     }
    //     console.log("The file was saved!");
    // });

}

enum ECOSYSTEM {
    EVM,
    COSMOS
}

// Zip encoding convention, used as global key throughout the system
// EVM: evm-<chain_id> EIP155 guarantee uniqueness
// Cosmos: cosmos-<chain_id> 
export function zipEncodeChain(eco: ECOSYSTEM, id: string) {
    switch (eco) {
        case ECOSYSTEM.EVM:
            return "evm" + id        
        case ECOSYSTEM.COSMOS:
            return "cosmos" + id
        default:
            throw new Error("unsupported ecosystem")
    }
    return 
}