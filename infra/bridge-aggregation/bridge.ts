import { ChainID } from "../../registry/chains";
import { BridgeID } from "../../registry/bridges";
abstract class Bridge {
    source;
    destination;
    constructor(source: ChainID, destination: ChainID) {
        this.source = source;
        this.destination = destination;

    }
    // Get bridgeID
    abstract getBridgeId(): BridgeID;
    // Get source chain name / id specific to a bridge
    abstract getSourceChainName(): string;
    // Get destination chain name / id specific to a bridge
    abstract getDestinationChainName(): string;

    
    


    // Get specific bridge's chain name representation
    // abstract getChainName();

    // Estimate the delivery time for the bridge in seconds, maybe not abstract here
    abstract getDeliveryTime(): number;



    // Given bridged token, message bytes, simulate to get costs denominated in real-time native gas unit
    // abstract computeBridgeFee() : BigNumber;
}

export default Bridge;