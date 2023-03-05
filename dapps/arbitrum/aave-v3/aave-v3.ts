import { BigNumber, Contract, providers, Signer } from "ethers";
import { ChainID } from "../../../registry/chains";
import  AAVEV3PoolAddressProviderABI  from "./abis/aaveV3PoolAddressProvider.json";
import AAVEV3Pool from "./abis/aaveV3Pool.json";
import { CallData } from "../../../infra/swap-aggregation/execute";

export class AaveV3 {
    private poolAddressProvider: Contract;
    private aaveV3Pool!: Contract;
    private chainId: ChainID;
    private poolAddress!: string;
    poolAddressProviderAddress: string = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb";

    constructor(provider: providers.Provider | Signer, chainId: ChainID){
        this.chainId = chainId;
        this.poolAddressProvider = new Contract(this.poolAddressProviderAddress, AAVEV3PoolAddressProviderABI, provider);
    }

    async init(provider: providers.Provider) {
        this.poolAddress = await this.poolAddressProvider.getPool();
        this.aaveV3Pool = new Contract(this.poolAddress, AAVEV3Pool, provider);
    }

    // -- write functions--
    // naming convention 
    async buildborrowTransaction(asset : string, amount : BigNumber, interestRateMode : BigNumber, referralCode : BigNumber, onBehalfOf : string): Promise<CallData>{
        const populatedTransaction = await this.aaveV3Pool.populateTransaction.borrow(asset, amount, interestRateMode, referralCode, onBehalfOf);
        if (
            populatedTransaction === undefined ||
            populatedTransaction.data === undefined
          )
            throw new Error("fail to generate tx");
        return {
            data: populatedTransaction.data,
            targetAddress: this.aaveV3Pool.address
        }
    }

    async buildrepayTransaction(asset : string, amount : BigNumber, interestRateMode : BigNumber, onBehalfOf : string): Promise<CallData>{
            const populatedTransaction = await this.aaveV3Pool.populateTransaction['repay(address,uint256,uint256,address)'](asset, amount, interestRateMode, onBehalfOf);
            if (
                populatedTransaction === undefined ||
                populatedTransaction.data === undefined
            )
                throw new Error("fail to generate tx");
            return {
                data: populatedTransaction.data,
                targetAddress: this.aaveV3Pool.address
            }
        }
        
    async buildsupplyTransaction(asset : string, amount : BigNumber, onBehalfOf : string, referralCode : BigNumber): Promise<CallData>{
            const populatedTransaction = await this.aaveV3Pool.populateTransaction['supply(address,uint256,address,uint16)'](asset, amount, onBehalfOf, referralCode);
            if (
                populatedTransaction === undefined ||
                populatedTransaction.data === undefined
            )
                throw new Error("fail to generate tx");
            return {
                data: populatedTransaction.data,
                targetAddress: this.aaveV3Pool.address
            }
        }

    // -- read functions--    
}

export interface aaveV3SupplyArgs {
    onBehalfOf: string,
}

export enum FunctionSelector {
    SUPPLY = "supply",
    BORROW = "borrow",
    REPAY = "repay",
}



