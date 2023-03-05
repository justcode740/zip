import { ChainID } from "../../registry/chains";
import Axelar from "./axelar";


describe("Axelar instance unit tests", () => {
  it("computeBridgeFee", async () => {
    const axelar =  new Axelar(ChainID.Ethereum, ChainID.Avalanche)
    console.log(await axelar.computeBridgeFee("USDC"))
    console.log(await axelar.computeBridgeFee("ETH"))
    console.log(await axelar.computeBridgeFee("WETH"))
    console.log(await axelar.computeBridgeFee("UNI"))



  });
});
