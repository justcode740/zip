import { Contract, ethers } from "ethers";
import { ChainID } from "../registry/chains";
import { getContractInfo } from "../sdk/contract";
import * as dotenv from "dotenv";
import { Env, getProviderByChainId } from "../registry/providers";

dotenv.config();
if(!process.env.EVM_PRIVATE_KEY) {
    throw new Error("need to set private key");
}
// TODO: move to registry and use a for loop to construct after contract is deployed
const ethLocalProvider = getProviderByChainId(ChainID.Ethereum, Env.LOCAL);
const arbLocalProvider = getProviderByChainId(ChainID.Arbitrum, Env.LOCAL);
const ethsigner = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, ethLocalProvider);
const arbsigner = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, arbLocalProvider);
const zipEth = getContractInfo(ChainID.Ethereum, Env.LOCAL);
const zipEthcontract = new Contract(zipEth.address, zipEth.abi, ethsigner);
const zipArb = getContractInfo(ChainID.Arbitrum, Env.LOCAL);
const zipArbcontract = new Contract(zipArb.address, zipArb.abi, arbsigner);

const routeAddresseth = [
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f',
    '0x03f7724180AA6b939894B5Ca4314783B0b36b329',
    '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    '0x52Ae12ABe5D8BD778BD5397F99cA900624CfADD4'
];

const dappAddresseth = [];
const routeAddressarb = [
    "0x15a1c069fcf6f79a3d5bb5d4a8ba004fbf4fabac", // curve, e.g. axlusdc->usdc
];
const dappAddressarb = [
    "0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064", "0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868",
    "0x794a61358D6845594F94dc1DB02A252b5b4814aD"];

(async () => {
    await zipEthcontract.addWhitelistDapps(dappAddresseth);
    await zipEthcontract.addWhitelistExchanges(routeAddresseth);
    await zipArbcontract.addWhitelistDapps(dappAddressarb);
    await zipArbcontract.addWhitelistExchanges(routeAddressarb);    
})();