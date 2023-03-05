import { BigNumber, Contract, providers, Signer } from "ethers";
import { CallData } from "../../../infra/swap-aggregation/execute";
import { GMX_POSITION_ROUTER_ABI, GMX_ROUTER_ABI, GMX_READER_ABI} from "../../../registry/abi";
import { ChainID } from "../../../registry/chains";
import { TradingPair } from "../../../registry/tokens";

export class GMX {
    private positionRouter: Contract;
    private router: Contract;
    private reader: Contract;
    private chainId: ChainID;
    vaultAddress: string = "0x489ee077994B6658eAfA855C308275EAd8097C4A";
    constructor(provider: providers.Provider | Signer, routerAddress: string, postionRouterAddress: string, readerAddress: string, chainId: ChainID){
        this.chainId = chainId;
        this.positionRouter = new Contract(postionRouterAddress, GMX_POSITION_ROUTER_ABI, provider);
        this.router = new Contract(routerAddress, GMX_ROUTER_ABI, provider);
        this.reader = new Contract(readerAddress, GMX_READER_ABI, provider);
    }
    
    // ---------------------Write functions-------------------------------------
    
    // For each of the stateful (write) function you want to expose to zip user, implement a function here. we will generate corresponding form-like frontend for you.
    async buildSwapTransaction(tradingPair: TradingPair,
        toAddress: string): Promise<CallData> {
        // swap(address[] memory _path, uint256 _amountIn, uint256 _minOut, address _receiver) 
        const populatedTransaction = await this.router.populateTransaction.swap(
            [tradingPair.pair.TokenIn.address, tradingPair.pair.TokenOut.address],
            tradingPair.amountIn,
            tradingPair.amountOut,
            toAddress
        );
        if (
            populatedTransaction === undefined ||
            populatedTransaction.data === undefined
          )
            throw new Error("fail to generate tx");
        return {
            data: populatedTransaction.data,
            targetAddress: this.router.address
        }
    }


    // Approve the PositionRouter as a Router plugin for your account
    // Router.approvePlugin(PositionRouter address)
    // Approve the Router contract for the token and amount you would deposit as collateral for the position
    async buildcreateIncreasePositionTransaction(
        _path: string[], // [collateralToken] or [collateralToken, tokenOut] 
        _indexToken: string,
        _amountIn: BigNumber,
        _minOut: BigNumber,
        _sizeDelta: BigNumber,
        _isLong: Boolean,
        _acceptablePrice: BigNumber,
        _executionFee: BigNumber,
        _referralCode: string,
        _callbackTarger: string 
    ): Promise<CallData> {
        const populatedTransaction = await this.positionRouter.populateTransaction.createIncreasePosition(
            _path,
            _indexToken,
            _amountIn,
            _minOut,
            _sizeDelta,
            _isLong,
            _acceptablePrice,
            _executionFee,
            _referralCode,
            _callbackTarger
        );
        if (
            populatedTransaction === undefined ||
            populatedTransaction.data === undefined
        )
            throw new Error("fail to generate tx");
        return {
            data: populatedTransaction.data,
            targetAddress: this.positionRouter.address
        }
    }
    
    async buildcreateDecreasePositionTransaction(
        _path: string[], // [collateralToken] or [collateralToken, tokenOut] if a swap is needed
        _indexToken: string, // the index token of the position
        _collateralDelta: BigNumber, // the amount of collateral in USD value to withdraw
        _sizeDelta: BigNumber, // the USD value of the change in position size
        _isLong: Boolean, // whether the position is a long or short
        _receiver: string, // the address to receive the withdrawn tokens
        _acceptablePrice: BigNumber, // the USD value of the min (for longs) or max (for shorts) index price acceptable when executing the request
        _minOut: BigNumber, // the min output token amount
        _executionFee: BigNumber, // can be set to PositionRouter.minExecutionFee
        _withdrawETH: Boolean, // only applicable if WETH will be withdrawn, the WETH will be unwrapped to ETH if this is set to true
        _callbackTarget: string, // an optional callback contract, this contract will be called on request execution or cancellation
    ): Promise<CallData> {
        const populatedTransaction = await this.positionRouter.populateTransaction.createDecreasePosition(
            _path,
            _indexToken,
            _collateralDelta,
            _sizeDelta,
            _isLong,
            _receiver,
            _acceptablePrice,
            _minOut,
            _executionFee,
            _withdrawETH,
            _callbackTarget
        );
        if (
            populatedTransaction === undefined ||
            populatedTransaction.data === undefined
        )
            throw new Error("fail to generate tx");
        return {
            data: populatedTransaction.data,
            targetAddress: this.positionRouter.address
        }
    }

    // -------------------Read functions---------------------------------------
    async getPositionList(
        _vault: string, // the vault contract address 
        _account: string, // the account of the user
        _collateralTokens: string[], // an array of collateralTokens
        _indexTokens: string[], // an array of indexTokens
        _isLong: Boolean[], // an array of whether the position is a long position
    ) {
        console.log(await this.reader.getPositions(
            _vault,
            _account,
            _collateralTokens,
            _indexTokens,
            _isLong
        ))
    }
    async getMinExecutionFee() : Promise<BigNumber> {
        return await this.positionRouter.minExecutionFee();
    }
}

export interface GMXSwapArgs {
    tokenSymbolOut: string; // e.g. "FRAX"
    toAddress: string;
}

export enum FunctionSelector {
    SWAP = "swap",
    INCREASEPOSITION = "increasePosition",
    DECREASEPOSITION = "decreasePosition"
}