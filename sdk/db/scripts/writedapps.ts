import { ChainID } from "../../../registry/chains";
import { addDapp } from "../prisma/dapps";
import untypedDapps from "./dapps.json";
import { dappInfo } from "./dapp_interface";
const dapps : dappInfo[] = untypedDapps;

function nameToChainId(name: string) : number {
    if (name == "Ethereum") {
        return ChainID.Ethereum;
    }else if(name == "Binance") {
        return ChainID.BNBChain;
    }else if(name == "Avalanche") {
        return ChainID.Avalanche;
    }else if(name == "Polygon") {
        return ChainID.Polygon;
    }else if(name == "Arbitrum") {
        return ChainID.Arbitrum;
    }else if(name == "Fantom") {
        return ChainID.Arbitrum;
    }else if(name == "Moonbeam") {
        return ChainID.Moonbeam;
    }else if(name == "Celo") {
        return ChainID.Celo;
    }else if(name == "Kava") {
        return ChainID.Kava;
    }else{
        return -1;
    }
  
}

async function uniqueCateogories()  {
    let cs = new Set<string>();
    for (const dapp of dapps) {
        cs.add(dapp.category);
    }
    console.log(cs);
}

async function writeDapps() {
    let promises : Promise<void>[] = [];
    
    for (const dapp of dapps) {
        for (const chain of dapp.chains) {
            if (nameToChainId(chain) == -1) continue;
            promises.push(addDapp(
                dapp.slug,
                dapp.name,
                dapp.logo,
                dapp.url,
                dapp.description,
                nameToChainId(chain),
                dapp.address,
                dapp.symbol,
                dapp.gecko_id,
                dapp.cmcId,
                dapp.twitter,
                dapp.category,
                dapp.tvl
            ));
        }
    }
    Promise.all(promises.map(p => p.catch(e => e)));
    
}

if (require.main === module) {
    (async () => {
        await writeDapps()
    })();
}