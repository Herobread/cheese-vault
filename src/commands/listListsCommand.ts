import { db } from "@/db/connection"
import { shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function listListsCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

    const currentChatLists = await db
        .select()
        .from(shoppingLists)
        .where(eq(shoppingLists.chat_id, chat_id))

    ctx.sendMessage(JSON.stringify(currentChatLists))
}
