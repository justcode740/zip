import { BigNumber, Contract, providers, Signer } from "ethers";
import { TRADERJOE_V2_LBFACTORY, TRADERJOE_V2_LBQUOTER, TRADERJOE_V2_LBROUTER } from "../../../../registry/abi";
import { CallData } from "../../execute";
import { TradingPair } from "../../../../registry/tokens";
import Exchange from "../Exchange";

class TraderJoeV2 extends Exchange {
    private quoter: Contract;
    private router: Contract;
    private factoryV2: Contract;
    private fee: number;
    
    constructor(
        provider: providers.Provider | Signer,
        quoterAddress: string,
        routerAddress: string,
        factoryAddress: string,
        fee: number,
        network: string,
        name: string,
      ) {
        super(network, name);
        this.quoter = new Contract(quoterAddress, TRADERJOE_V2_LBQUOTER, provider);
        this.router = new Contract(
        routerAddress,
        TRADERJOE_V2_LBROUTER,
        provider,
        );
        this.factoryV2 = new Contract(factoryAddress, TRADERJOE_V2_LBFACTORY, provider);
        this.fee = fee;
      }
    async hasPool(tokenIn: string, tokenOut: string): Promise<boolean> {
        const factory = this.factoryV2;
        const res = await factory.getLBPairInformation(
            tokenIn,
            tokenOut,
            this.fee, // e.g.10,20,30
        );
        console.log(res);
        console.log(res.LBPair)
        return res.LBPair !== "0x0000000000000000000000000000000000000000";
    }
    getExchangeRouterAddr(): string {
        return this.router.address;
    }
    protected amountOut(amountIn: BigNumber, tokenIn: string, tokenOut: string): Promise<BigNumber> {
        
        throw new Error("Method not implemented.");
    }
    async buildSwapTransaction(tradingPair: TradingPair, toAddress: string, deadline: number): Promise<CallData> {
        let paramtuple: [
            BigNumber,
            number[],
            string[],
            string,
            number,
          ] = [
            tradingPair.amountOut,
            [1, this.fee],
            [tradingPair.pair.TokenIn.address, tradingPair.pair.TokenOut.address],
            toAddress,
            deadline
          ];
      
          const populatedTransaction =
            await this.router.populateTransaction.swapExactAVAXForTokens(tradingPair.amountOut,
            [1, this.fee],
            [tradingPair.pair.TokenIn, tradingPair.pair.TokenOut],
            toAddress,
            deadline);
          if (
            populatedTransaction === undefined ||
            populatedTransaction.data === undefined
          )
            throw new Error("fail to generate tx");
        return {
        data: populatedTransaction.data,
        targetAddress: this.router.address,
        };
    }
    reserves(tokenIn: string, tokenOut: string): Promise<[BigNumber, BigNumber]> {
        throw new Error("Method not implemented.");
    }
    
};
export default TraderJoeV2;