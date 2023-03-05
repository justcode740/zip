import { ethers, Wallet } from 'ethers'
// ABIs
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { abi as IUniswapV3FactoryABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json"
import { abi as QuoterABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json'
import ERC20 from "../abis/erc20.json"

enum UniV3ContractName {
    UniswapV3Factory,
    Quoter,
    UniswapV3Pool
}


// This framework suitable for same contract (with same ABIs) deployed on multiple EVM chains
// construct contract instance
function uniV3Contract(address: string, contractName: UniV3ContractName, provider: ethers.providers.JsonRpcProvider){
    switch (contractName) {
        case UniV3ContractName.UniswapV3Factory:
            return new ethers.Contract(address, IUniswapV3FactoryABI, provider)
        case UniV3ContractName.Quoter:
            return new ethers.Contract(address, QuoterABI, provider)
        case UniV3ContractName.UniswapV3Pool:
            return new ethers.Contract(address, IUniswapV3PoolABI, provider)
        default:
            throw new Error("unimplemented")
    }
}

function erc20Contract(address: string, provider: ethers.providers.JsonRpcProvider | Wallet) {
    return new ethers.Contract(address, ERC20, provider)
}

export {
    UniV3ContractName,
    uniV3Contract,
    erc20Contract
}