import { providers, Signer } from "ethers";
import Chain from "./Chain";
import Exchange from "../swap-aggregation/exchanges/Exchange";
import { ChainID } from "../../registry/chains";
import UniswapV2 from "../swap-aggregation/exchanges/ethereum/UniswapV2";

class Avalanche extends Chain {
    getChainId(): ChainID {
        return ChainID.Avalanche;
    }
    getGasPrice(): number {
        throw new Error("Method not implemented.");
    }
    getExchanges(provider: providers.Provider | Signer): Record<string, Exchange> {
        return {
            TraderJoeV1: new UniswapV2(
              provider,
              "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
              ChainID.Avalanche,
              "TraderJoeV1"
            )
        };
    }
}

export default Avalanche;