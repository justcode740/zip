import { getFee, getGasPrice } from "@axelar-network/axelar-local-dev";
import { sleep } from "@axelar-network/axelarjs-sdk";
import { BigNumber, Contract, ethers, Wallet } from "ethers";
import { ChainID } from "../../../registry/chains";
import { Env, getProviderByChainId } from "../../../registry/providers";
import { getToken } from "../../../registry/tokens";
import { erc20Contract } from "../../../scripts/contracts";
import { construct } from "../../../sdk/construct";
import { getContractInfo } from "../../../sdk/contract";
import { DestinationChainAction } from "../../../sdk/interfaces";
import { GMXSwapArgs, FunctionSelector } from "./gmx";

// Write test should use local, faster and save fork chain's liquidity
const env = Env.FORK;
const account = process.env.ACCOUNT_PUBKEY!;
const ethProvider = getProviderByChainId(ChainID.Ethereum, env);
const arbProvider = getProviderByChainId(ChainID.Arbitrum, env);
const walletOnEth = new Wallet(process.env.EVM_PRIVATE_KEY!, ethProvider);

async function testSwap1() {
    const args : GMXSwapArgs = {
        tokenSymbolOut: 'FRAX',
        toAddress: account,
    }
    const destinationChainAction : DestinationChainAction = {
        dappNameId: "gmx",
        functionSelector: FunctionSelector.SWAP,
        args: JSON.stringify(args)
    };
    // define change expected
    // Effect of the transaction on destination chain
    const frax = getToken("FRAX", ChainID.Arbitrum)!;
    const fraxInitialBalance : BigNumber = await erc20Contract(ethers.utils.getAddress(frax.address), arbProvider).balanceOf(account);

    const usdcEth = getToken("USDC", ChainID.Ethereum)!;
    const usdc = erc20Contract(ethers.utils.getAddress(usdcEth.address), walletOnEth);
    const contractInfoEth = getContractInfo(ChainID.Ethereum, env);

    const amount = ethers.utils.parseUnits("1.0", 6);
    const approveTx = await usdc.approve(contractInfoEth.address, amount);
    // console.log(approveTx)
    await approveTx.wait();

    const ress = await construct(ChainID.Ethereum, "USDC", amount, destinationChainAction, ChainID.Arbitrum, account, env);
    console.log(ress);
    // console.log(source.contract)
    // console.log([routeinfo], amount, false, bridgeinfo)
    const zipContractEth = new Contract(contractInfoEth.address, contractInfoEth.abi, walletOnEth);
    const gasLimit = getFee();
    const gasPrice = getGasPrice();
    const sendTx = await zipContractEth.zipexecute(ress.routes, ress.tokenInputAmount, ress.nativeEth,  ress.bridgeInfo, {
        maxFeePerGas: BigInt("60000000000"), // to change if flashbots are not used, defaults to the mean network gas price
        maxPriorityFeePerGas: BigInt("40000000000"), // to determine at execution time
        gasLimit: gasLimit, // to change
        value: BigInt(Math.floor(gasLimit * gasPrice)), // To pay destination chian gas fee
    });
    console.log("the only tx from user side", sendTx);
    await sendTx.wait();

    // Check whether the effect take places
    while (true) {
        const updatedBalance : BigNumber = await erc20Contract(ethers.utils.getAddress(frax.address), arbProvider).balanceOf(account);
        console.log(updatedBalance.toString(), fraxInitialBalance.toString());
        if (updatedBalance.gt(fraxInitialBalance)) break;
        await sleep(1);
    }
}

async function testSwap2() {
    console.log(await ethProvider.getBalance(account));
    const args : GMXSwapArgs = {
        tokenSymbolOut: 'FRAX',
        toAddress: account,
    }
    const destinationChainAction : DestinationChainAction = {
        dappNameId: "gmx",
        functionSelector: FunctionSelector.SWAP,
        args: JSON.stringify(args)
    };
    // define change expected
    // Effect of the transaction on destination chain
    const frax = getToken("FRAX", ChainID.Arbitrum)!;
    const fraxInitialBalance : BigNumber = await erc20Contract(ethers.utils.getAddress(frax.address), arbProvider).balanceOf(account);

    const contractInfoEth = getContractInfo(ChainID.Ethereum, env);

    const amount = ethers.utils.parseEther("0.01");

    const ress = await construct(ChainID.Ethereum, "ETH", amount, destinationChainAction, ChainID.Arbitrum, account, env);
    console.log(ress);
    // console.log(source.contract)
    // console.log([routeinfo], amount, false, bridgeinfo)
    const zipContractEth = new Contract(contractInfoEth.address, contractInfoEth.abi, walletOnEth);
    const gasLimit = getFee();
    const gasPrice = getGasPrice();
    const sendTx = await zipContractEth.zipexecute(ress.routes, amount, ress.nativeEth,  ress.bridgeInfo, {
        maxFeePerGas: BigInt("60000000000"), // to change if flashbots are not used, defaults to the mean network gas price
        maxPriorityFeePerGas: BigInt("40000000000"), // to determine at execution time
        gasLimit: gasLimit, // to change
        value: BigNumber.from(Math.floor(gasLimit * gasPrice)).add(amount), // To pay destination chian gas fee
    });
    console.log("the only tx from user side", sendTx);
    await sendTx.wait();

    // Check whether the effect take places
    while (true) {
        const updatedBalance : BigNumber = await erc20Contract(ethers.utils.getAddress(frax.address), arbProvider).balanceOf(account);
        console.log(updatedBalance.toString(), fraxInitialBalance.toString());
        if (updatedBalance.gt(fraxInitialBalance)) break;
        await sleep(1);
    }
}

if (require.main === module) {
    (async () => {
        await testSwap2()
    })();
}