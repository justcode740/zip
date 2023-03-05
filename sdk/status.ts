import chains from "../info/mainnet-fork-postDeploy.json";
import { ethers } from "ethers";
import { ZipTxStatustRet } from "./interfaces";

export async function getTransactionStatus(
  txHash: string,
  chainId: number
): Promise<ZipTxStatustRet | null> {
  const chain = chains.find((chain) => chain.chainId === chainId);
  const rpcUrl = chain?.rpc;

  if (rpcUrl) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const txReceipt = await provider.getTransactionReceipt(txHash);
    if (txReceipt && txReceipt.blockNumber) {
      return txReceipt;
    }
  }

  return null;
}
