import { getChatData } from "@/commands/getChatData"
import { db } from "@/db/connection"
import { chatDatas, shoppingItems, shoppingLists } from "@/db/schema"
import { logger } from "@/logger"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function getFormattedChatLists(
    db: LibSQLDatabase,
    chat_id: number
) {
    const allListsInChat = await db
        .select()
        .from(shoppingLists)
        .where(eq(shoppingLists.chat_id, chat_id))

    if (!allListsInChat.length) {
        return []
    }

    const allItemsInChat = await db
        .select()
        .from(shoppingItems)
        .where(eq(shoppingItems.chat_id, chat_id))

    const itemsByList: Record<
        number,
        {
            listName: string | null
            items: { itemId: number; itemName: string }[]
        }
    > = {}

    for (const list of allListsInChat) {
        itemsByList[list.list_id] = {
            listName: list.list_name,
            items: [],
        }
    }

    for (const item of allItemsInChat) {
        if (itemsByList[item.list_id]) {
            itemsByList[item.list_id].items.push({
                itemId: item.item_id,
                itemName: item.item_name,
            })
        }
    }

    return Object.entries(itemsByList).map(([listId, listData]) => ({
        name: listData.listName || `list_id[${listId}]`,
        items: listData.items,
    }))
}

function formatListsToString(
    lists: Awaited<ReturnType<typeof getFormattedChatLists>>
) {
    if (!lists.length) {
        return `🕸 Empty here\\.\\.\\.\n\nAdd stuff with \`/add\` \`<item>\` or reply to this message`
    }

    let formattedListsString = ""

    for (const list of lists) {
        formattedListsString += `🗒 *List*: \`${list.name}\`\n\n`

        if (list.items.length > 0) {
            list.items.forEach((item) => {
                formattedListsString += `\`${item.itemId}\` ${item.itemName}\n`
            })
        } else {
            formattedListsString += `_This list is empty_\\.\n`
        }

        formattedListsString += `\n\n`
    }
    return formattedListsString
}

async function sendAndPinMessage(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>,
    chat_id: number,
    text: string
) {
    const chatData = await db
        .select()
        .from(chatDatas)
        .where(eq(chatDatas.chat_id, chat_id))

    const wasMessagePinnedBefore = chatData[0] && chatData[0].pinned_message_id
    if (wasMessagePinnedBefore) {
        const lastPinnedMessageId = chatData[0].pinned_message_id as number

        try {
            await ctx.unpinChatMessage(lastPinnedMessageId)
        } catch (error) {
            logger.error(
                `Could not unpin message in chat ${chat_id}. Maybe it was already unpinned or deleted.`
            )
        }

        await db
            .update(chatDatas)
            .set({ pinned_message_id: null })
            .where(eq(chatDatas.chat_id, chat_id))
    }

    const message = await ctx.sendMessage(text, { parse_mode: "MarkdownV2" })
    const pinned_message_id = message.message_id

    try {
        await ctx.pinChatMessage(pinned_message_id, {
            disable_notification: true,
        })

        await db
            .update(chatDatas)
            .set({ pinned_message_id })
            .where(eq(chatDatas.chat_id, chat_id))
    } catch (error) {
        await ctx.sendMessage(
            "😩 I have no rights to pin message, gimmie admin pls"
        )
    }
}

export function trimMessageAndAddInfo(message: string) {
    const TELEGRAM_MAX_MESSAGE_LENGTH = 4096

    if (message.length > TELEGRAM_MAX_MESSAGE_LENGTH) {
        const OVERFLOW_TEXT = "\\.\\.\\.\n\nList is too long for telegram!"

        message = message.slice(
            0,
            TELEGRAM_MAX_MESSAGE_LENGTH - OVERFLOW_TEXT.length - 1
        )
        message += OVERFLOW_TEXT

        return {
            trimmed: true,
            message,
        }
    }

    return {
        trimmed: false,
        message,
    }
}

export async function listCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

    const lists = await getFormattedChatLists(db, chat_id)

    let formattedListsString = formatListsToString(lists)

    const { message: trimmedList, trimmed } =
        trimMessageAndAddInfo(formattedListsString)

    if (trimmed) {
        logger.warn(`Message is too long to send in chat ${chat_id}`)
    }

    await sendAndPinMessage(ctx, chat_id, trimmedList)
}

export async function updatePinnedMessageContent(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>,
    db: LibSQLDatabase,
    chat_id: number
) {
    const lists = await getFormattedChatLists(db, chat_id)

    if (!lists.length) {
        return
    }

    const formattedListsString = formatListsToString(lists)

    const { pinned_message_id } = await getChatData(db, chat_id)

    if (!pinned_message_id) {
        return
    }

    try {
        await ctx.telegram.editMessageText(
            chat_id,
            pinned_message_id,
            undefined,
            formattedListsString,
            {
                parse_mode: "MarkdownV2",
            }
        )
    } catch (error) {
        logger.error(
            `Failed to update pinned message in chat ${chat_id}:`,
            error
        )
    }
}
