// zip core dev will implement this function for you after you submit the PR.
// construct.ts constructs calldata for your dapp based on frontend user inputs

import { BigNumber } from "ethers";
import { ChainID } from "../../../registry/chains";
import { Env, getProviderByChainId } from '../../../registry/providers';
import { getToken } from "../../../registry/tokens";
import { AaveV3, aaveV3SupplyArgs, FunctionSelector } from "./aave-v3";

const chainId = ChainID.Arbitrum;

export async function construct(functionSelector: FunctionSelector, args: string, inputTokenSymbol: string, inputTokenAmount: BigNumber, env: Env) {
    const provider = getProviderByChainId(chainId, env);
    const aavev3 = new AaveV3(provider, ChainID.Arbitrum);
    await aavev3.init(provider);
    switch (functionSelector) {
        case FunctionSelector.SUPPLY:
            const aavev3SupplyArgs : aaveV3SupplyArgs = JSON.parse(args);
            
            let inputToken = getToken(inputTokenSymbol, chainId);
            if (!inputToken) {
                throw new Error("token not supported");   
            }
            console.log(inputToken);

            const calldata = await aavev3.buildsupplyTransaction(
                inputToken.address,
                inputTokenAmount,
                aavev3SupplyArgs.onBehalfOf,
                BigNumber.from(0)
            );

            return calldata;
        default:
            throw new Error("function selector unimplemented");
    }
}