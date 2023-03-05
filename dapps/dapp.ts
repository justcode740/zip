import { CallData } from "../infra/swap-aggregation/execute";
// todo, all dapp needs to implement
abstract class Dapp {

    abstract buildTransaction() : CallData
}


export default Dapp;