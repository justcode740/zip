'use strict';
require('dotenv').config();

const {sleep} = require("../utils/index")

const { testnetInfo } = require('@axelar-network/axelar-local-dev');
const { utils, Wallet, Contract, getDefaultProvider, constants: { AddressZero }, } = require('ethers');
const {getChains, prepare} = require("./utils");

describe("swap and bridge", () => {
    it.only("empty payload for exchange, empty payload for execution, directly  send 5 usdc from ethereum to arbitrum", async () => {
            const privateKey = process.env.EVM_PRIVATE_KEY;
            let wallet_raw = new Wallet(privateKey);
            const env = 'mainnet-fork'
        
            const chains_raw = getChains(env)
            
            let [chains, wallet, options] = await prepare(env, chains_raw, wallet_raw);
            // console.log(chains, wallet, options)
            // ----------------------test--------------------------------------
    
            const args = options.args || [];
            const getGasPrice = options.getGasPrice;
            const source = chains.find((chain) => chain.name === (args[0] || 'Ethereum'));
            const destination = chains.find((chain) => chain.name === (args[1] || 'arbitrum'));
            const amount = Math.floor(parseFloat(args[2])) * 1e6 || 5e6;
            const accounts = args.slice(3);
        
            if (accounts.length === 0) accounts.push(wallet.address);
            
            async function logAccountBalances() {
                for (const account of accounts) {
                    console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC`);
                }
            }
        
            console.log('--- Initially ---');
            await logAccountBalances();
        
            const gasLimit = 6e6;
            const gasPrice = await getGasPrice(source, destination, AddressZero);
            const balance = await destination.usdc.balanceOf(accounts[0]);
            const approveTx = await source.usdc.approve(source.contract.address, amount);
            console.log("address", destination.usdc.address)
            console.log(approveTx)
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
                recipient: accounts[0],
                target: AddressZero,
                payload: "0x"
            }

            const abi = utils.defaultAbiCoder;
            const bytes = abi.encode(
                ["address", "address", "bytes"],
                [accounts[0], AddressZero, "0x"]
            )

            let bridgeinfo = {
                destinationChain: destination.name,
                destinationAddress: destination.contract.address,
                tokenSymbol: 'USDC',
                tokenAmount: amount, 
                payload: bytes
            }

            // console.log(source.contract)

            const sendTx = await source.contract.zipexecute([routeinfo], amount, false,  bridgeinfo, {
                maxFeePerGas: BigInt("60000000000"), //to change if flashbots are not used, defaults to the mean network gas price
                maxPriorityFeePerGas: BigInt("40000000000"), //to determine at execution time
                gasLimit: gasLimit, //to change
                value: BigInt(Math.floor(gasLimit * gasPrice)),
            });
            console.log(sendTx);
            await sendTx.wait();
        
            while (true) {
                const updatedBalance = await destination.usdc.balanceOf(accounts[0]);
                console.log(updatedBalance.toString(), balance.toString());
                if (updatedBalance.gt(balance)) break;
                await sleep(1000);
            }
        
            console.log('--- After ---');
            await logAccountBalances();
    
    });


    it("send usdc directly", async () => {
        const privateKey = process.env.EVM_PRIVATE_KEY;
        let wallet = new Wallet(privateKey);
        const env = 'mainnet-fork'
    
        const chains = getChains(env)
        console.log("rea")
        chains, wallet, options = await prepare(env, chains, wallet);
  
        // Test content
        const args = options.args || [];
        const getGasPrice = options.getGasPrice;
        const source = chains.find((chain) => chain.name === (args[0] || 'Ethereum'));
        const destination = chains.find((chain) => chain.name === (args[1] || 'arbitrum'));
        const amount = Math.floor(parseFloat(args[2])) * 1e6 || 5e6;
        const accounts = args.slice(3);
    
        if (accounts.length === 0) accounts.push(wallet.address);
    
        async function logAccountBalances() {
            for (const account of accounts) {
                console.log(`${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC`);
            }
        }
    
        console.log('--- Initially ---');
        await logAccountBalances();
    
        const gasLimit = 6e6;
        const gasPrice = await getGasPrice(source, destination, AddressZero);
        const balance = await destination.usdc.balanceOf(accounts[0]);
        const approveTx = await source.usdc.approve(source.contract.address, amount);
        console.log(approveTx)
        await approveTx.wait();
        // console.log(approveTx);
        console.log(source.contract.address);
        console.log(gasLimit * gasPrice);
        const sendTx = await source.contract.sendToMany(destination.name, destination.contract.address, accounts, 'USDC', amount, {
            maxFeePerGas: BigInt("60000000000"), //to change if flashbots are not used, defaults to the mean network gas price
            maxPriorityFeePerGas: BigInt("40000000000"), //to determine at execution time
            gasLimit: gasLimit, //to change
            value: BigInt(Math.floor(gasLimit * gasPrice)),
        });
        console.log(sendTx);
        await sendTx.wait();
    
        while (true) {
            const updatedBalance = await destination.usdc.balanceOf(accounts[0]);
            console.log(updatedBalance.toString(), balance.toString());
            if (updatedBalance.gt(balance)) break;
            await sleep(1000);
        }
    
        console.log('--- After ---');
        await logAccountBalances();
 

    
    function getChains(env) {
        try {
            return require(`../info/${env}${POSTDEPLOY}.json`)
        } catch{
            // Default to testnetInfo
            throw new Error("need to deploy contract first on mainnet-fork to run unit tests");
        }
    }
});
})