import { chatDatas } from "@/db/schema"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"

/**
 * Ensure that chat data exists for the given chat_id.
 */
export async function ensureChatData(db: LibSQLDatabase, chat_id: number) {
    const existing = await db
        .select()
        .from(chatDatas)
        .where(eq(chatDatas.chat_id, chat_id))

    if (existing.length === 0) {
        await db
            .insert(chatDatas)
            .values({ chat_id: chat_id, next_id: 1 })
            .run()
    }
}
