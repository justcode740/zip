// take in abi, and auto gen protocol.ts
import AAVEV3PoolAddressProviderABI from "../dapps/arbitrum/aavev3/abis/aaveV3PoolAddressProvider.json";
function solidityTypeToTSType(solType: string): string {
    if (solType == "address" || solType == "bytes32" || solType=="string") {
            return "string";
    }else if(solType.startsWith("uint")) {
        return "BigNumber";
    }else if(solType=="bool"){
        return "Boolean";
    }else if(solType=="address[]" || solType=="string[]"){
        return "string[]";
    }
    else{
        throw new Error("unsupported sol types")
    }
}
async function autogen(abiPath: string, contractName: string, funcNames: string[]){
    const abis = require(abiPath);
    var program = "";
    for (const abi of abis) {
        if(abi.type == "function"){
            if (funcNames.indexOf(abi.name!) > -1) {
                var args = "";
                var plainArgNames = "";
                for (var i=0; i < abi.inputs.length; i++) {
                    const input = abi.inputs[i];
                    args = args + (i == 0? "" : ", ") + input.name + " : " + solidityTypeToTSType(input.type);
                    plainArgNames = plainArgNames + (i == 0? "" : ", ") + input.name;
                }
                program = program + "\n" + getFunction(contractName, abi.name!, args, plainArgNames);
            }
        }
    }
    // parse abi
    // for each specified function, 
    console.log(program);
    
}

function getFunction(contractName: string, functionName:string, args: string, plainsArgs: string): string {
    const buildFuncName = `build${functionName}Transaction`;
    return `async ${buildFuncName}(${args}): Promise<CallData>{
        const populatedTransaction = await this.${contractName}.populateTransaction.${functionName}(${plainsArgs});
        if (
            populatedTransaction === undefined ||
            populatedTransaction.data === undefined
          )
            throw new Error("fail to generate tx");
        return {
            data: populatedTransaction.data,
            targetAddress: this.${contractName}.address
        }
    }`
}

if (require.main === module) {
   (async () => {
    await autogen("../dapps/arbitrum/aavev3/abis/aaveV3Pool.json", "aaveV3Pool", ["supply", "borrow", "repay"]);
   })();
}