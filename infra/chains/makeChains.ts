import Avalanche from "./Avalanche";
import Chain from "./Chain";
import Ethereum from "./Ethereum";
import {ChainID} from "../../registry/chains";
import * as providers from "../../registry/providers";
import Polygon from "./Polygon";
/** Construct exchange objects given a provider to execute contracts. */
// TODO(opt): this should really be called once on initialization
export function makeChain(
    chainId: ChainID,
    env: providers.Env = providers.Env.FORK,
  ): Chain {
    const provider = providers.getProviderByChainId(chainId, env);
    switch (chainId) {
      case ChainID.Ethereum:
        return new Ethereum(provider);
      case ChainID.Avalanche:
        return new Avalanche(provider)
      case ChainID.Polygon:
        return new Polygon(provider);
      default:
        throw new Error("unsupported chain")
    }
  }

  export default makeChain;