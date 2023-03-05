import assert from "assert/strict";
import { BigNumber, Contract, providers, Signer } from "ethers";
import { UNISWAP_V2_FACTORY_ABI, UNISWAP_V2_PAIR_ABI, UNISWAP_V2_ROUTER02_ABI } from "../../../../registry/abi";
import { CallData } from "../../execute";
import { Token, TradingPair } from "../../../../registry/tokens";
import Exchange from "../Exchange";
import { ChainID } from "../../../../registry/chains";

class UniswapV2 extends Exchange {
  getExchangeRouterAddr(): string {
    return this.router.address;
  }
  private router: Contract;
  private factory: Promise<Contract>;
  private provider: providers.Provider | Signer;

  constructor(provider: providers.Provider | Signer, routerAddress: string, chainId: ChainID, name: string) {
    super(chainId, name);
    this.router = new Contract(
      routerAddress,
      UNISWAP_V2_ROUTER02_ABI,
      provider,
    );
    this.factory = this.router.factory().then((address: string) => {
      return new Contract(address, UNISWAP_V2_FACTORY_ABI, provider);
    });
    this.provider = provider;
  }

  async hasPool(tokenIn: string, tokenOut: string): Promise<boolean> {
    const factory = await this.factory;
    const pairAddress = await factory.getPair(
      tokenIn,
      tokenOut,
    );
    // console.log(this.getNetwork() + ":" + pairAddress)
    return pairAddress !== "0x0000000000000000000000000000000000000000";
  }

  async reserves(tokenIn: string, tokenOut: string): Promise<[BigNumber, BigNumber]> {
    const factory = await this.factory;
    const pairAddress = await factory.getPair(
      tokenIn,
      tokenOut,
    );
    // console.log(this.getNetwork() + ":" + pairAddress)
    const pairContract = new Contract(pairAddress, UNISWAP_V2_PAIR_ABI, this.provider);
    const res = await pairContract.getReserves()
    return [res._reserve0, res._reserve1]
  }

  async amountOut(
    amountIn: BigNumber,
    tokenIn: string,
    tokenOut: string,
  ): Promise<BigNumber> {
    const s  =performance.now()
    const [amount0, amount1] = await this.router.getAmountsOut(amountIn, [
      tokenIn,
      tokenOut,
    ]);

    assert.deepStrictEqual(amount0, amountIn);
    const e = performance.now()
    console.log(`${e - s} ms for getamountout ${this.getExchangeRouterAddr()} ${amount1}`)
    return amount1;
  }

  async buildSwapTransaction(
    tradingPair: TradingPair,
    toAddress: string,
    deadline: number,
  ): Promise<CallData> {
    const populatedTransaction =
      await this.router.populateTransaction.swapExactTokensForTokens(
        tradingPair.amountIn,
        tradingPair.amountOut, // to be changed ?
        [tradingPair.pair.TokenIn.address, tradingPair.pair.TokenOut.address],
        toAddress,
        deadline,
      );
    if (
      populatedTransaction === undefined ||
      populatedTransaction.data === undefined
    )
      throw new Error("fail to generate tx");

    return {
      data: populatedTransaction.data,
      targetAddress: this.router.address,
    };
  }
}

export default UniswapV2;
