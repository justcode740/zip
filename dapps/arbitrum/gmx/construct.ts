// zip core dev will implement this function for you after you submit the PR.
// construct.ts constructs calldata for your dapp based on frontend user inputs

import { BigNumber } from "ethers";
import { ChainID } from "../../../registry/chains";
import { Env, getProviderByChainId } from '../../../registry/providers';
import { getToken } from "../../../registry/tokens";
import { GMX, FunctionSelector, GMXSwapArgs } from "./gmx";
import data from "./data.json";

const chainId = ChainID.Arbitrum;

export async function construct(functionSelector: FunctionSelector, args: string, inputTokenSymbol: string, inputTokenAmount: BigNumber, env: Env) {
    const provider = getProviderByChainId(chainId, env);
    const gmx = new GMX(provider, data.router.address, data.positionRouter.address, data.reader.address, ChainID.Arbitrum);
    switch (functionSelector) {
        case FunctionSelector.SWAP:
            const gmxswapargs : GMXSwapArgs = JSON.parse(args);
            
            let tokenOut = getToken(gmxswapargs.tokenSymbolOut, chainId);
            if (!tokenOut) {
                throw new Error("token not supported");   
            }
            let inputToken = getToken(inputTokenSymbol, chainId);
            if (!inputToken) {
                throw new Error("token not supported");   
            }

            let tokenPair = { TokenIn: inputToken, TokenOut: tokenOut};
            let tradingpair = {
                pair: tokenPair,
                amountIn: inputTokenAmount,
                amountOut: BigNumber.from(0) // TODO: add splippage control
            }
            const calldata = await gmx.buildSwapTransaction(
                tradingpair,
                gmxswapargs.toAddress
            );
            return calldata
        default:
            throw new Error("function selector unimplemented");
            
    }
}