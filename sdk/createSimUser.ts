import * as crypto from "crypto";
import { ethers } from "ethers";
import dotenv from "dotenv";
import assert from "assert";
dotenv.config();
import axios from 'axios';
import { ChainID } from "../registry/chains";

dotenv.config();

export interface KeyPair {
    privatekey: string;
    publickey: string;
}

// TO change after deploy, TODO make it a global var so can be used consistently across diff places
// Tenderly
const simEthEndpoint = process.env.FORK_BLOCKCHAIN_RPC;

export async function createSimUser() : Promise<KeyPair> {
    const id = crypto.randomBytes(32).toString('hex');
    const privateKey = "0x" + id;
    const wallet = new ethers.Wallet(privateKey);
    if(!process.env.EVM_PRIVATE_KEY){
        throw new Error("no evm private key set")
    }
    const publickey = wallet.address;
    const simProvider = new ethers.providers.JsonRpcProvider(simEthEndpoint+"/0");
    const majorWallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, simProvider);
    const txReceipt = await (await majorWallet.sendTransaction({
        to: publickey,
        value: ethers.utils.parseEther("1.0")
    })).wait();
    if(!txReceipt || !txReceipt.blockNumber) {
        throw new Error("unfinalized tx");
    }
    // console.log(await simProvider.getBalance(publickey));
    // assert(await simProvider.getBalance(publickey) == ethers.utils.parseEther("1.0"), "not funded");
    return {privatekey: privateKey, publickey: publickey}
}


export async function simTx(network: ChainID, from: string, to: string, input: string) {
    // assuming environment variables TENDERLY_USER, TENDERLY_PROJECT and TENDERLY_ACCESS_KEY are set
    // https://docs.tenderly.co/other/platform-access/how-to-find-the-project-slug-username-and-organization-name
    // https://docs.tenderly.co/other/platform-access/how-to-generate-api-access-tokens
    const TENDERLY_USER= process.env.TENDER_USER;
    const TENDERLY_PROJECT = process.env.TENDERLY_PROJECT;
    const TENDERLY_ACCESS_KEY = process.env.TENDERLY_PROJECT;
    const resp = await axios.post(
        `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT}/simulate`,
        // the transaction
        {
          /* Simulation Configuration */
          save: false, // if true simulation is saved and shows up in the dashboard
          save_if_fails: false, // if true, reverting simulations show up in the dashboard
          simulation_type: 'full', // full or quick (full is default)
    
          network_id: network.toString(), // network to simulate on
    
          /* Standard EVM Transaction object */
          from: from,
          to: to,
          input: input,
          gas: 8000000,
          gas_price: 0,
          value: 0,
        },
        {
          headers: {
            'X-Access-Key': TENDERLY_ACCESS_KEY as string,
          },
        }
      );
      console.timeEnd('Simulation');
    
      const transcation = resp.data.transaction;
      console.log(JSON.stringify(transcation, null, 2));
      assert(transcation.status == 1, "fail to simulate tx");
}
if (require.main === module) {
    (async () => {
        await createSimUser();
    })();
}