import { BigNumber, Wallet, Contract, Signer } from "ethers";
import { Token } from "../../registry/tokens";
import { providers } from "ethers";
import { JsonRpcSigner } from "@ethersproject/providers";

export const ETHER = BigNumber.from(10).pow(18);

export function bigNumberToDecimal(value: BigNumber, base = 18): number {
  const divisor = BigNumber.from(10).pow(base);
  return value.mul(10000).div(divisor).toNumber() / 10000;
}

export function getDefaultRelaySigningKey(): string {
  console.warn(
    "You have not specified an explicity FLASHBOTS_RELAY_SIGNING_KEY environment variable. Creating random signing key, this searcher will not be building a reputation for next run",
  );
  return Wallet.createRandom().privateKey;
}

export function tokenPairId(token1: string, token2: string): string {
  if (token1< token2) {
    return token1+ "," + token2;
  } else {
    return token2 + "," + token1;
  }
}

//for local test only
export function getLocalSigner(): JsonRpcSigner | undefined {
  const local = "http://localhost:8545";
  const provider = new providers.JsonRpcProvider(local);
  const signer = provider.getSigner(0);
  return signer;
}

export async function withdraw(bundleExecutor: Contract, signer: Signer) {
  let signerAddr = await signer.getAddress();
  let estimatedGasUnit = await bundleExecutor.estimateGas.withdraw(
    {
      from: signerAddr
    }
  );
  console.log(estimatedGasUnit.toString());
  let tx = await bundleExecutor.withdraw(
    {
      from: signerAddr,
      maxFeePerGas: BigNumber.from("60000000000"), //to change if flashbots are not used, defaults to the mean network gas price
      maxPriorityFeePerGas: BigNumber.from("40000000000"), //to determine at execution time
      gasLimit: BigNumber.from(estimatedGasUnit.mul(2)), //to change
    },
  );
  console.log(tx);
}
