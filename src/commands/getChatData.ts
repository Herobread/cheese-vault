import { chatDatas } from "@/db/schema"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"
import { SQLiteTransaction } from "drizzle-orm/sqlite-core"

/**
 * Ensure that chat data exists for the given chat_id.
 */
export async function getChatData(
    db: LibSQLDatabase | SQLiteTransaction<any, any, any, any>,
    chat_id: number
) {
    let chatData = await db
        .select()
        .from(chatDatas)
        .where(eq(chatDatas.chat_id, chat_id))

    if (chatData.length === 1) {
        return chatData[0]
    }

    chatData = await db
        .insert(chatDatas)
        .values({ chat_id: chat_id, next_id: 1 })
        .returning()

    if (chatData.length === 1) {
        return chatData[0]
    }

    throw new Error("Failed to create chat data.")
}
