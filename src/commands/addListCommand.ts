import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import { shoppingLists } from "@/db/schema"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function addListCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const { args } = parseCommand(ctx.message.text)

    const list_name = args.join("-").replace(/ /g, "-").toLowerCase()
    const chat_id = ctx.chat.id

    await db.insert(shoppingLists).values({
        chat_id,
        list_name,
    })

    ctx.sendMessage(`✅ Added list ${list_name}`)
}
