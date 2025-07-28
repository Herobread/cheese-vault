import { generateListId } from "@/commands/addListCommand"
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

export async function renameItemCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

    const { args } = parseCommand(ctx.message.text)

    const joinedArgs = args.join(" ")

    const firstSpaceIndex = joinedArgs.indexOf(" ")
    const id = joinedArgs.substring(0, firstSpaceIndex)
    const newName = joinedArgs.substring(firstSpaceIndex + 1)

    if (!id || !newName) {
        ctx.react("🤨")
        return
    }

    const updated = await renameItemOrList(db, chat_id, id, newName)
    if (updated) {
        ctx.react(getRandomPositiveReactionEmoji())
        updatePinnedMessageContent(ctx, db, chat_id)
    } else {
        ctx.react("🤷")
    }
}

async function renameItemOrList(
    db: LibSQLDatabase,
    chat_id: number,
    id: number | string,
    newName: string
): Promise<boolean> {
    const isListId = isNaN(Number(id))

    if (isListId) {
        return await renameList(db, chat_id, id as string, newName)
    } else {
        return await renameItem(db, chat_id, Number(id), newName)
    }
}

async function renameItem(
    db: LibSQLDatabase,
    chat_id: number,
    item_id: number,
    newName: string
): Promise<boolean> {
    const result = await db
        .update(shoppingItems)
        .set({ item_name: newName })
        .where(
            and(
                eq(shoppingItems.chat_id, chat_id),
                eq(shoppingItems.item_id, item_id)
            )
        )
    return result.rowsAffected > 0
}

async function renameList(
    db: LibSQLDatabase,
    chat_id: number,
    list_id: string,
    newName: string
): Promise<boolean> {
    newName = generateListId(newName)

    const sameNameList = await getListIdByName(db, newName, chat_id)

    if (sameNameList) {
        return false
    }

    const result = await db
        .update(shoppingLists)
        .set({ list_name: newName })
        .where(
            and(
                eq(shoppingLists.chat_id, chat_id),
                eq(shoppingLists.list_name, list_id)
            )
        )
    return result.rowsAffected > 0
}
