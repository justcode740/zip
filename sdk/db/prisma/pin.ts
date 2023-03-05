import { dapp, dapp_pin } from "@prisma/client";
import assert from "assert";
import prisma from "./client";

export async function postPin(dapp_id: number, user_master_key: string) {
    const insertQuery = `INSERT INTO public.dapp_pin (user_master_key, dapp_id) VALUES ('${user_master_key}', ${dapp_id})`
    const result: number = await prisma.$executeRawUnsafe(insertQuery);
    assert(result==1, "insert fail");
}

export async function readPinByDappId(dapp_id: number) : Promise<dapp_pin[]> {
    const query = `select * from public.dapp_pin where dapp_id = ${dapp_id}`;
    const result = await prisma.$queryRawUnsafe<dapp_pin[]>(query);
    return result;
}

export async function readPinByMasterKey(user_master_key: string) : Promise<dapp[]> {
    const query = `select * from public.dapp as dapp join (select * from public.dapp_pin where user_master_key='${user_master_key}') as dapp_pin on dapp.dapp_id = dapp_pin.dapp_id;`;
    const result = await prisma.$queryRawUnsafe<dapp[]>(query);
    return result;
}

if (require.main === module) {
    (async () => { 
        // await postPin(2, "0x3D71c08d432710123eaf8fC7278431518366A335");
        // console.log(await readPinByDappId(2));
        console.log(await readPinByMasterKey("0x3D71c08d432710123eaf8fC7278431518366A335"));
    })();
}
