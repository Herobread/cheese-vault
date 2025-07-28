import { shoppingLists } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"

export async function getListIdByName(
    db: LibSQLDatabase,
    list_name: string,
    chat_id: number
) {
    const list = await db
        .select()
        .from(shoppingLists)
        .where(
            and(
                eq(shoppingLists.chat_id, chat_id),
                eq(shoppingLists.list_name, list_name)
            )
        )

    if (!list[0]) {
        return null
    }

    return list[0].list_id
}
