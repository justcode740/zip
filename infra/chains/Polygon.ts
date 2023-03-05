import { providers, Signer } from "ethers";
import Chain from "./Chain";
import Exchange from "../swap-aggregation/exchanges/Exchange";
import { ChainID } from "../../registry/chains";

class Polygon extends Chain {
    getChainId(): ChainID {
        return ChainID.Polygon;
    }
    getGasPrice(): number {
        throw new Error("Method not implemented.");
    }
    getExchanges(provider: providers.Provider | Signer): Record<string, Exchange> {
        // TODO Add quickswap etc here.
        throw new Error("Method not implemented.");
    }
    
}

export default Polygon;