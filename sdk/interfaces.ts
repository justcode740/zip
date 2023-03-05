import { BigNumber } from "ethers";
import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { Env } from "../registry/providers";

export interface RouteReq {
  sourceChainId: number;
  sourceChainTokenSymbol: string;
  sourceChainTokenAmount: BigNumber;
  destinationChainDappNameId: string;
  destinationChainFunctionSelector: string;
  destinationChainArgs: string;
  destinationChainId: number;
  recipientAddress: string;
  env: Env;
}

export interface RouteInfo {
  target: string;
  payload: string;
  tokenIn: string;
}

export interface EIP1559FeeOptions {
  maxFeePerGas: BigNumber,
  maxPriorityFeePerGas: BigNumber,
  gasLimit: BigNumber,
  value: BigNumber
}

export interface RouteReturn {
  routes: RouteInfo[];
  tokenInputAmount: BigNumber; // TODO: change to detect whatever get and transfer all to destination chain
  nativeEth: boolean;
  bridgeInfo: BridgeInfo;
  feeOptions: EIP1559FeeOptions;
}

export interface DestinationChainAction {
  dappNameId: string;
  functionSelector: string;
  args: string;
}

export interface BridgeInfo {
  destinationChain: string;
  destinationAddress: string; //
  tokenSymbol: string;
  tokenAmount: BigNumber;
  payload: string;
}

export interface ZipContractReq {
  chainId: number;
  env: Env;
}

export interface ZipTxStatustReq {
  txHash: string;
  chainId: number;
}

export interface ZipTxStatustRet extends TransactionReceipt {}

export interface ZipContractRet {
  chainId: number;
  chainName: string;
  address: string;
  abi: string[];
}

export interface HomepageReq {
  masterKey: string;
}

export interface Permission {
  token: string;
  protocol: string;
  amount: string;
}

export interface TokenReq {
  symbol: string;
  chainId: number;
}

export interface DappNameId {
  nameId: string;
}

export interface DappChainId {
  chainId: number;
  n?: number;
}

export interface SearchQuery {
  query: string;
}

export interface MasterKey {
  masterKey: string;
}

export interface DappId {
  dappId: number;
}

export interface IdKey {
  dappId: number;
  masterKey: string;
}