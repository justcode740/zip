import express, { Request, Response } from "express";
import {
  RouteReq,
  RouteReturn,
  ZipContractReq,
  HomepageReq,
  ZipTxStatustReq,
  TokenReq,
  DappNameId,
  DappChainId,
  SearchQuery,
  MasterKey,
  DappId,
  IdKey,
} from "./interfaces";
import { construct } from "./construct";
import { getContractInfo } from "./contract";
import { ChainID } from "../registry/chains";
import { BigNumber, ethers } from "ethers";
import cors from "cors";
import { getRecommendedProtocols } from "./recommendation";
import dotenv from "dotenv";
import { getTransactionStatus } from "./status";
import { getDappSearchRes, readDappByChainId, readDappByNameId, readDappByNameIdAndChainId } from "./db/prisma/dapps";
import _exports from "@axelar-network/axelarjs-sdk/dist/src/utils/wallet";
import { addAddress } from "./db/prisma/users";
import { createSimUser, KeyPair } from "./createSimUser";
import { getToken, Token } from "../registry/tokens";
import { getDappInfoFromGPT } from "./gpt/gpt";
import { postPin, readPinByMasterKey } from "./db/prisma/pin";
import { postLike, readLikeByDappid, readLikeInfo } from "./db/prisma/like";
import { postComment, readCommentByDappId } from "./db/prisma/comment";
dotenv.config();

// For parse post.body
var bodyParser = require('body-parser')
// Initialize the express engine
const app: express.Application = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// Add cors
app.use(cors());

// Take a port for running server.
const port = process.env.PORT || 7777;
console.log("port: ", port);

// Handling '/' Request
app.get("/", (_req, _res) => {
  _res.send("TypeScript With Express");
});

// JSON.stringify
app.get("/route", async (_req: Request<{}, {}, {}, RouteReq>, _res) => {
  try {
    const { query: routeReq } = _req;
    console.log(routeReq);
    const sourceChainId = Number(routeReq.sourceChainId)
    const sourceChainTokenSymbol = routeReq.sourceChainTokenSymbol;
    const sourceChainTokenAmount = BigNumber.from(
      routeReq.sourceChainTokenAmount
    );
    const destinationChainAction = {
      dappNameId: routeReq.destinationChainDappNameId,
      functionSelector: routeReq.destinationChainFunctionSelector,
      args: routeReq.destinationChainArgs,
    };
    const destinationChainId = Number(routeReq.destinationChainId);
    const recipientAddress = routeReq.recipientAddress;
    const routeReturn : RouteReturn = await construct(
      sourceChainId,
      sourceChainTokenSymbol,
      sourceChainTokenAmount,
      destinationChainAction,
      destinationChainId,
      recipientAddress,
      routeReq.env
    );
    _res.json(routeReturn);
  } catch (error) {
    console.log(error);
    _res.status(500).send("something wrong on route construction");
  }
});

app.get(
  "/contract/",
  async (_req: Request<{}, {}, {}, ZipContractReq>, _res) => {
    try {
      const { query } = _req;
      _res.json(getContractInfo(Number(query.chainId),  query.env));
    }catch (error) {
      console.log(error);
      _res.status(500).send("fail to fetch contract info");
    }
  }
);

app.get(
  "/txStatus/",
  async (_req: Request<{}, {}, {}, ZipTxStatustReq>, _res: Response<any>) => {
    try {
      const { query } = _req;
      _res.json(await getTransactionStatus(query.txHash, Number(query.chainId)));
    }catch (error){
      console.log(error);
      _res.status(500).send("fail to get tx status");
    }
    
  }
);

// Customized by userid once authentication is done
app.get(
  "/getRecommendedProtocols",
  async (_req: Request<{}, {}, {}, HomepageReq>, _res) => {
    try {
      const { query } = _req;
      if (!ethers.utils.isAddress(query.masterKey)){
        return _res.status(500).send("masterkey must be a valid evm address");
      }
      const homepageDapps = await getRecommendedProtocols(query.masterKey);
      _res.send(homepageDapps);
    }catch(error) {
      console.log(error);
      _res.status(500).send("error /getRecommendedProtocols");
    }
  }
);

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Get new protocols to display
app.get(
  "/getNewProtocols",
  async (_req: Request<{}, {}, {}, HomepageReq>, _res) => {
    try {
       // TODO: sort by time when more protocols are added, now it's all protocols
      // currently just return gmx
      const newDapps = await readDappByNameIdAndChainId("gmx", ChainID.Arbitrum);
      _res.send([newDapps]);
    }catch(error) {
      console.log(error);
      _res.status(500).send("error /getNewProtocols");
    }
   
  }
)

// Get token by symbol
app.get(
  "/getToken",
  async (_req: Request<{}, {}, {}, TokenReq>, _res) => {
    const { query } = _req;
    try {
      let token: Token;
      token = getToken(query.symbol, Number(query.chainId))!;
      if (!token) {
        return _res.status(404).send(`${query.symbol} on chain ${query.chainId} is not found`);
      }
      _res.json(token);
    }catch (error) {
      console.log(error);
      _res.status(500).send(`${query.symbol} on chain ${query.chainId} is not found`);
    }
  }
)

app.get("/getDappByNameId",
  async (_req: Request<{}, {}, {}, DappNameId>, _res) => {
    try {
      const { query } = _req;
      const dapp = await readDappByNameId(query.nameId);
      _res.json(dapp);
    }catch (error) {
      console.log(error);
      _res.status(500).send("something wrong fetch dapp info");
    }
  } 
)

app.get("/getDappByChainId",
  async (_req: Request<{}, {}, {}, DappChainId>, _res) => {
    try {
      const { query } = _req;
      const dapps = await readDappByChainId(Number(query.chainId), Number(query.n));
      _res.json(dapps);
    }catch (error) {
      console.log(error)
      _res.status(500).send("something wrong fetch dapp info");
    }
  } 
)

app.get("/searchDapps", 
async (_req: Request<{}, {}, {}, SearchQuery>, _res) => {
  try{
    const {query} = _req;
    _res.json(await getDappSearchRes(query.query));
  }catch (error) {
    _res.status(500).send("make a request for new dapp listing");
  };
  
});

app.get("/getGPTContent", 
  async (_req: Request<{}, {}, {}, DappNameId>, _res) => {
    try {
      const {query} = _req;
      _res.json(await getDappInfoFromGPT(query.nameId));
    }catch (error) {
      _res.status(500).send("gpt error");
    };
});

app.get("/getPinByMasterKey", async (_req: Request<{}, {}, {}, MasterKey>, _res) => {
  try {
    const {query} = _req;
    _res.json(await readPinByMasterKey(query.masterKey));
  }catch (error) {
    _res.status(500).send("get error");
  }
});

app.get("/getLikeByDappid", async (_req: Request<{}, {}, {}, DappId>, _res) => {
  try {
    const {query} = _req;
    _res.json(await readLikeByDappid(query.dappId));
  }catch (error) {
    _res.status(500).send("get error");
  }
});

app.get("/getCommentByDappId", async (_req: Request<{}, {}, {}, DappId>, _res) => {
  try {
    const {query} = _req;
    _res.json(await readCommentByDappId(query.dappId));
  }catch (error) {
    _res.status(500).send("get error");
  }
});

app.get("/getLikeInfo", async (_req: Request<{}, {}, {}, IdKey>, _res) => {
  try {
    const {query} = _req;
    _res.json(await readLikeInfo(query.dappId, query.masterKey));
  }catch (error) {
    _res.status(500).send("get error");
  }
});

app.post("/addAddress", async (_req, _res) => {
  try {
    let masterKey = _req.body.masterKey;
    let address = _req.body.address;
    await addAddress(masterKey, address);
    _res.json({"success": true, "masterKey": masterKey, "address": address});
  }catch (error){
    _res.status(500).send(error);
  }
});

// Create new key value pair on simulate ethereum and fund 1 eth to it
app.post("/createSimUser", async (_req, _res) => {
  let keyPair: KeyPair;
  try {
    keyPair = await createSimUser();
    _res.json(keyPair);
  }catch (error){
    console.log(error);
    _res.status(500).send(error);
  }
});

app.post("/pin", async (_req, _res) => {
  try {
    let dappId = _req.body.dappId;
    let masterKey = _req.body.userMasterKey;
    await postPin(dappId, masterKey);
    _res.json({"success": true, "masterKey": masterKey, "dappId": dappId});
  }catch (error){
    _res.status(500).send(error);
  }
});

app.post("/comment", async (_req, _res) => {
  try {
    let dappId = _req.body.dappId;
    let masterKey = _req.body.userMasterKey;
    let content = _req.body.content;
    await postComment(dappId, masterKey, content);
    _res.json({"success": true, "masterKey": masterKey, "dappId": dappId});
  }catch (error){
    _res.status(500).send(error);
  }
});

app.post("/like", async (_req, _res) => {
  try {
    let dappId = _req.body.dappId;
    let masterKey = _req.body.userMasterKey;
    await postLike(dappId, masterKey);
    _res.json({"success": true, "masterKey": masterKey, "dappId": dappId});
  }catch (error){
    _res.status(500).send(error);
  }
});

// Server setup
app.listen(port, () => {
  console.log(`TypeScript with Express
         http://localhost:${port}/`);
});