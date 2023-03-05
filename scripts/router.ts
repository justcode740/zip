import { Squid } from "@0xsquid/sdk";
import { ethers } from "ethers";

const getSDK = (): Squid => {
  const squid = new Squid({
    baseUrl: "https://testnet.api.0xsquid.com"
  });
  return squid;
};

const privateKey =
  "0e701e6c4cc251fbbd6051a334076b3882d977053de0707ce9080e5a9e7f5df6";
const ethRpcEndPoint = 
//   "https://goerli.infura.io/v3/<YOUR_INFURA_PROJECT_ID>";
  "https://goerli.infura.io/v3/e70577662c1348ef8ff6efa2efd82cef";

(async () => {
  // set up your RPC provider and signer
  const provider = new ethers.providers.JsonRpcProvider(ethRpcEndPoint);
  const signer = new ethers.Wallet(privateKey, provider);
  
  // instantiate the SDK
  const squid = getSDK();
  // init the SDK
  await squid.init();
  console.log("Squid inited");

  // log Squid supported tokens and chains
//   console.log("squid.tokens: \n", squid.tokens);
//   console.log("squid.chains: \n", squid.chains);

  // set the token and chain you are looking for 
  // chainNames are here: https://docs.axelar.dev/dev/build/chain-names
  const searchTokenSymbol = "WETH";
//   const searchChainName = "Ethereum-2";

//   const searchChainData = squid.chains.find(
//     t =>
//       t.chainId === squid.chains.find(c => c.chainName === searchChainName)?.chainId
//   );

//   const searchToken = squid.tokens.find(
//     t =>
//       t.symbol === searchTokenSymbol &&
//       t.chainId === squid.chains.find(c => c.chainName === searchChainName)?.chainId
//   );

//   console.log("chainId for " + searchChainName + ": " + searchChainData?.chainId); // output is 43113
//   console.log("tokenAddress for " + searchTokenSymbol + 
    // " on " + searchChainData?.networkName + ": " + searchToken?.address); 

  const params = {
    fromChain: 5, // Goerli testnet
    fromToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // WETH on Goerli
    fromAmount: "20000000000000000", // 0.05 WETH
    toChain: 43113, // Avalanche Fuji Testnet
    toToken: "0x57f1c63497aee0be305b8852b354cec793da43bb", // aUSDC on Avalanche Fuji Testnet
    toAddress: "0xAD3A87a43489C44f0a8A33113B2745338ae71A9D", // the recipient of the trade
    slippage: 1.00, // 1.00 = 1% max slippage across the entire route
    enableForecall: true, // instant execution service, defaults to true
    quoteOnly: false // optional, defaults to false
  };

//   console.log("params: \n", params);

  const { route } = await squid.getRoute(params);

  console.log("route: \n", route);
  // console.log("route: \n", JSON.stringify(route, null, 2))

  const tx = await squid.executeRoute({ signer, route });
  console.log("tx: ", tx);
  
  const txReceipt = await tx.wait();
  console.log("txReciept: ", txReceipt);

  const getStatusParams = {
    transactionId: txReceipt.transactionHash,
    routeType: route.transactionRequest.routeType
  };

  const status = await squid.getStatus(getStatusParams);
  console.log(status)
})();