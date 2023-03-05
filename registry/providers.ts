import { ethers, providers } from 'ethers'
import * as dotenv from 'dotenv';
import { ChainID } from './chains';
dotenv.config();

const ethprovider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM)
const polyprovider = new ethers.providers.JsonRpcProvider(process.env.POLYGON)
const celoprovider = new ethers.providers.JsonRpcProvider(process.env.CELO)
const arbprovider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM)
const avaxprovider = new ethers.providers.JsonRpcProvider(process.env.AVALANCHE)

const forkUrl = process.env.FORK_BLOCKCHAIN_RPC!;
const ethforkprovider = new ethers.providers.JsonRpcProvider(forkUrl + "/0");
const arbforkprovider = new ethers.providers.JsonRpcProvider(forkUrl + "/1");

const localUrl = "http://localhost:8500";
const ethlocalprovider = new ethers.providers.JsonRpcProvider(localUrl + "/0");
const arblocalprovider = new ethers.providers.JsonRpcProvider(localUrl + "/1");

export enum Env {
    MAINNET,
    FORK,
    LOCAL
}

export {
    // mainnet provider
    ethprovider,
    polyprovider,
    celoprovider,
    arbprovider,
    avaxprovider,

    // fork provider
    ethforkprovider,
    arbforkprovider,

    // local provider
    ethlocalprovider,
    arblocalprovider
}

export function getProviderByChainId(chainId: ChainID, env : Env) {
    switch (chainId) {
        case ChainID.Arbitrum:
            return env == Env.FORK ? arbforkprovider : (env == Env.LOCAL  ? arblocalprovider : arbprovider);
        case ChainID.Avalanche:
            return avaxprovider;
        case ChainID.Ethereum:
            return env == Env.FORK ? ethforkprovider : (env == Env.LOCAL  ? ethlocalprovider : ethprovider);
        case ChainID.Polygon:
            return polyprovider;
        default:
            throw new Error("provider unimplemented")
    }
}