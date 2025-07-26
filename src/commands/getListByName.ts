import { shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"

export async function getListIdByName(db: LibSQLDatabase, list_name: string) {
    const list = await db
        .select()
        .from(shoppingLists)
        .where(eq(shoppingLists.list_name, list_name))

    if (!list[0]) {
        return null
    }

    return list[0].list_id
}
