import { Token } from "../../registry/tokens";
import { BigNumber, Contract, providers, Signer, utils } from "ethers";
import Exchange from "../swap-aggregation/exchanges/Exchange";
import { ChainID } from "../../registry/chains";

abstract class Chain {
    // A record of exchange we search (and can execute on) for the best route on this chain
    // address to exchange instance
    private exchanges: Record<string, Exchange>;

    constructor(provider: providers.Provider | Signer){
        this.exchanges = this.getExchanges(provider);
    }

    // Get ChainId
    abstract getChainId(): ChainID;

    // Call on construction
    abstract getExchanges(provider: providers.Provider | Signer): Record<string, Exchange>;

    getExchangeByName(name: string): Exchange {
        return this.exchanges[name]
    }

    // Return current gas price information per gas unit
    abstract getGasPrice() : number;

     /** Return the maximum amount of `tokenOut` that can be obtained from `amountIn` of `tokenIn`. and the route path for execution generation */
     // TODO: make route output generalized and n-hop optmizations, instead of just a string, consider gas fee
    async amountOut(
        amountIn: BigNumber,
        tokenIn: Token,
        tokenOut: Token,
    ): Promise<[BigNumber, string]> {
        const promises : Promise<[BigNumber, string]>[] = []
        for (const [name, exchange] of Object.entries(this.exchanges)) {
            if (name === "BancorNetwork" || name == "OneInch") {
                continue
            }
            promises.push(exchange.cachedAmountOut(amountIn, tokenIn, tokenOut));
        }
        const values = await Promise.all(promises);
        const max = values.reduce(function(prev, current) {
            return (prev[0] > current[0]) ? prev : current
        }) //returns object
        return max
    }
}

export default Chain;