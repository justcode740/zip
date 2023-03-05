#  simple cross-chain execution framework

basic functionalities

- liquidity routing
- bridge aggregations
- interact with arbitrary dapps
- gas and time estimate

zip-framework is built for permissionless operations and infinite scalability, anyone is welcome to submit a PR and the core team will integrate into zip in 24h.

# quick start

Ensure node is v16.x.x `nvm use 16`

### Setup localenv
Required env variable in .env 

`EVM_PRIVATE_KEY=<your-private-key>`

```
npx ts-node scripts/createLocalFork.ts
```

### Compile and deploy
```
npx hardhat compile
node scripts/deploy.js mainnet-fork
```

### Test
Cross-chain-relevant tests
```
node axelar/test.js mainnet-fork
```
Unit tests (mocha)
```
npm test
```

### Deploy to heroku
API entry point is at sdk/index.ts

`git push heroku <branch>:master`

e.g.

`git push heroku design/sdk:master`

Done:
- [x] merge to master automatically deploy to heroku to ensure consistency of deployed version and this repo's master.






