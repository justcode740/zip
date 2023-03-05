import { providers, Signer } from "ethers";
import { ChainID } from "../../registry/chains";
import BancorNetwork from "../swap-aggregation/exchanges/ethereum/BancorNetwork";
import OneInch from "../swap-aggregation/exchanges/ethereum/OneInch";
import UniswapV2 from "../swap-aggregation/exchanges/ethereum/UniswapV2";
import UniswapV3 from "../swap-aggregation/exchanges/ethereum/UniswapV3";
import Exchange from "../swap-aggregation/exchanges/Exchange";
import Chain from "./Chain";

class Ethereum extends Chain {
    getChainId(): ChainID {
      return ChainID.Ethereum;
    }
    getGasPrice(): number {
      throw new Error("Method not implemented.");
    }
    getExchanges(provider: providers.Provider | Signer): Record<string, Exchange> {
        return {
            UniswapV2: new UniswapV2(
              provider,
              "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
              ChainID.Ethereum,
              "UniswapV2"
            ),
            SushiSwap: new UniswapV2(
              provider,
              "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f",
              ChainID.Ethereum,
              "SushiSwap"
            ),
            Shibaswap: new UniswapV2(
              provider,
              "0x03f7724180AA6b939894B5Ca4314783B0b36b329",
              ChainID.Ethereum,
              "Shibaswap"
            ),
            UniswapV3_30: new UniswapV3(
              provider,
              "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
              "0xE592427A0AEce92De3Edee1F18E0157C05861564",
              3000,
              ChainID.Ethereum,
              "UniswapV3_30"
            ),
            UniswapV3_5: new UniswapV3(
              provider,
              "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
              "0xE592427A0AEce92De3Edee1F18E0157C05861564",
              500,
              ChainID.Ethereum,
              "UniswapV3_5"
            ),
            UniswapV3_100: new UniswapV3(
              provider,
              "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
              "0xE592427A0AEce92De3Edee1F18E0157C05861564",
              10000,
              ChainID.Ethereum,
              "UniswapV3_100"
            ),
            BancorNetwork: new BancorNetwork(
              provider,
              "0x52Ae12ABe5D8BD778BD5397F99cA900624CfADD4",
              ChainID.Ethereum,
              "BancorNetwork"
            ),
            OneInch: new OneInch(ChainID.Ethereum, "OneInch"),
          };
    }
}

export default Ethereum;