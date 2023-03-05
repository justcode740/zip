import { Contract, providers, Signer } from "ethers";
import { getToken, TradingPair, Token } from "../registry/tokens";
import { BigNumber, utils } from "ethers";
import Exchange from "../infra/swap-aggregation/exchanges/Exchange";
import assert from "assert/strict";
import makeChain from "../infra/chains/makeChains";
import { ChainID } from "../registry/chains";

export interface CallData {
  targetAddress: string;
  data: string;
}

class Executor {
  private allExchanges: Record<string, Exchange>;
  private provider: providers.JsonRpcProvider;
  private signer: Signer;
  private bundleExecutor: Contract;

  constructor(
    provider: providers.JsonRpcProvider,
    signer: Signer,
    bundleExecutor: Contract,
    chainID: ChainID,
  ) {
    this.provider = provider;
    this.allExchanges = makeChain(chainID).getExchanges(provider);
    this.signer = signer;
    this.bundleExecutor = bundleExecutor;
  }

  async execute(
    initialAmount: BigNumber,
    exchangeNames: string[],
    tradeTokens: Token[],
  ) {
    //console.log(initialAmount, exchangeNames, tradeTokens);
    let tradeExchanges: Exchange[] = [];
    for (const exchangeName of exchangeNames) {
      tradeExchanges.push(this.allExchanges[exchangeName]);
    }

    assert.equal(tradeExchanges.length, tradeTokens.length - 1);

    let amountIn = initialAmount;
    let callDatas: CallData[] = [];
    let tokensIn: string[] = [];
    for (let i = 0; i < tradeExchanges.length; i++) {
      let curExchange = tradeExchanges[i];
      let tokenIn = tradeTokens[i];
      let tokenOut = tradeTokens[i + 1];
      let [tokenOutAmount, _] = await curExchange.cachedAmountOut(
        amountIn,
        tokenIn,
        tokenOut,
      );
      console.log(tokenOut + "|" + tokenOutAmount.toString());
      let tokenPair = { TokenIn: tokenIn, TokenOut: tokenOut };
      let tradingPair: TradingPair = {
        pair: tokenPair,
        amountIn: amountIn,
        amountOut: tokenOutAmount,
      };
      let deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      let calldata = await curExchange.buildSwapTransaction(
        tradingPair,
        this.bundleExecutor.address,
        deadline,
      );
      console.log(calldata);
      callDatas.push(calldata);
      tokensIn.push(tokenIn.address);
      amountIn = tokenOutAmount;
    }
    const targets: string[] = [];
    const payloads: string[] = [];
    for (let i = 0; i < callDatas.length; i++) {
      targets.push(callDatas[i].targetAddress);
      payloads.push(callDatas[i].data);
    }
    console.log({ targets, payloads, tokensIn });

    let bf = await this.bundleExecutor.getWETHBalance();
    console.log(utils.formatEther(bf));

    let signeraddr = await this.signer.getAddress();
    console.log(signeraddr);

    //not accurate since multiple internal tx and calls are made
    let estimatedGasUnit =
      await this.bundleExecutor.estimateGas.uniswapWethNoFlashbots(
        targets,
        payloads,
        tokensIn,
        {
          from: signeraddr,
        },
      );
    console.log(estimatedGasUnit.toString());

    let tx = await this.bundleExecutor.uniswapWethNoFlashbots(
      targets,
      payloads,
      tokensIn,
      {
        from: await this.signer.getAddress(),
        maxFeePerGas: BigNumber.from("60000000000"), //to change if flashbots are not used, defaults to the mean network gas price
        maxPriorityFeePerGas: BigNumber.from("40000000000"), //to determine at execution time
        gasLimit: BigNumber.from(estimatedGasUnit.mul(2)), //to change
      },
    );

    let ba = await this.bundleExecutor.getWETHBalance();
    console.log(utils.formatEther(ba));

    return tx;
  }
}

export default Executor;
