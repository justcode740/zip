import { BigNumber, Contract, providers, Signer } from "ethers";
import {
  UNISWAP_V3_FACTORY_ABI,
  UNISWAP_V3_QUOTER_ABI,
  UNISWAP_V3_SWAP_ROUTER_ABI,
} from "../../../../registry/abi";
import { CallData } from "../../execute";
import { Token, TradingPair } from "../../../../registry/tokens";
import Exchange from "../Exchange";
import { ChainID } from "../../../../registry/chains";

class UniswapV3 extends Exchange {
  getExchangeRouterAddr(): string {
    return this.router.address;
  }
  reserves(tokenIn: string, tokenOut: string): Promise<[BigNumber, BigNumber]> {
    throw new Error("Method not implemented.");
  }
  private quoter: Contract;
  private router: Contract;
  private factory: Promise<Contract>;
  private fee: number;

  constructor(
    provider: providers.Provider | Signer,
    quoterAddress: string,
    routerAddress: string,
    fee: number,
    chainId: ChainID,
    name: string
  ) {
    super(chainId, name);
    this.quoter = new Contract(quoterAddress, UNISWAP_V3_QUOTER_ABI, provider);
    this.router = new Contract(
      routerAddress,
      UNISWAP_V3_SWAP_ROUTER_ABI,
      provider,
    );
    this.factory = this.quoter.factory().then((address: string) => {
      return new Contract(address, UNISWAP_V3_FACTORY_ABI, provider);
    });
    this.fee = fee;
  }

  async hasPool(tokenIn: string, tokenOut: string): Promise<boolean> {
    const factory = await this.factory;
    const pairAddress = await factory.getPool(
      tokenIn,
      tokenOut,
      this.fee,
    );
    return pairAddress !== "0x0000000000000000000000000000000000000000";
  }

  async amountOut(
    amountIn: BigNumber,
    tokenIn: string,
    tokenOut: string,
  ): Promise<BigNumber> {
    const s = performance.now()
    const amount1 = await this.quoter.quoteExactInputSingle(
      tokenIn,
      tokenOut,
      this.fee,
      amountIn,
      0,
    );
    const e = performance.now()
    console.log(`${e - s} ms for getamountout ${this.getExchangeRouterAddr()}`)

    return amount1;
  }

  async buildSwapTransaction(
    tradingPair: TradingPair,
    toAddress: string,
    deadline: number,
  ): Promise<CallData> {
    let paramtuple: [
      string,
      string,
      number,
      string,
      number,
      BigNumber,
      BigNumber,
      number,
    ] = [
      tradingPair.pair.TokenIn.address,
      tradingPair.pair.TokenOut.address,
      this.fee,
      toAddress,
      deadline,
      tradingPair.amountIn,
      tradingPair.amountOut,
      0,
    ];

    const populatedTransaction =
      await this.router.populateTransaction.exactInputSingle(paramtuple);
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

export default UniswapV3;
