import { assert } from "console";
import  prisma  from "./client"
import { Count } from "./interfaces";

// Add an address 
// If user exists, add a new address to exisitng masterKey
// If user doesn't exist, create a new record
export async function addAddress(masterKey: string, address: string) {
    const existQuery = `select count(*) from public.user where master_key = '${masterKey}'`;
    const result = await prisma.$queryRawUnsafe<Count[]>(existQuery);
    console.log(result[0].count);
    if (result[0].count != 0) {
         // if user already exist, append
        const updateQuery = `UPDATE public.user SET all_keys = array_append(all_keys, '${address}') WHERE public.user.master_key = '${masterKey}'`;
        console.log(updateQuery);
        const result: number =
        await prisma.$executeRawUnsafe(updateQuery);
        assert!(result==1, "update fail");
    }else{
        // create new row
        assert!(masterKey == address, "new user's first address is set as masterKey");
        const insertQuery = `INSERT INTO public.user (master_key, all_keys) VALUES ('${masterKey}', '{"${address}"}')`;
        console.log(insertQuery)
        const result: number = await prisma.$executeRawUnsafe(insertQuery);
        assert!(result==1, "insert fail");
    }
}

if (require.main === module) {
    (async () => {
        // await addAddress("0", "0")
        await addAddress("0x3D71c08d432710123eaf8fC7278431518366A335", "0x3D71c08d432710123eaf8fC7278431518366A335")
    
    })();
}
