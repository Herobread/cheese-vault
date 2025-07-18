import { chatData } from "@/db/schema"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"

/**
 * Ensure that chat data exists for the given chat_id.
 */
export async function ensureChatData(db: LibSQLDatabase, chat_id: number) {
    const existing = await db
        .select()
        .from(chatData)
        .where(eq(chatData.chat_id, chat_id))

    if (!existing) {
        await db.insert(chatData).values({ chat_id, next_id: 1 })
    }
}
