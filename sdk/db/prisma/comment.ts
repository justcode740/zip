import assert from "assert";
import prisma from "./client";
import type { comment } from '@prisma/client'

export async function postComment(dapp_id: number, user_master_key: string, content: string) {
    const insertQuery = `INSERT INTO public.comment (dapp_id, user_master_key, content) VALUES (${dapp_id}, '${user_master_key}', '${content}')`
    const result: number = await prisma.$executeRawUnsafe(insertQuery);
    assert(result==1, "insert fail");
}

export async function readCommentByDappId(dapp_id: number) : Promise<comment[]> {
   const query = `select * from public.comment where dapp_id = ${dapp_id}`;
   const result = await prisma.$queryRawUnsafe<comment[]>(query);
   return result;
}

export async function readCommentByMasterKey(master_key: string) : Promise<comment[]> {
    const query = `select * from public.comment where user_master_key = '${master_key}'`;
    const result = await prisma.$queryRawUnsafe<comment[]>(query);
    return result;
 }
 

if (require.main === module) {
    (async () => {
        await postComment(2, "0x3D71c08d432710123eaf8fC7278431518366A335","gmx is prob best, cleanest and most transparent tokenomics i have ever seen");
        // console.log(await readCommentByDappId(2));
        // console.log(await readCommentByMasterKey("0x3D71c08d432710123eaf8fC7278431518366A335"));

        
    })();
}