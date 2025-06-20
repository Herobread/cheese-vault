import { and, eq } from "drizzle-orm"
import { Context } from "telegraf"
import { db, lower } from "../db/connection"
import { pinnedListMessages, shoppingTable } from "../db/schema"
import { updateListMessageContent } from "./listItems"

export async function deleteItem(ctx: Context) {
    const { args } = ctx as any

    if (!args || args.length === 0) {
        await ctx.reply(`🔴 Please provide the name of the item to delete.`)
        return
    }

    const chat = ctx.chat
    const from = ctx.from
    const date = ctx.message?.date || Math.floor(Date.now() / 1000)

    if (!chat?.id || !from?.id || !from?.first_name) {
        await ctx.reply("🔴 Missing chat or user information.")
        return
    }

    const itemName = args.join(" ")

    const result = await db
        .delete(shoppingTable)
        .where(
            and(
                eq(shoppingTable.chat_id, chat.id),
                eq(shoppingTable.user_id, from.id),
                eq(lower(shoppingTable.name), itemName.toLowerCase())
            )
        )

    if (result.rowsAffected === 0) {
        await ctx.react("🤨")
        return
    }

    await ctx.react("👌")

    const pinnedMessage = await db
        .select()
        .from(pinnedListMessages)
        .where(eq(pinnedListMessages.chat_id, chat.id))
    const pinnedMessageId = pinnedMessage[0]?.message_id

    await updateListMessageContent(ctx, chat.id, pinnedMessageId)
}
