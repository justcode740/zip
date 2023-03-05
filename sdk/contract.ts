import localchains from "../info/mainnet-fork-postDeploy.json";
import awschains from "../info/aws-postDeploy.json";
import { Env } from "../registry/providers";
import { ZipContractRet } from "./interfaces";

export function getContractInfo(chainId: number, env: Env): ZipContractRet {
  let chain;
  if (env == Env.FORK) {
    chain = awschains.find((chain) => chain.chainId === chainId);
  }else if (env == Env.LOCAL) {
    chain = localchains.find((chain) => chain.chainId === chainId);
  }else{
    throw new Error("mainnet contract hasn't been deployed");
  }
  const contractInfo = chain?.contract!;
  const ret: ZipContractRet = {
    chainId: chainId,
    chainName: chain?.name!,
    abi: contractInfo.abi,
    address: contractInfo.address,
  };
  return ret;
}
