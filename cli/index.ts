#!/usr/bin/env ts-node

import { getRoute } from "../infra/swap-aggregation/getRoute";
import { ChainID } from "../registry/chains";
import { getToken } from "../registry/tokens";
// const { Command } = require("commander");
const figlet = require("figlet");

const {program, Logger} = require("@caporal/core")
import {utils} from "ethers";

program
  // First possible command: "order"
  .command("swap", "swap token on single chain")
  .argument("<chainId>", "Chain swap happens")
  .argument("<tokenIn>", "TokenIn")
  .argument("<tokenInAmount>", "token in amount in AU")
  .argument("<tokenOut>", "TokenOut")
  .option("-e, --extra-ingredients <ingredients>", "Extra ingredients")
  .action(async ( { logger, args, options}: {logger:any, args:any, options: any}) => {
    const chainId = ChainID[args.chainId as keyof typeof ChainID]
    if (!chainId)  {
      throw new Error("Bad chainId input")
    }
    const tokenIn = getToken(args.tokenIn, chainId)
    const tokenOut = getToken(args.tokenOut, chainId)
    if (!tokenIn || !tokenOut) {
      throw new Error("Bad token input or output.");
    }
    const s = performance.now()
    const [maxOut, router] = await getRoute(args.tokenIn, args.tokenOut, utils.parseUnits(args.tokenInAmount.toString(), tokenIn.decimals), chainId)
    const e = performance.now()
    console.log(`${e-s} ms total`)
    console.log(utils.formatUnits(maxOut, tokenOut.decimals), router)
    
  })

  // Another command: "cancel"
  .command("bridge", "Cancel an order")
  .argument("<order-id>", "Order id")
  .action(({ logger, args }:{logger:any, args:any, options: any} ) => {
    logger.info("Order canceled: %s", args.orderId)
  })

program.run()

// console.log(figlet.textSync("Zip Framework"));

// program
//   .version("1.0.0")
//   .description("An example CLI for managing a directory")
//   .option("-s, --swap <chainId> <token1> <amountInAU> <token2>", "find best route between token1 and token2")
//   .option("-m, --mkdir <value>", "Create a directory")
//   .option("-t, --touch <value>", "Create a file")
//   .parse(process.argv);
  
// const options = program.opts();

// console.log(options.swap)
