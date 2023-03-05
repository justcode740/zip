import { getToken } from "../../registry/tokens";
import {ChainID} from "../../registry/chains"
import { BigNumber } from "ethers";
import makeChain from "../chains/makeChains";
import {utils} from "ethers";
import { Env } from "../../registry/providers";
// quantity already in atomic unit
/*
  getRoute return best route and corresponding amountOut considering gas fees
  quantity and output amount is all in atomic units
  uses native type here for computation separation, later rewrite with computation
**/
export async function getRoute(inToken: string, outToken: string, quantity: BigNumber, chainId: ChainID, env : Env) : Promise<[BigNumber, string]> {
    const tokenIn = getToken(inToken, chainId);
    const tokenOut = getToken(outToken, chainId);
    if (!tokenIn || !tokenOut) {
      throw new Error("Bad token input or output.");
    }
    const s = performance.now()
    const chain = makeChain(chainId, env);
    const e = performance.now()
    console.log(`make chain ${e - s} ms`)
    return await chain.amountOut(quantity, tokenIn, tokenOut)

    // console.log(utils.formatUnits(maxOut, tokenOut.decimals), routerAddr)

    // console.log(chalk.green("Created chains."));

    // let curBestOutput = BigNumber.from("0");
    // let curBestChain = "";
    // let curBestExchangeAddr = "";
    // let curBestExchangeName = "";

    // for (const [name, chain] of Object.entries(chains)) {
    //   try {
    //     let [result, exchange, bestTokenIn, bestTokenOut] = await chain.amountOut(
    //       quantity,
    //       tokenIn,
    //       tokenOut,
    //     );
    //     if (result > curBestOutput) {
    //       curBestOutput = result
    //       curBestChain = name
    //       curBestExchangeName = exchange
    //       curBestExchangeAddr = chain.exchanges[exchange].getExchangeRouterAddr()
    //     }
        
        

    //   } catch (err) {
    //     console.log(err);
    //   }
    // }

    // var fs = require('fs');
    // fs.writeFile("test.json", JSON.stringify({"dest_chains": [curBestChain], "addrs": [curBestExchangeAddr], "amount_in" : [quantity]}), function(err: Error) {
    //     if (err) {
    //         console.log(err);
    //     }
    // });
    // console.log(JSON.stringify(
    //   {
    //   "dest_chains": [curBestChain], 
    //   "addrs": [curBestExchangeAddr], 
    //   "exchange_names": [curBestExchangeName],
    //   "amount_in" : [utils.formatUnits(quantity, tokenIn.decimals)],
    //   "expected_amount_out": [utils.formatUnits(curBestOutput, tokenOut.decimals)]
    //   }
    //   )
    // )

    // return JSON.stringify(
    //   {
    //   "dest_chains": [curBestChain], 
    //   "addrs": [curBestExchangeAddr], 
    //   "exchange_names": [curBestExchangeName],
    //   "amount_in" : [utils.formatUnits(quantity, tokenIn.decimals)],
    //   "expected_amount_out": [utils.formatUnits(curBestOutput, tokenOut.decimals)]
    //   }
    // )
    

}

if (require.main === module){
  (async () => {
    await getRoute("WETH", "USDC", utils.parseUnits("10"), ChainID.Ethereum, Env.LOCAL);
  })()
}
