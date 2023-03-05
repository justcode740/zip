import { getFee, getGasPrice } from "@axelar-network/axelar-local-dev";
import { sleep } from "@axelar-network/axelarjs-sdk";
import { BigNumber, Contract, ethers, Wallet } from "ethers";
import { ChainID } from "../../../registry/chains";
import { getToken } from "../../../registry/tokens";
import { erc20Contract } from "../../../scripts/contracts";
import { construct } from "../../../sdk/construct";
import { getContractInfo } from "../../../sdk/contract";
import { DestinationChainAction } from "../../../sdk/interfaces";
import { aaveV3SupplyArgs, FunctionSelector } from "./aave-v3";

// prepare a wallet connect to localhost
// supply on aave eth with eth on ethereum  
async function testSupply() {
    // input tokens
    // target chain input tokens
    // 
    // 
    let account = process.env.ACCOUNT_PUBKEY!;
    const localethprovider = new ethers.providers.JsonRpcProvider("http://localhost:8500/0");
    const localarbprovider = new ethers.providers.JsonRpcProvider("http://localhost:8500/1");

    const wallet = new Wallet(process.env.EVM_PRIVATE_KEY!, localethprovider);
    const args : aaveV3SupplyArgs = {
        onBehalfOf: account
    }
    const destinationChainAction : DestinationChainAction = {
        dappNameId: "aave-v3",
        functionSelector: FunctionSelector.SUPPLY,
        args: JSON.stringify(args)
    };
    // define change expected
    // Effect of the transaction on destination chain
    const ausdc = getToken("AUSDC", ChainID.Arbitrum)!;
    const ausdcInitalBalance = await erc20Contract(ausdc.address, localarbprovider).balanceOf(account);

    const usdcEth = getToken("USDC", ChainID.Ethereum)!;
    const usdc = erc20Contract(usdcEth.address, wallet);
    const contractInfoEth = getContractInfo(ChainID.Ethereum);

    const amount = ethers.utils.parseUnits("1.0", 6);
    const approveTx = await usdc.approve(contractInfoEth.address, amount);
    // console.log(approveTx)
    await approveTx.wait();

    const ress = await construct(ChainID.Ethereum, "USDC", amount, destinationChainAction, ChainID.Arbitrum, account);
    console.log(ress);
    // console.log(source.contract)
    // console.log([routeinfo], amount, false, bridgeinfo)
    const zipContractEth = new Contract(contractInfoEth.address, contractInfoEth.abi, wallet);
    const gasLimit = getFee();
    const gasPrice = getGasPrice();
    const sendTx = await zipContractEth.zipexecute(ress.routes, ress.bridgeAmount, ress.nativeEth,  ress.bridgeInfo, {
        maxFeePerGas: BigInt("60000000000"), // to change if flashbots are not used, defaults to the mean network gas price
        maxPriorityFeePerGas: BigInt("40000000000"), // to determine at execution time
        gasLimit: gasLimit, // to change
        value: BigInt(Math.floor(gasLimit * gasPrice)), // To pay destination chian gas fee
    });
    console.log("the only tx from user side", sendTx);
    await sendTx.wait();

    // Check whether the effect take places
    while (true) {
        const updatedBalance = await erc20Contract(ausdc.address, localarbprovider).balanceOf(account);
        console.log(updatedBalance.toString(), ausdcInitalBalance);
        if (updatedBalance.gt(ausdcInitalBalance)) break;
        await sleep(1);
    }

    // console.log('--- After ---');
    // await logAccountBalances(FRAX.address);
    
    // const localProvider = new ethers.providers.JsonRpcProvider("http://localhost:8500/1");
    // const aavev3 = new AaveV3(localProvider, ChainID.Arbitrum);
    // const weth = getToken("WETH", ChainID.Arbitrum);
    // const wallet =  new ethers.Wallet(process.env.EVM_PRIVATE_KEY!, localProvider);
    // const res =  await aavev3.buildsupplyTransaction(weth?.address!, ethers.utils.parseEther("0.01"), wallet.address, BigNumber.from(0));
    
}

if (require.main === module) {
    (async () => {
        await testSupply()
    })();
}