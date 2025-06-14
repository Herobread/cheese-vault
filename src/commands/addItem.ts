import { and, eq, sql } from "drizzle-orm"
import { Context } from "telegraf"
import { db } from "../db/connection"
import { pinnedListMessages, shoppingTable } from "../db/schema"
import { updateListMessageContent } from "./listItems"

function capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

export async function addItem(ctx: Context, args: string[]) {
    if (!args || args.length === 0) {
        await ctx.reply(`🔴 Please provide the name of the item to add.`)
        return
    }

    const itemName = args.join(" ")

    const items = itemName
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .map((item) => capitalizeFirstLetter(item))

    const listMessage = await ctx.reply(`🟡 Adding ${items.join(", ")}...`)

    const chat = ctx.chat
    const from = ctx.from
    const date = ctx.message?.date || Math.floor(Date.now() / 1000)

    if (!chat?.id || !from?.id || !from?.first_name) {
        await ctx.reply("🔴 Missing chat or user information.")
        return
    }

    items.forEach(async (item) => {
        await db.insert(shoppingTable).values({
            name: item,
            chat_id: chat.id,
            user_id: from.id,
            user_first_name: from.first_name,
            user_last_name: from.last_name ?? null,
            user_username: from.username ?? null,
            date: date,
        })
    })

    const tempItemsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(shoppingTable)
        .where(
            and(
                eq(shoppingTable.chat_id, chat.id),
                eq(shoppingTable.isComplete, false)
            )
        )
    const totalItemCount = tempItemsCount[0]?.count ?? 0

    const pinnedMessage = await db
        .select()
        .from(pinnedListMessages)
        .where(eq(pinnedListMessages.chat_id, chat.id))
    const pinnedMessageId = pinnedMessage[0]?.message_id

    await updateListMessageContent(ctx, chat.id, pinnedMessageId)

    await ctx.telegram.editMessageText(
        listMessage.chat.id,
        listMessage.message_id,
        undefined,
        `🟢 Added *${itemName}*, (${totalItemCount} items total).`,
        {
            parse_mode: "Markdown",
        }
    )
}

export async function parseArgsAndAddItem(ctx: Context) {
    const { args } = ctx as any

    await addItem(ctx, args)
}
