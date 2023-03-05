import assert  from "assert";
import { ChainID } from "../../../registry/chains"
import prisma from "./client";
import { addDapp, readDappByNameIdAndChainId } from "./dapps"

describe("write and update dapps table", () => {
   it.only("write a dapp", async () => {
        await prisma.dapp.deleteMany();
        await addDapp("gmx", "GMX", "https://icons.llama.fi/gmx.png", "https://gmx.io/", "GMX is a decentralized spot and perpetual exchange that supports low swap fees and zero price impact trades. Trading is supported by a unique multi-asset pool that earns liquidity providers fees from market making, swap fees, leverage trading (spreads, funding fees & liquidations) and asset rebalancing.", ChainID.Arbitrum, "arbitrum:0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", "GMX", "gmx", "11587", "GMX_IO", "Derivatives", 624540575.22647);
        const res = await readDappByNameIdAndChainId("gmx", ChainID.Arbitrum);
        console.log(res.name_id);
        assert(res.name_id == "gmx", "fail");
   });
   
   
});
