# Swap aggregator on each chain

swap-aggregation only solves the local domain problem: given two token on 
same chain, what's best route between them

```
swap(tokenA: address, tokenB: address, amountIn: uint256): route, amountOut
```

## TODO
- [ ] consider gas fees
- [ ] fetch from aggregrators, and lemmaswap, etc. to ensure has best global prices
- [ ] finish token registry on other chain
