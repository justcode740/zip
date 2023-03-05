import { ethers } from "ethers";


(async function test() {
    const provider = new ethers.providers.JsonRpcProvider(" https://9a36-3-87-129-32.ngrok.io/0");
    console.log((await provider.getBalance("0x3D71c08d432710123eaf8fC7278431518366A335")).toString());
})();