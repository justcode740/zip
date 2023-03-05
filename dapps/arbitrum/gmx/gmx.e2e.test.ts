import {getToken} from "../../../registry/tokens";
import {ChainID} from "../../../registry/chains";
import Curve  from "../../../infra/swap-aggregation/exchanges/ethereum/curve";
import {getChains, prepare} from "../../../tests/utils";
import * as providers from "../../../registry/providers";
import {GMX} from "./gmx";
import {erc20Contract} from "../../../scripts/contracts";
import {ethers, providers as etherprovider} from "ethers";
const { utils, Wallet, Contract, getDefaultProvider, constants: { AddressZero }, BigNumber } = require('ethers');
const {sleep} = require("../../../utils/index");
// it.only("bridge usdc from eth to arb, swap axlusdc to usdc on curve and then swap usdc to frax on gmx", async () => {
    

// });

// 
async function test1(){

    const privateKey = process.env.EVM_PRIVATE_KEY;
    if (!privateKey){
        throw new Error("no pk");
    }
    let wallet_raw = new Wallet(privateKey);
    const env = 'mainnet-fork'

    const chains_raw = getChains(env)
    
    let [chains, wallet, options] = await prepare(env, chains_raw, wallet_raw);
    // console.log(chains, wallet, options)
    // ----------------------test--------------------------------------
    
    const args = options.args || [];
    const getGasPrice = options.getGasPrice;
    const source = chains.find((chain:any) => chain.name === (args[0] || 'Ethereum'));
    const destination = chains.find((chain:any) => chain.name === (args[1] || 'arbitrum'));
    const amount = Math.floor(parseFloat(args[2])) * 1e6 || 5e6;
    const accounts = args.slice(3);

    if (accounts.length === 0) accounts.push(wallet.address);
    let FRAX = getToken("FRAX", ChainID.Arbitrum);
    if (!FRAX) {
        throw new Error("token not supported");   
    }
    async function logAccountBalances(address: string) {
        for (const account of accounts) {
            console.log(`$0xsuperanony has ${(await erc20Contract(address, provider).balanceOf(account)) / 1e18} FRAX`);
        }
    }
    const provider = new etherprovider.JsonRpcProvider("http://localhost:8500/1")
    console.log('--- Initially ---');
    await logAccountBalances(ethers.utils.getAddress(FRAX.address));

    const gasLimit = 6e6;
    const gasPrice = await getGasPrice(source, destination, AddressZero);
    const balance = await destination.usdc.balanceOf(accounts[0]);
    const fraxbalance = await erc20Contract(ethers.utils.getAddress(FRAX.address), provider).balanceOf(accounts[0])
    const approveTx = await source.usdc.approve(source.contract.address, amount);
    // console.log(approveTx)
    await approveTx.wait();
    // console.log(approveTx);
    // console.log(source.contract.address);
    // console.log(gasLimit * gasPrice);

    let routeinfo = {
        target: AddressZero,
        payload: "0x",
        tokenIn: source.usdc.address
    }

    
    let executeinfo = {
        recipient: accounts[0], // beneficiary of the oprations, receive positions, tokens, or nfts, etc.
        target: AddressZero, // callee
        payload: "0x" // inputs
    }

    let axlUSDC = getToken("AXLUSDC", ChainID.Arbitrum);
    let USDC = getToken("USDC", ChainID.Arbitrum);
    // check undefined
    if (!USDC || !axlUSDC) {
      throw new Error("token not supported");
    }

    let axlUSDCUSDC = { TokenIn: axlUSDC, TokenOut: USDC };

    let tradingpair = {
      pair: axlUSDCUSDC,
      amountIn: BigNumber.from(amount),
      amountOut: BigNumber.from(0),
    };

    const curve = new Curve(
        providers.arbprovider, 
        "0x15a1c069fcf6f79a3d5bb5d4a8ba004fbf4fabac",
        ChainID.Arbitrum
    );
    const calldata1 = await curve.buildSwapTransaction(tradingpair);

    // build dapp transaction
    const gmx = new GMX(
        providers.arbprovider,
        "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064",
        "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868",
        "0x22199a49A999c351eF7927602CFB187ec3cae489",
        ChainID.Arbitrum
    );

   
    let USDCFRAX = { TokenIn: USDC, TokenOut: FRAX};
    let tradingpair2 = {
        pair: USDCFRAX,
        amountIn: BigNumber.from(amount * 0.9),
        amountOut: BigNumber.from(0)
    }
    const calldata2 = await gmx.buildSwapTransaction(
        tradingpair2,
        accounts[0]
    );
    
    const USDC_ARB = getToken("USDC", ChainID.Arbitrum);
    if (!USDC_ARB) {
        throw new Error("token not supported");   
    }
    
    // console.log(calldata1.targetAddress, calldata2.targetAddress);

    const abi = utils.defaultAbiCoder;
    // route logic with curve
    const bytes = abi.encode(
        ["address", "address[]", "bytes[]", "address[]"],
        [
            accounts[0], 
            [
                "0x15a1c069fcf6f79a3d5bb5d4a8ba004fbf4fabac",  // auto-matically filed after user's selection
                "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064" // composed with protoocol integrated
            ], 
            [
                calldata1.data,
                calldata2.data,
            ],
            [
                ethers.utils.getAddress(destination.usdc.address), // axlUSDC
                ethers.utils.getAddress(USDC_ARB.address) // USDC (Arb1)
            ]
        ]
    )
    // console.log("ACCOUNT", accounts[0])

    let bridgeinfo = {
        destinationChain: destination.name,
        destinationAddress: destination.contract.address,
        tokenSymbol: 'USDC',
        tokenAmount: amount, 
        payload: bytes
    }
    console.log([routeinfo], amount, false, bridgeinfo);

    // console.log(source.contract)
    // console.log([routeinfo], amount, false, bridgeinfo)
    const sendTx = await source.contract.zipexecute([routeinfo], amount, false,  bridgeinfo, {
        maxFeePerGas: BigInt("60000000000"), //to change if flashbots are not used, defaults to the mean network gas price
        maxPriorityFeePerGas: BigInt("40000000000"), //to determine at execution time
        gasLimit: gasLimit, //to change
        value: BigInt(Math.floor(gasLimit * gasPrice)),
    });
    console.log("the only tx from user side", sendTx);
    await sendTx.wait();
    
    while (true) {
        const updatedBalance = await erc20Contract(ethers.utils.getAddress(FRAX.address), provider).balanceOf(accounts[0]);
        console.log(updatedBalance.toString(), fraxbalance.toString());
        if (updatedBalance.gt(fraxbalance)) break;
        await sleep(1000);
    }
    console.log('--- After ---');
    await logAccountBalances(ethers.utils.getAddress(FRAX.address));
}

(async () => {
    await test1()
})()