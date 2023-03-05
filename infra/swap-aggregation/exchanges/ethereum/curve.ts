import assert from "assert/strict";
import { BigNumber, Contract, providers, Signer } from "ethers";
import { CURVE_V1_ABI, UNISWAP_V2_FACTORY_ABI } from "../../../../registry/abi";
import { CallData } from "../../execute";
import { Token, TradingPair } from "../../../../registry/tokens";
import Exchange from "../Exchange";
import { ChainID } from "../../../../registry/chains";

class Curve  {
  getExchangeRouterAddr(): string {
    return this.router.address;
  }
  private router: Contract;
  private provider: providers.Provider | Signer;
  private chainId: ChainID;

  constructor(provider: providers.Provider | Signer, routerAddress: string, chainId: ChainID) {
   
    this.router = new Contract(
      routerAddress,
      CURVE_V1_ABI,
      provider,
    );
    this.provider = provider;
    this.chainId = chainId;
  }

//   async hasPool(tokenIn: string, tokenOut: string): Promise<boolean> {
//     resolve(true)
//     // const factory = await this.factory;
//     // const pairAddress = await factory.getPair(
//     //   tokenIn,
//     //   tokenOut,
//     // );
//     // // console.log(this.getNetwork() + ":" + pairAddress)
//     // return pairAddress !== "0x0000000000000000000000000000000000000000";
//   }

//   async reserves(tokenIn: string, tokenOut: string): Promise<[BigNumber, BigNumber]> {
//     const factory = await this.factory;
//     const pairAddress = await factory.getPair(
//       tokenIn,
//       tokenOut,
//     );
//     // console.log(this.getNetwork() + ":" + pairAddress)
//     const pairContract = new Contract(pairAddress, UNISWAP_V2_PAIR_ABI, this.provider);
//     const res = await pairContract.getReserves()
//     return [res._reserve0, res._reserve1]
//   }

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
    tradingPair: TradingPair
  ): Promise<CallData> {
    // TODO: Determine i and j based on read func
    const populatedTransaction =
      await this.router.populateTransaction.exchange(
        0,
        1, // to be changed ?
        tradingPair.amountIn,
        tradingPair.amountOut
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

export default Curve;
