import { and, eq } from "drizzle-orm"
import { Context } from "telegraf"
import { db } from "../db/connection"
import { pinnedListMessages, ShoppingItem, shoppingTable } from "../db/schema"

export async function listItems(ctx: Context) {
    const chatId = ctx.message?.chat.id
    const { args } = ctx as any

    let isBlame = false

    if (
        args &&
        args.length > 0 &&
        args[0]?.toString().toLowerCase() === "blame"
    ) {
        isBlame = true
    }

    if (!chatId) {
        await ctx.reply("🔴 Error. Could not determine chat ID.")
        return
    }

    // Check if a message is already pinned
    const pinnedMessage = await db
        .select()
        .from(pinnedListMessages)
        .where(eq(pinnedListMessages.chat_id, chatId))
        .limit(1)
    if (pinnedMessage.length > 0) {
        ctx.unpinChatMessage(pinnedMessage[0].message_id)
        await db
            .delete(pinnedListMessages)
            .where(eq(pinnedListMessages.chat_id, chatId))

        console.log("Unpinned previous message:", pinnedMessage[0].message_id)
    }

    const items = await db
        .select()
        .from(shoppingTable)
        .where(
            and(
                eq(shoppingTable.chat_id, chatId),
                eq(shoppingTable.isComplete, false)
            )
        )

    const listMessage = generateListMessageText(items, isBlame)

    const message = await ctx.sendMessage(listMessage, {
        parse_mode: "Markdown",
    })

    try {
        await ctx.pinChatMessage(message.message_id)

        await db.insert(pinnedListMessages).values({
            chat_id: chatId,
            message_id: message.message_id,
            date: ctx.message.date,
        })
        console.log("Message pinned successfully:", message.message_id)
    } catch (error) {
        console.error("Error pinning message:", error)
        await ctx.reply("🔴 Error pinning message: check rights?")
        return
    }
}

function generateListMessageText(
    items: ShoppingItem[],
    isBlame: boolean
): string {
    let listMessage = "🗒 *Shopping list*\n\n"

    if (items.length === 0) {
        listMessage += "\n<empty>"
    }

    items.forEach((item) => {
        listMessage += `- ${item.name}`

        if (isBlame) {
            listMessage += ` [${generateUserName(item)}]\n`
        }

        listMessage += "\n"
    })

    return listMessage
}

function generateUserName(item: ShoppingItem) {
    if (item.user_username) {
        return `${item.user_username}`
    }

    if (item.user_last_name) {
        return `${item.user_first_name} ${item.user_last_name}`
    }

    return `${item.user_first_name}`
}

export async function updateListMessageContent(
    ctx: Context,
    chatId: number,
    messageId: number
) {
    const items = await db
        .select()
        .from(shoppingTable)
        .where(
            and(
                eq(shoppingTable.chat_id, chatId),
                eq(shoppingTable.isComplete, false)
            )
        )

    const listMessage = generateListMessageText(items, false)

    await ctx.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        listMessage,
        {
            parse_mode: "Markdown",
        }
    )
}
