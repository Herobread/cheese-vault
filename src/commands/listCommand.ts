import { db } from "@/db/connection"
import { chatDatas, shoppingItems, shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function getFormattedChatLists(
    db: LibSQLDatabase,
    chat_id: number
) {
    const itemsWithLists = await db
        .select({
            itemId: shoppingItems.item_id,
            itemName: shoppingItems.item_name,
            listId: shoppingItems.list_id,
            listName: shoppingLists.list_name,
        })
        .from(shoppingItems)
        .leftJoin(
            shoppingLists,
            eq(shoppingItems.list_id, shoppingLists.list_id)
        )
        .where(eq(shoppingLists.chat_id, chat_id))

    if (!itemsWithLists.length) {
        return []
    }

    const itemsByList: Record<
        number,
        {
            listName: string | null
            items: { itemId: number; itemName: string }[]
        }
    > = {}

    for (const item of itemsWithLists) {
        if (!itemsByList[item.listId]) {
            itemsByList[item.listId] = {
                listName: item.listName,
                items: [],
            }
        }
        itemsByList[item.listId].items.push({
            itemId: item.itemId,
            itemName: item.itemName,
        })
    }

    return Object.entries(itemsByList).map(([listId, listData]) => ({
        name: listData.listName || `List ${listId}`,
        items: listData.items,
    }))
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
            console.error(
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

export async function listCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

    const lists = await getFormattedChatLists(db, chat_id)

    if (!lists.length) {
        return ctx.sendMessage("You have no items in your shopping lists.")
    }

    let formattedListsString = ""

    for (const list of lists) {
        formattedListsString += `🗒 List: \`${list.name}\`\n\n`

        list.items.forEach((item) => {
            formattedListsString += `\`${item.itemId}\` ${item.itemName}\n`
        })

        formattedListsString += `\n\n`
    }

    await sendAndPinMessage(ctx, chat_id, formattedListsString)
}
