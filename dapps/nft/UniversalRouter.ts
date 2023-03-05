import { CallData } from '../../infra/swap-aggregation/execute';
import Dapp from '../dapp'
class UniversalRouter extends Dapp {
    buildTransaction(): CallData {
        throw new Error('Method not implemented.');
    }
    
    
}

export default UniversalRouter;