import { BigNumber } from "ethers";
import { ChainID } from "./chains";
import arbTokens from "./arbitrum-token.json";
import ethTokens from "./ethereum-token.json";

export type Token = {
  symbol: string;
  name: string;
  address: string;
  chainId: ChainID; // chainID
  decimals: number;
  logoURL?: string;
};

export type Pair = {
  TokenIn: Token;
  TokenOut: Token;
};

export type TradingPair = {
  pair: Pair;
  amountIn: BigNumber;
  amountOut: BigNumber;
};

export const tokensEth: Token[] = ethTokens.tokens;
export const tokensArb: Token[] = arbTokens.tokens;

// Compile-time const
const tokensEthBySymbol: Record<string, Token> = {};
for (const token of tokensEth) {
  tokensEthBySymbol[token.symbol] = token;
}

const tokensArbBySymbol: Record<string, Token> = {};
for (const token of tokensArb) {
  tokensArbBySymbol[token.symbol] = token;
}

// TODO!: add more chain tokens
/** Returns the token with a specific symbol. */
export function getToken(symbol: string, chainId: ChainID): Token | undefined {
  switch (chainId) {
    case ChainID.Ethereum:
      return tokensEthBySymbol[symbol]
    case ChainID.Arbitrum:
      return tokensArbBySymbol[symbol]
    default:
      throw new Error("unsupported chain")
  }
}



