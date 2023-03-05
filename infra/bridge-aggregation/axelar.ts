import { AxelarQueryAPI, AxelarQueryAPIConfig, Environment, EvmChain } from "@axelar-network/axelarjs-sdk";
import { BridgeID } from "../../registry/bridges";
import { ChainID } from "../../registry/chains";
import Bridge from "./bridge";

const config :AxelarQueryAPIConfig = {
    environment: Environment.MAINNET
}

const sdk = new AxelarQueryAPI(config);

// TODO add supported token symbols
class Axelar extends Bridge {
    constructor(source: ChainID, destination: ChainID){
        super(source, destination);
    }
    getBridgeId(): BridgeID {
       return BridgeID.Axelar;
    }
    getSourceChainName(): string {
        return this.getChainName(this.source);
    }
    getDestinationChainName(): string {
        return this.getChainName(this.destination);
    }

    getChainName(chain: ChainID) {
        switch (chain) {
            case ChainID.Ethereum:
                return "Ethereum";
            case ChainID.Avalanche:
                return "Avalanche";
            case ChainID.Polygon:
                return "Polygon";
            case ChainID.Arbitrum:
                return "arbitrum";
            default:
                throw new Error("unsupported source chain")
        }
    }

    getsdkChainName(chain: ChainID) {
        switch (chain) {
            case ChainID.Ethereum:
                return EvmChain.ETHEREUM;
            case ChainID.Avalanche:
                return EvmChain.AVALANCHE;
            case ChainID.Polygon:
                return EvmChain.POLYGON;
            // case ChainID.Arbitrum:
            //     return EvmChain.ar;
            default:
                throw new Error("unsupported source chain")
        }
    }

    getDeliveryTime(): number {
        // TODO: real-time based on monitoring and sdk 
       switch (this.source) {
            case ChainID.Ethereum:
                return 1033
            case ChainID.Avalanche:
                return 85
            case ChainID.Polygon:
                return 348
            default:
                throw new Error("unsupported source chain")
       }
    }

    // For axelar, it's gas fee paid for execution on destination chain and base fee 
    // You ofc need to pay transaction fee on source chain
    async computeBridgeFee(sourceChainTokenSymbol: string): Promise<string> {
        const sourceChainName = this.getsdkChainName(this.source)
        const destChainName = this.getsdkChainName(this.destination)
        return await sdk.estimateGasFee(
            sourceChainName, 
            destChainName,
            sourceChainTokenSymbol,
            // TODO fill more accurate estimate parameters
        )
    }
    
}

export default Axelar;