import { updatePinnedMessageContent } from "@/commands/listCommand"
import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import { shoppingLists } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function addListCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const { args } = parseCommand(ctx.message.text)

    if (args.length === 0) {
        await ctx.reply("Please provide a name for the list.")
        return
    }

    const potentialName = args.join(" ")
    let list_name: string
    if (/^\d+$/.test(potentialName) && args.length === 1) {
        list_name = `list-${potentialName}`
    } else {
        list_name = potentialName.replace(/ /g, "-").toLowerCase()
    }
    const chat_id = ctx.chat.id

    const existingList = await db
        .select()
        .from(shoppingLists)
        .where(
            and(
                eq(shoppingLists.chat_id, chat_id),
                eq(shoppingLists.list_name, list_name)
            )
        )
        .limit(1)

    if (existingList.length > 0) {
        await ctx.reply(`No\\, list \`${list_name}\` already exists\\.`, {
            parse_mode: "MarkdownV2",
        })
        return
    }

    await db.insert(shoppingLists).values({
        chat_id,
        list_name,
    })

    await updatePinnedMessageContent(ctx, db, chat_id)

    await ctx.sendMessage(`✅ Added list ${list_name}`)
}
