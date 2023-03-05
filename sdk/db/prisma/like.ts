import assert from "assert";
import prisma from "./client";
import type { like } from '@prisma/client'
import { Count, LikeInfo } from "./interfaces";
export async function postLike(dapp_id: number, user_key: string) {
    const insertQuery = `INSERT INTO public.like (dapp_id, user_id) VALUES (${dapp_id}, '${user_key}')`
    const result: number = await prisma.$executeRawUnsafe(insertQuery);
    assert(result==1, "insert fail");
}

export async function readLikeByDappid(dapp_id: number) : Promise<like[]> {
    const query = `select * from public.like where dapp_id = ${dapp_id}`;
    const result = await prisma.$queryRawUnsafe<like[]>(query);
    return result;
}

export async function readLikeInfo(dapp_id: number, master_key: string): Promise<LikeInfo> {
    const q1 = `select count(distinct(user_id)) from public.like where dapp_id = ${dapp_id}`;
    const res1 = await prisma.$queryRawUnsafe<Count[]>(q1);
    const q2 = `select count(*) from public.like where dapp_id = ${dapp_id} and user_id = '${master_key}'`;
    const res2 = await prisma.$queryRawUnsafe<Count[]>(q2);
    return {liked: res2[0].count > 0, numberOfLike: res1[0].count}
}

if (require.main === module) {
    (async () => { 
        // await postLike(2, "0x3D71c08d432710123eaf8fC7278431518366A335");
    
    })();
}
