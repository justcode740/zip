const {
    getDefaultProvider,
    Contract,
    constants: { AddressZero },
} = require('ethers');

const {sleep} = require("../utils/index")

async function test(chains, wallet, options) {
    // Read chains info with deployed contract

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
}

module.exports = {
    test,
};
