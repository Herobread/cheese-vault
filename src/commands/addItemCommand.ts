import { getChatData } from "@/commands/getChatData"
import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import {
    chatDatas,
    InsertableShoppingItem,
    shoppingItems,
    shoppingLists,
} from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export const MAIN_LIST_IDENTIFIER = "main"

/**
 * Get main list id. This will create main list if doesn't exist.
 *
 * @param chat_id
 */
export async function getMainListId(db: LibSQLDatabase, chat_id: number) {
    const mainList = await db
        .select()
        .from(shoppingLists)
        .where(
            and(
                eq(shoppingLists.chat_id, chat_id),
                eq(shoppingLists.list_name, MAIN_LIST_IDENTIFIER)
            )
        )
        .limit(1)

    if (mainList[0]) {
        return mainList[0].list_id
    }

    const newMainList = await db
        .insert(shoppingLists)
        .values({
            chat_id,
            list_name: MAIN_LIST_IDENTIFIER,
        })
        .returning()

    return newMainList[0].list_id
}

/**
 * check if first word is name of the list, otherwise - use main list
 *
 * @returns { list_id: number, rest: string[] }
 * @param args The arguments passed to the command.
 * @param chat_id The ID of the chat where the command was issued.
 */
export async function extractListIdFromArgs(
    db: LibSQLDatabase,
    args: string[],
    chat_id: number
) {
    if (args.length === 0) {
        return {
            list_id: 0,
            rest: [],
        }
    }

    const potentialTargetListName = args[0].replace(/\s+/g, " ").split(" ")[0]

    // only 1 item given - just add to main list
    if (args[0].split(" ").length <= 1) {
        return {
            list_id: await getMainListId(db, chat_id),
            rest: args,
        }
    }

    const potentialList = await db
        .select()
        .from(shoppingLists)
        .where(
            and(
                eq(shoppingLists.chat_id, chat_id),
                eq(shoppingLists.list_name, potentialTargetListName)
            )
        )

    if (potentialList[0]) {
        const newFirstArg = args[0].split(" ").slice(1).join(" ")
        const newArgs = [newFirstArg, ...args.slice(1)]

        return {
            list_id: potentialList[0].list_id,
            rest: newArgs,
        }
    } else {
        return {
            list_id: await getMainListId(db, chat_id),
            rest: args,
        }
    }
}

/**
 * Main logic for adding items to a shopping list.
 *
 * @param messageText The text of the message.
 * @param chat_id The ID of the chat where the command was issued.
 * @returns The items that were added.
 */
export async function handleAddItemCommand(
    db: LibSQLDatabase,
    messageText: string,
    chat_id: number
) {
    const { args } = parseCommand(messageText)

    if (args.length == 0) {
        return []
    }

    const { list_id, rest } = await extractListIdFromArgs(db, args, chat_id)
    const itemNames = rest

    const items: SimpleShoppingItem[] = itemNames.map((name) => {
        return {
            item_name: name,
        }
    })

    return await addItems(db, items, chat_id, list_id)
}

/**
 * Handles the add item command.
 *
 * @param ctx The context of the command.
 */
export async function addItemCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id
    const items = await handleAddItemCommand(db, ctx.message.text, chat_id)

    if (!items) {
        ctx.sendMessage("No idea what to add, pls type smth after add.")
        return
    }

    ctx.sendMessage(`Adding ${JSON.stringify(items)}`)
}

type SimpleShoppingItem = {
    item_name: string
}

/**
 * Adds multiple items to the shopping list.
 *
 * @param items An array of items to be added to the shopping list.
 * @returns The result of the database insertion.
 */
export async function addItems(
    db: LibSQLDatabase,
    items: SimpleShoppingItem[],
    chat_id: number,
    list_id: number
) {
    if (items.length === 0) {
        return []
    }

    return await db.transaction(async (tx) => {
        const { next_id } = await getChatData(tx, chat_id)

        const itemsWithId: InsertableShoppingItem[] = items.map(
            (item, index) => ({
                item_id: next_id + index,
                item_name: item.item_name,
                list_id,
            })
        )

        const new_next_id = next_id + items.length

        await tx
            .update(chatDatas)
            .set({ next_id: new_next_id })
            .where(eq(chatDatas.chat_id, chat_id))

        return await tx.insert(shoppingItems).values(itemsWithId).returning()
    })
}
