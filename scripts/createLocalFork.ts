import { forkAndExport, CloneLocalOptions } from '@axelar-network/axelar-local-dev';
import { ethers } from 'ethers';
const dotenv = require('dotenv');

dotenv.config()

if (!process.env.ACCOUNT_PUBKEY) {
    throw new Error("please choose a main account for testing")
}

// +: transform string to number
const port = +process.env.PORT! || 8500;
var cloneLocalOptions : CloneLocalOptions = {
    port: port,
    chainOutputPath: "info/mainnet-fork.json",
    accountsToFund: [process.env.ACCOUNT_PUBKEY],
    fundAmount: ethers.utils.parseEther("1000000").toString()
}

forkAndExport(cloneLocalOptions);