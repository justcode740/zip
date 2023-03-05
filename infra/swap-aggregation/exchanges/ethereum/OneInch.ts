import { BigNumber, Signer } from "ethers";
import { CallData } from "../../execute";
import { Token, TradingPair } from "../../../../registry/tokens";
import Exchange from "../Exchange";
import fetch from "node-fetch";

type OneInchData = {
  statusCode?: number;
  fromToken: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
  };
  toToken: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    logoURI: string;
  };
  toTokenAmount: string;
  fromTokenAmount: string;
  protocols: [
    [
      [
        {
          name: string;
          part: number;
          fromTokenAddress: string;
          toTokenAddress: string;
        },
      ],
    ],
  ];
  estimatedGas: number;
};

class OneInch extends Exchange {
  getExchangeRouterAddr(): string {
    // TODO: figure out how to submit order to 1inch on-chain
    throw new Error("Method not implemented.");
  }
  reserves(tokenIn: string, tokenOut: string): Promise<[BigNumber, BigNumber]> {
    throw new Error("Method not implemented.");
  }
  async hasPool(tokenIn: string, tokenOut: string): Promise<boolean> {
    // Assume that OneInch has pools between all tokens, since it is hard to
    // detect this a priori before sending requests.
    return true;
  }

  async amountOut(
    amountIn: BigNumber,
    tokenIn: string,
    tokenOut: string,
  ): Promise<BigNumber> {
    const params = new URLSearchParams({
      fromTokenAddress: tokenIn,
      toTokenAddress: tokenOut,
      amount: amountIn.toString(),
    }).toString();
    const oneInchUrl = "https://api.1inch.exchange/v3.0/1/quote?" + params;
    const resp = await fetch(oneInchUrl);
    const data: OneInchData = (await resp.json()) as OneInchData;
    if (data.statusCode && data.statusCode >= 400) {
      // throw new Error("failed to query OneInch API");
      return BigNumber.from("0")
    }
    const amount1 = BigNumber.from(data.toTokenAmount);
    return amount1;
  }

  async buildSwapTransaction(
    tradingPair: TradingPair,
    toAddress: string,
    deadline: number,
  ): Promise<CallData> {
    throw new Error("unimplemented");
  }
}

export default OneInch;
