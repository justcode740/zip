import { ChainID } from '../registry/chains';
import { getRoute } from "../infra/swap-aggregation/getRoute";
import { ethers, BigNumber } from 'ethers';
import  Bridge  from '../infra/bridge-aggregation/bridge';
import Axelar from '../infra/bridge-aggregation/axelar';
import { BridgeID } from '../registry/bridges';
import { getToken, TradingPair } from '../registry/tokens';
import Curve from '../infra/swap-aggregation/exchanges/ethereum/curve';
import { CallData } from '../scripts/executor';
import { BridgeInfo, DestinationChainAction, RouteInfo, RouteReturn } from './interfaces';
import {makeChain} from "../infra/chains/makeChains";
import chains from "../info/mainnet-fork-postDeploy.json";
import { BigNumberUtils } from './utils';
import { Env, getProviderByChainId } from '../registry/providers';
import { getContractInfo } from './contract';
import { getFee, getGasPrice } from '@axelar-network/axelar-local-dev';
import { simTx } from './createSimUser';

async function findBestBridge(sourceChainId: ChainID, destinationChainId: ChainID) : Promise<[Bridge, string]> {
    return [new Axelar(sourceChainId, destinationChainId), sourceChainId==ChainID.Ethereum ? "USDC" : "axlUSDC"];
}

function getChainNameByChainId(chainId: ChainID) : string {
    switch (chainId) {
        case ChainID.Arbitrum:
            return "arbitrum";
        case ChainID.Ethereum:
            return "Ethereum";
        case ChainID.Avalanche:
            return "Avalanche";
        case ChainID.Polygon:
            return "Polygon";
        default:
            throw new Error("chain unsupported for execution yet");
    }
}

// TODO! handle pool doesn't exist case
export async function construct(sourceChainId: ChainID, sourceChainTokenSymbol: string, sourceChainTokenAmount: BigNumber, destinationChainAction: DestinationChainAction, destinationChainId: ChainID, recipientAddress: string, env : Env) : Promise<RouteReturn> {
    if (sourceChainId == destinationChainId) {
        // TODO same-chain execution, no bridge
        
        throw new Error("same chain unimplemented")
    }else{
        console.log("Cross-chain demand detected, searching best bridge...");
        const [bridge, bridgeTokenSymbol] = await findBestBridge(sourceChainId, destinationChainId);
        console.log("best bridge found: ", bridge.getBridgeId())
        let nativeEth = false;
        let routes : RouteInfo[] = []
        const bestBridgeId = bridge.getBridgeId();
        // fetch bridge info, and find best route
        if (bestBridgeId == BridgeID.Axelar) {
            // currently bridgeToken is always USDC, TODO update to more token when axelar supports native token bridge
            console.log(bridgeTokenSymbol, sourceChainId);
            const bridgeToken = getToken(bridgeTokenSymbol, sourceChainId);
            if (!bridgeToken) {
                throw new Error("bridge token undefined on source chain");
            }
            let bridgeAmount: BigNumber;
            if (sourceChainTokenSymbol == bridgeTokenSymbol) {
                // no route needed
                routes.push(
                    {
                        target: "0x0000000000000000000000000000000000000000",
                        payload: "0x",
                        tokenIn: bridgeToken?.address
                    }
                )
                bridgeAmount = sourceChainTokenAmount;
            }else{
                if (sourceChainTokenSymbol == "ETH") {
                    nativeEth = true;
                    sourceChainTokenSymbol = "WETH";
                }
                // TODO make it more than one hop
                const [amountOut, name] = await getRoute(sourceChainTokenSymbol, bridgeTokenSymbol, sourceChainTokenAmount, sourceChainId, env);
                // TODO use it as minimum bridge amount, and bridge actual amount depend on contract?
                console.log("amountout", amountOut);
                const minAmountOut = BigNumberUtils.multiply(amountOut, 0.5);
                console.log("minamountout", minAmountOut);
                bridgeAmount = minAmountOut;
                const sourceChain = makeChain(sourceChainId);
                const exchange = sourceChain.getExchangeByName(name);
                let tokenIn = getToken(sourceChainTokenSymbol, sourceChainId)!;
                let tokenOut = getToken(bridgeTokenSymbol, sourceChainId)!;
                let tokenPair = { TokenIn: tokenIn, TokenOut: tokenOut };
                let tradingPair: TradingPair = {
                  pair: tokenPair,
                  amountIn: sourceChainTokenAmount,
                  amountOut: minAmountOut,
                };
                let deadline = Math.floor(Date.now() / 1000) + 60 * 20;
                const sourceChainContractInfo = getContractInfo(sourceChainId, env);
                const calldata = await exchange.buildSwapTransaction(
                    tradingPair,
                    sourceChainContractInfo.address,
                    deadline
                );
                routes.push(
                    {
                        target: calldata.targetAddress,
                        payload: calldata.data,
                        tokenIn: tokenIn.address,
                    }
                )
            }
            
            // Constrcut executions on destination chain
            let destinationCalldatas: CallData[] = [];
            let destinationBridgeTokenSymbol = destinationChainId == ChainID.Ethereum ? "USDC" : "AXLUSDC";

            // Swap to USDC on curve pool
            let axlUSDC_DEST = getToken(destinationBridgeTokenSymbol, destinationChainId);
            let USDC_DEST = getToken("USDC", destinationChainId);
            // check undefined
            if (!USDC_DEST || !axlUSDC_DEST) {
                throw new Error("token not supported");
            }

            let axlUSDCUSDC = { TokenIn: axlUSDC_DEST, TokenOut: USDC_DEST };

            let tradingpair = {
                pair: axlUSDCUSDC,
                amountIn: bridgeAmount,
                amountOut: BigNumber.from(0), // TODO, estimate with curve and replace bridgeAmount.toNumber() * 0.9 as input amount
            };
            const curve = new Curve(
                getProviderByChainId(destinationChainId, env), 
                "0x15a1c069fcf6f79a3d5bb5d4a8ba004fbf4fabac", // TODO, make it not hardcode dependon destination chain id
                ChainID.Arbitrum
            );
            destinationCalldatas.push(await curve.buildSwapTransaction(tradingpair));
            
            // TODO: swap USDC to neccesary token needed to interact with dapp on destination chain

            // -------------Construct destination chain Dapp calldata-----------
            
            const chainName = getChainNameByChainId(destinationChainId);
            const constructFunctionPath = `../dapps/${chainName}/${destinationChainAction.dappNameId}/construct`;
            const {construct} = require(constructFunctionPath);

            let dappCallData : CallData;
        
            // TODO: should implement on contract side to use whatever bridged to perform the actions, if fail, refund.
            const slippageOnDestinationChain: number = 0.1;
            dappCallData = await construct(destinationChainAction.functionSelector, destinationChainAction.args, "USDC", BigNumberUtils.multiply(bridgeAmount, slippageOnDestinationChain), env);
            destinationCalldatas.push(dappCallData);
            
            const abi = ethers.utils.defaultAbiCoder;
            // route logic with curve
            const bytes = abi.encode(
                ["address", "address[]", "bytes[]", "address[]"],
                [
                    recipientAddress, 
                    destinationCalldatas.map((calldata) => calldata.targetAddress),
                    destinationCalldatas.map((calldata) => calldata.data),
                    [
                        ethers.utils.getAddress(axlUSDC_DEST.address), // axlUSDC
                        ethers.utils.getAddress(USDC_DEST.address) // USDC (Arb1)
                    ]
                ]
            )

            const zipContractDestinationChain = getContractInfo(destinationChainId, env);
            // Define bridgeinfo, currently hardcode to USDC
            let bridgeInfo : BridgeInfo = {
                destinationChain: bridge.getDestinationChainName(),
                destinationAddress: zipContractDestinationChain.address,
                tokenSymbol: 'USDC',
                tokenAmount: bridgeAmount, 
                payload: bytes
            }
            // TODO: Replace hardcode to real state monitoring
            const gasLimit = getFee();
            const gasPrice = getGasPrice();
            const bytesForSim = abi.encode(
                ["RouteInfo[]", "uint256", "bool", "BridgeInfo"],
                [
                    routes,
                    sourceChainTokenAmount,
                    nativeEth,
                    bridgeInfo
                ]
            );
            // Simulate the transaction on tenderly
            await simTx(sourceChainId, recipientAddress, zipContractDestinationChain.address, bytesForSim);
            return {
                routes: routes, 
                tokenInputAmount: sourceChainTokenAmount, 
                nativeEth: nativeEth, 
                bridgeInfo: bridgeInfo, 
                feeOptions: {
                    maxFeePerGas: BigNumber.from("60000000000"), // To change if flashbots are not used, defaults to the mean network gas price,
                    maxPriorityFeePerGas: BigNumber.from("40000000000"), // To determine at execution time
                    gasLimit: BigNumber.from(gasLimit), // To change
                    value: nativeEth ? BigNumber.from(Math.floor(gasLimit * gasPrice)).add(sourceChainTokenAmount) : BigNumber.from(Math.floor(gasLimit * gasPrice)) // To pay destination chain gas fee, in case of nativeEth, pay additional ETH
                }
            }
        }else {
            throw new Error(`${bestBridgeId} unsupported yet`);
        } 
    }
}

