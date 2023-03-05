import GMX from "./gmx";
import * as providers from "../../../registry/providers";
import { getToken, TradingPair } from "../../../registry/tokens";
import { BigNumber, ethers } from "ethers";
import dotenv from "dotenv";
import { expect } from "chai";
import { ChainID } from "../../../registry/chains";

dotenv.config();

describe("GMX arbitrum tests", () => {
  const gmx_arb = new GMX(
    providers.arbprovider,
    "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064",
    "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868",
    "0x22199a49A999c351eF7927602CFB187ec3cae489",
    ChainID.Arbitrum
  );
  it("buildSwapTransaction return some correctly encoded calldata", async () => {
    let FRAX = getToken("FRAX", ChainID.Arbitrum);
    let USDC = getToken("USDC", ChainID.Arbitrum);
    //check undefined
    if (!FRAX || !USDC) {
      throw new Error("token not supported");
    }

    let wethUsdc = { TokenIn: USDC, TokenOut: FRAX };

    let tradingpair: TradingPair = {
      pair: wethUsdc,
      amountIn: BigNumber.from("100000000000000000"),
      amountOut: BigNumber.from(0),
    };
    //get local net wallet
    const res = await gmx_arb.buildSwapTransaction(
      tradingpair,
      "0x2A329F7c9E89Dc15441D7C749De8BB21C1bd3f7C",
    );

    //expect(res.data.toString()).to.equal("0x38ed1739000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000002a329f7c9e89dc15441d7c749de8bb21c1bd3f7c00000000000000000000000000000000000000000000000000000000611bc6c50000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "payload is not right")

    //check encoded payload
    expect(res.data.length).equal(458, "payload length is not right");
    //check targetAddress
    expect(res.targetAddress).to.equal(
      "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064",
      "targetAddress is not right",
    );
  });

  it("buildcreateIncreasePositionTransaction return some correctly encoded calldata", async () => {
    let WETH = getToken("WETH", ChainID.Arbitrum);
    let USDC = getToken("USDC", ChainID.Arbitrum);
    //check undefined
    if (!WETH || !USDC) {
      throw new Error("token not supported");
    }

    //get local net wallet
    const res = await gmx_arb.buildcreateIncreasePositionTransaction(
      [USDC.address],
      WETH.address,
      ethers.utils.parseUnits("100", 6),
      BigNumber.from(0),
      ethers.utils.parseUnits("200", 30), // 200 * (10 ** 30) 
      true,
      ethers.utils.parseUnits("2000", 30),
      await gmx_arb.getMinExecutionFee(),
      "0x0000000000000000000000000000000000000000000000000000000000000001",
      "0x2A329F7c9E89Dc15441D7C749De8BB21C1bd3f7C",
    );

    //expect(res.data.toString()).to.equal("0x38ed1739000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000002a329f7c9e89dc15441d7c749de8bb21c1bd3f7c00000000000000000000000000000000000000000000000000000000611bc6c50000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "payload is not right")

    //check encoded payload
    expect(res.data.length).equal(778, "payload length is not right");
    //check targetAddress
    expect(res.targetAddress).to.equal(
      "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868",
      "targetAddress is not right",
    );
  });


  it("buildcreateDecreasePositionTransaction return some correctly encoded calldata", async () => {
    let WETH = getToken("WETH", ChainID.Arbitrum);
    let USDC = getToken("USDC", ChainID.Arbitrum);
    //check undefined
    if (!WETH || !USDC) {
      throw new Error("token not supported");
    }
    
    //get local net wallet
    const res = await gmx_arb.buildcreateDecreasePositionTransaction(
      [USDC.address],
      WETH.address,
      ethers.utils.parseUnits("50", 6),
      ethers.utils.parseUnits("100", 30), // 100 * (10 ** 30) 
      true,
      "0x3D71c08d432710123eaf8fC7278431518366A335",
      ethers.utils.parseUnits("1700", 30),
      BigNumber.from("0"),
      await gmx_arb.getMinExecutionFee(),
      false,
      "0x2A329F7c9E89Dc15441D7C749De8BB21C1bd3f7C",
    );

    //expect(res.data.toString()).to.equal("0x38ed1739000000000000000000000000000000000000000000000000016345785d8a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000002a329f7c9e89dc15441d7c749de8bb21c1bd3f7c00000000000000000000000000000000000000000000000000000000611bc6c50000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "payload is not right")

    //check encoded payload
    expect(res.data.length).equal(842, "payload length is not right");
    //check targetAddress
    expect(res.targetAddress).to.equal(
      "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868",
      "targetAddress is not right",
    );
  });

  it("getPositionList return some correctly encoded calldata", async () => {
    console.log(await gmx_arb.getPositionList(
      gmx_arb.vaultAddress,
      "0x83190535A4487EF445a889c748c3985Ca98E6aFe",
      ["0x0000000000000000000000000000000000000120"],
      ["0x82af49447d8a07e3bd95bd0d56f35241523fbab1"],
      [true]
    ));
  });


});
