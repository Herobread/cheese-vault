import { db } from "@/db/connection"
import { shoppingItems } from "@/db/schema"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export function generateListMessage() {}

export async function listCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

    const items = await db.select().from(shoppingItems)

    ctx.sendMessage(JSON.stringify(items))
}
