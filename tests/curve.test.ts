import UniswapV2 from "../infra/swap-aggregation/exchanges/ethereum/UniswapV2";
import * as providers from "../registry/providers";
import { getToken, TradingPair } from "../registry/tokens";
import { BigNumber } from "ethers";
import dotenv from "dotenv";
import { expect } from "chai";
import { ChainID } from "../registry/chains";
import Curve from "../infra/swap-aggregation/exchanges/ethereum/curve";

dotenv.config();

describe("UniswapV2 buildSwapTransaction", () => {
  it("return some correctly encoded calldata", async () => {
    
    const curve = new Curve(
      providers.ethprovider,
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      ChainID.Ethereum
    );

    let WETH = getToken("WETH", ChainID.Ethereum);
    let USDC = getToken("USDC", ChainID.Ethereum);
    //check undefined
    if (!WETH || !USDC) {
      throw new Error("token not supported");
    }

    let wethUsdc = { TokenIn: WETH, TokenOut: USDC };

    let tradingpair: TradingPair = {
      pair: wethUsdc,
      amountIn: BigNumber.from("100000000000000000"),
      amountOut: BigNumber.from(0),
    };
    let deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    //get local net wallet
    const res = await curve.buildSwapTransaction(
      tradingpair
    );

    //expect(res.data.toString()).to.equal("0x38ed1739000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000002a329f7c9e89dc15441d7c749de8bb21c1bd3f7c00000000000000000000000000000000000000000000000000000000611bc6c50000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "payload is not right")

    //check encoded payload
    expect(res.data.length).equal(522, "payload length is not right");
    //check targetAddress
    expect(res.targetAddress).to.equal(
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      "targetAddress is not right",
    );
  });
});
