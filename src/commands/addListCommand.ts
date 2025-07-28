import { updatePinnedMessageContent } from "@/commands/listCommand"
import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import { shoppingLists } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export function generateListId(potentialName: string): string {
    // Check if the name is a single numeric word
    if (/^\d+$/.test(potentialName)) {
        return `list-${potentialName}`
    }
    return potentialName.replace(/ /g, "-").toLowerCase()
}

export async function addListCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const { args } = parseCommand(ctx.message.text)

    if (args.length === 0) {
        await ctx.reply("Please provide a name for the list.")
        return
    }

    const list_name = generateListId(args.join(" "))
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
