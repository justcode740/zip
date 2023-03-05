import { BigNumber, providers, Signer } from "ethers";
import { CallData } from "../execute";
import { Token, TradingPair } from "../../../registry/tokens";
import { tokenPairId } from "../utils";
import { ChainID } from "../../../registry/chains";

export class NoPoolError extends Error {}

/** An exchange that allows users to swap tokens. */
abstract class Exchange {
  private chainId: ChainID;
  private name: string; // Exchange name, used for route construction
  /** Used to remember which pairs of tokens can be exchanged. */
  private cache: Map<string, boolean> = new Map();

  constructor(chainId: ChainID, name: string) {
    this.chainId = chainId;
    this.name = name;
  }

  /** Return whether there exists a swap between two tokens. */
  abstract hasPool(tokenIn: string, tokenOut: string): Promise<boolean>;

  getExchangeName(): string {
    return this.name;
  }
  
  /** Return the chainId this exchange is on */
  getNetwork(): ChainID {
    return this.chainId;
  }



  /** Return the routing address that does the swap on network*/
  abstract getExchangeRouterAddr(): string;

  /** Return the maximum amount of `tokenOut` that can be obtained from `amountIn` of `tokenIn`. */
  protected abstract amountOut(
    amountIn: BigNumber,
    tokenIn: string, // address of tokenIn
    tokenOut: string, // address of tokenOut
  ): Promise<BigNumber>;

  /** Build a transaction swapping between two tokens. */
  abstract buildSwapTransaction(
    tradingPair: TradingPair,
    toAddress: string,
    deadline: number,
  ): Promise<CallData>;

  abstract reserves(tokenIn: string, tokenOut: string) : Promise<[BigNumber, BigNumber]>;

  /**
   * Return the maximum amount of `tokenOut`that can be obtained from `amountIn` of `tokenIn`. Also return tokenIn address and tokenOut Address if there exist a wrapped version
   *
   * This method uses `hasPool` internally and caches which tokens have
   * available trades, which reduces the number of network requests.
   */
  async cachedAmountOut(
    amountIn: BigNumber,
    tokenIn: Token,
    tokenOut: Token,
  ): Promise<[BigNumber, string]> {
    // Hardcode cache and fetch periodically
    const s  = performance.now()
    const pairId = tokenPairId(tokenIn.address, tokenOut.address);
    if (!this.cache.has(pairId)) {
      this.cache.set(pairId, await this.hasPool(tokenIn.address, tokenOut.address));
    } 
   
    if (!this.cache.get(pairId)) {
      throw new Error(`no ${tokenIn} ${tokenOut} pool exist on exchange ${this.getExchangeRouterAddr()}`)
    }
    const e = performance.now()
    console.log(`${e - s} ms get token`)

    try{
      return [await this.amountOut(amountIn, tokenIn.address, tokenOut.address), this.getExchangeName()];
    }catch (error){
      console.error(error);
      return [BigNumber.from(0), this.getExchangeName()];
    }
  }
}

export default Exchange;
