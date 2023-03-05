'use strict';

require('dotenv').config();
const {
    utils: { setJSON, deployContract },
    testnetInfo,
} = require('@axelar-network/axelar-local-dev');
const { Wallet, getDefaultProvider, Contract} = require('ethers');
const { FormatTypes } = require('ethers/lib/utils');
const {POSTDEPLOY} = require('../axelar/test');
const executorJson = require('../artifacts/contracts/executor.sol/DistributionExecutable.json')
const Gateway = require('../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol/IAxelarGateway.json');
const IERC20 = require('../artifacts/@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol/IERC20.json');

async function deployOnChain(chain, wallet) {
    console.log(`Deploying executor contract for ${chain.name}.`);
    const provider = getDefaultProvider(chain.rpc);
    chain.wallet = wallet.connect(provider);
    chain.contract = await deployContract(wallet, executorJson, [chain.gateway, chain.gasReceiver], {
        maxFeePerGas: BigInt("60000000000"), //to change if flashbots are not used, defaults to the mean network gas price
        maxPriorityFeePerGas: BigInt("40000000000"), //to determine at execution time
        gasLimit: 4612388, //to change
    });
    const gateway = new Contract(chain.gateway, Gateway.abi, chain.wallet);
    var usdcAddress
    if (chain.chainId == 1) {
        // usdc for Axelar has symbol USDC on Ethereum 
        usdcAddress = await gateway.tokenAddresses('USDC');
    }else{
        usdcAddress = await gateway.tokenAddresses('axlUSDC');
    }
    chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
    console.log(`Deployed executor contract for ${chain.name} at ${chain.contract.address}.`);
}

async function deploy(env, chains, wallet) {
    const promises = [];

    for (const chain of chains) {
        const rpc = chain.rpc;
        const provider = getDefaultProvider(rpc);
        promises.push(deployOnChain(chain, wallet.connect(provider)));
    }

    await Promise.all(promises);

    for(const chain of chains) {
      for(const key of Object.keys(chain)) {

        if(chain[key].interface) {
          const contract = chain[key];
          const abi = contract.interface.format(FormatTypes.full);
          chain[key] = {
            abi,
            address: contract.address,
          }
        }
      }

      // delete chain.wallet
    }

    // Override the info file with additional deployment info
    setJSON(chains, `./info/${env}${POSTDEPLOY}.json`);
}

module.exports = {
    deploy,
};

if (require.main === module) {
    const env = process.argv[2];
    if (env == null || (env !=='mainnet-fork'))
        throw new Error('Need to specify testnet or local or mainnet-fork as an argument to this script.');

    var temp
    try {
        temp = require(`../info/${env}.json`)
    } catch {
        // Default to testnetInfo
        temp = testnetInfo
    }

    const chains = temp;

    const privateKey = process.env.EVM_PRIVATE_KEY;
    const wallet = new Wallet(privateKey);   

    deploy(env, chains, wallet);
}
