import { ethers } from "ethers";
import { getContractInfo } from "../sdk/contract";

async () => {
    const ethLocalProvider = new ethers.providers.JsonRpcProvider("http://localhost:8500/0");
    const arbLocalProvider = new ethers.providers.JsonRpcProvider("http://localhost:8500/1");
    const ethsigner = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, ethLocalProvider);
    const arbsigner = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, arbLocalProvider);
    const zipEth = getContractInfo(ChainID.Ethereum);
    const zipEthcontract = new Contract(zipEth.address, zipEth.abi, ethsigner);
    const zipArb = getContractInfo(ChainID.Arbitrum);
    const zipArbcontract = new Contract(zipArb.address, zipArb.abi, arbsigner);

    await 
}