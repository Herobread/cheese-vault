import { chatDatas } from "@/db/schema"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"

export async function getChatData(db: LibSQLDatabase, chat_id: number) {
    return await db
        .select()
        .from(chatDatas)
        .where(eq(chatDatas.chat_id, chat_id))
}
