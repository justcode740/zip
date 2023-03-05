import { BigNumber, Contract, providers, Signer, utils } from "ethers";
import { BANCOR_NETWORK_ABI, BANCOR_REGISTRY_ABI } from "../../../../registry/abi";
import { CallData } from "../../execute";
import { Token, TradingPair } from "../../../../registry/tokens";
import Exchange from "../Exchange";
import { ChainID } from "../../../../registry/chains";

class BancorNetwork extends Exchange {
  getExchangeRouterAddr(): string {
    throw new Error("Method not implemented.");
  }
  reserves(tokenIn: string, tokenOut: string): Promise<[BigNumber, BigNumber]> {
    throw new Error("Method not implemented.");
  }
  private registry: Contract;
  private networkContract: Promise<Contract>;
  

  constructor(provider: providers.Provider | Signer, registryAddress: string, chainId: ChainID, name: string) {
    super(chainId, name);

    // The Bancor network has a single "ContractRegistry" address, which provides
    // a view function that allows you to find the addresses of all other contracts.
    //
    // See https://docs.bancor.network/developer-quick-start/working-with-bancor-network
    // for more information.
    this.registry = new Contract(
      registryAddress,
      BANCOR_REGISTRY_ABI,
      provider,
    );

    this.networkContract = this.registry
      .addressOf(utils.formatBytes32String("BancorNetwork"))
      .then((address: string) => {
        return new Contract(address, BANCOR_NETWORK_ABI, provider);
      });
  }

  async hasPool(tokenIn: string, tokenOut: string): Promise<boolean> {
    const networkContract = await this.networkContract;
    const path = await networkContract.conversionPath(
      tokenIn,
      tokenOut,
    );
    return path.length > 0;
  }

  async amountOut(
    amountIn: BigNumber,
    tokenIn: string,
    tokenOut: string,
  ): Promise<BigNumber> {
    const networkContract = await this.networkContract;
    const path = await networkContract.conversionPath(
      tokenIn,
      tokenOut,
    );
    return networkContract.rateByPath(path, amountIn);
  }

  async buildSwapTransaction(
    tradingPair: TradingPair,
    toAddress: string,
    deadline: number,
  ): Promise<CallData> {
    throw new Error("unimplemented");
  }
}

export default BancorNetwork;
