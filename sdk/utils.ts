import { BigNumber, utils } from "ethers";

export class BigNumberUtils {
    protected static oneBN: BigNumber = utils.parseUnits("1", 18);
    
    public static multiply(
        bn: BigNumber | string,
        number: number,
    ): BigNumber {
        const bnForSure = BigNumber.from(bn);
        const numberBN = utils.parseUnits(number.toString(), 18);

        return bnForSure.mul(numberBN).div(this.oneBN);
    }

    public static divide(bn: BigNumber | string, number: number): BigNumber {
        const bnForSure = BigNumber.from(bn);
        const numberBN = utils.parseUnits(number.toString(), 18);

        return bnForSure.div(numberBN).div(this.oneBN);
    }
}