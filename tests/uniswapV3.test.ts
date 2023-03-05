import UniswapV3 from "../infra/swap-aggregation/exchanges/ethereum/UniswapV3";
import * as providers from "../registry/providers";
import { getToken, TradingPair } from "../registry/tokens";
import { BigNumber } from "ethers";
import dotenv from "dotenv";
import { expect } from "chai";
import { ChainID } from "../registry/chains";

dotenv.config();

describe("UniswapV3 buildSwapTransaction", () => {
  it("should return some calldata", async () => {
    const univ3 = new UniswapV3(
      providers.ethprovider,
      "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
      "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      3000,
      ChainID.Ethereum,
      "UniswapV3"
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
      amountIn: BigNumber.from(1000),
      amountOut: BigNumber.from(0),
    };
    let deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    //get local net wallet
    const res = await univ3.buildSwapTransaction(
      tradingpair,
      "0xee062b785f5319968accf357be7a291d8b6dd64e",
      deadline,
    );

    //check encoded payload
    expect(res.data.length).equal(522, "payload length is not right");
    //check targetAddress
    expect(res.targetAddress).to.equal(
      "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      "targetAddress is not right",
    );
  });
});
