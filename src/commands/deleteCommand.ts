import { getListIdByName } from "@/commands/getListByName"
import { updatePinnedMessageContent } from "@/commands/listCommand"
import { parseCommand } from "@/commands/parser"
import { getRandomPositiveReactionEmoji } from "@/commands/reaction"
import { db } from "@/db/connection"
import { shoppingItems, shoppingLists } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function deleteCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

    const { args } = parseCommand(ctx.message.text)

    // parseCommand splits args by comma, but not by space
    const joinedArgs = args.join(" ")
    const ids = joinedArgs.split(" ")

    if (ids.length == 0) {
        await ctx.react("🤨")
        return
    }

    let totalAffectedRows = 0

    for (const id of ids) {
        if (!id) continue

        const isListId = isNaN(Number(id))

        if (isListId) {
            const list_id = await getListIdByName(db, id, chat_id)

            if (!list_id) {
                continue
            }

            totalAffectedRows += await deleteListById(db, list_id, chat_id)
        } else {
            const result = await deleteItem(db, Number(id), chat_id)
            totalAffectedRows += result.rowsAffected
        }
    }

    if (totalAffectedRows > 0) {
        ctx.react(getRandomPositiveReactionEmoji())
    } else {
        ctx.react("🤨")
    }

    updatePinnedMessageContent(ctx, db, chat_id)
}

export async function deleteListById(
    db: LibSQLDatabase,
    list_id: number,
    chat_id: number
): Promise<number> {
    // delete list content first
    const itemsResult = await db
        .delete(shoppingItems)
        .where(
            and(
                eq(shoppingItems.list_id, list_id),
                eq(shoppingItems.chat_id, chat_id)
            )
        )

    // then delete the list entry
    const listResult = await db
        .delete(shoppingLists)
        .where(
            and(
                eq(shoppingLists.list_id, list_id),
                eq(shoppingLists.chat_id, chat_id)
            )
        )
    return itemsResult.rowsAffected + listResult.rowsAffected
}

export async function deleteItem(
    db: LibSQLDatabase,
    item_id: number,
    chat_id: number
) {
    // Directly delete the item using its ID and the chat ID
    return await db
        .delete(shoppingItems)
        .where(
            and(
                eq(shoppingItems.item_id, item_id),
                eq(shoppingItems.chat_id, chat_id)
            )
        )
}
