import * as path from "path";
import * as fs from "fs";
import {parse} from "csv-parse";

// TODO, figure out how to read csv and assign to global 
// const csvFilePath = path.resolve(__dirname, './export-verified-contractaddress-opensource-license.csv');
  
// const headers = ["Txhash","ContractAddress","ContractName"];
// export type DappInfo = {
//     txhash: string;
//     address: string;
//     contractname: string;
// }
// var res: DappInfo[];
// const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
// var res : DappInfo[] = []
// function t(val: DappInfo[], addresses: string[]) : DappInfo[]{
//     res = val;
//     // console.log(res);
//     return res;
// }
// export function getDappInfos(addresses: string[]) : DappInfo[] {
//     parse(fileContent, {
//         delimiter: ',',
//         columns: headers,
//     }, (error, result: DappInfo[]) => {
//         if (error) {
//             console.error(error);
//         }
//         // console.log("Result", result);
//         return t(result)
//         // res = result;
//     });
//    return []
// }


// export default res;