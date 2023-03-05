

import { arbprovider } from "../registry/providers"
import { fetchUniV3PoolsToFile } from "./utils"
(async () => {



    await fetchUniV3PoolsToFile(arbprovider, "arb_univ3pools.json")

// USDC-WETH pool address on mainnet for fee tier 0.05%

//   console.log('The unchecked trade object is', uncheckedTradeExample)

})()

// main()