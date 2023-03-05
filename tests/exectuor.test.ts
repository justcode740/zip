import {Contract, Wallet, utils, providers, BigNumber} from "ethers";
import chains from "../info/mainnet-fork-postDeploy.json"
import makeChain from "../infra/chains/makeChains";
import { getRoute } from "../infra/swap-aggregation/getRoute";
import { ChainID } from "../registry/chains";
import { getToken, TradingPair } from "../registry/tokens";
import { erc20Contract } from "../scripts/contracts";

// WARN: Deploy contract before run the tests!
describe("Route transaction", () => {
    it("send one-hop swap route",async () => {
        if (!process.env.EVM_PRIVATE_KEY) {
            throw new Error("no evm private key set")
        }
        const provider = new providers.JsonRpcProvider("http://localhost:8500/0")
        const eth = chains.find((chain) => chain.name === 'Ethereum');
        const signer = new Wallet(process.env.EVM_PRIVATE_KEY, provider)
        const contract = new Contract(eth!.contract.address, eth!.contract.abi, signer)

        const symbol1 = "WETH"
        const symbol2 = "USDC"


        // Assume user has 10 WETH and want to swap to whatever maximum USDC
        const [amount, name] = await getRoute(symbol1, symbol2, utils.parseUnits("1"), ChainID.Ethereum);

        let WETH = getToken(symbol1, ChainID.Ethereum);
        let USDC = getToken(symbol2, ChainID.Ethereum);
        //check undefined
        if (!WETH || !USDC) {
            throw new Error("token not supported");
        }

        let wethUsdc = { TokenIn: WETH, TokenOut: USDC };

        let tradingpair: TradingPair = {
            pair: wethUsdc,
            amountIn: utils.parseUnits("1"),
            amountOut: BigNumber.from('0'), // slippage allowance 20%
        };
        let deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        console.log(name)
        const calldata = await makeChain(ChainID.Ethereum).getExchangeByName(name).buildSwapTransaction(
            tradingpair,
            eth!.contract.address,
            deadline
        )
        // Before swap
        console.log(await erc20Contract(USDC.address, provider).balanceOf(eth!.contract.address))

        const approve = await erc20Contract(WETH.address, signer).approve(eth!.contract.address, utils.parseUnits("2"))

        console.log(approve)

        const targets = [calldata.targetAddress]
        const payloads = [calldata.data]
        const tokens = [WETH.address]
        console.log(WETH.address)

         //not accurate since multiple internal tx and calls are made
        let estimatedGasUnit =
        await contract.estimateGas.route(
        targets,
        payloads,
        tokens,
        utils.parseUnits("1.5"),
        {
            value: utils.parseUnits("1.5"),
            from: signer.address,
        },
        );
        console.log(estimatedGasUnit.toString());

        let tx = await contract.route(
            targets,
            payloads,
            tokens,
            utils.parseUnits("1.5"),
            {
                value: utils.parseUnits("1.5"),
                from: signer.address,
                maxFeePerGas: BigNumber.from("60000000000"), //to change if flashbots are not used, defaults to the mean network gas price
                maxPriorityFeePerGas: BigNumber.from("40000000000"), //to determine at execution time
                gasLimit: BigNumber.from(estimatedGasUnit.mul(2)), //to change
            },
        );

        // Build
        console.log(tx)
        // const tx = await contract.route([calldata.targetAddress], [calldata.data], [WETH.address], utils.parseUnits("1.5"),
        // {
        //     from: await signer.getAddress(),
        //     gasPrice: BigNumber.from(0),
        //     gasLimit: BigNumber.from(2000000),
        //   },)


        // After swap
        console.log(await erc20Contract(USDC.address, provider).balanceOf(eth!.contract.address))
        
        
        // console.log(tx)
    })

    // it.only("test", async () => {
    //     const symbol2 = "USDC"
    //     let USDC = getToken(symbol2, ChainID.Ethereum);
    //     console.log(await erc20Contract(USDC.address, provider).balanceOf(eth!.contract.address))
    // })
})