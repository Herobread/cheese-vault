import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import {
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
 * Handles the add item command.
 *
 * @param ctx The context of the command.
 */
export async function addItemCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    let { args } = parseCommand(ctx.message.text)

    if (args.length == 0) {
        ctx.sendMessage("No idea what to add, pls type smth after add.")

        return
    }

    const chat_id = ctx.chat.id

    const { list_id, rest } = await extractListIdFromArgs(db, args, chat_id)
    const itemNames = rest

    const items: InsertableShoppingItem[] = itemNames.map((item_name) => {
        return {
            item_name,
            list_id,
        }
    })

    await addItems(items)

    ctx.sendMessage(`Adding ${JSON.stringify(items)}`)
}

/**
 * Adds multiple items to the shopping list.
 *
 * @param items An array of items to be added to the shopping list.
 * @returns The result of the database insertion.
 */
export async function addItems(items: InsertableShoppingItem[]) {
    return await db.insert(shoppingItems).values(items)
}
