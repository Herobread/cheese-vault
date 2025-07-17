import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import {
    InsertableShoppingItem,
    shoppingItems,
    shoppingLists,
} from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export const MAIN_LIST_IDENTIFIER = "main"

/**
 * Get main list id. This will create main list if doesn't exist.
 *
 * @param chat_id
 */
export async function getMainListId(chat_id: number) {
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
export async function extractListIdFromArgs(args: string[], chat_id: number) {
    // TODO: parse name of list, if given
    // assume target is primary list
    const potentialTargetListName = args[0].split(" ")[0]

    // check if list exists:

    // if there is list with name MAIN_LIST_IDENTIFIER - use it, if not - check if second arg is in db, if not - create MAIN_LIST_IDENTIFIER list
    const currentChatLists = await db
        .select()
        .from(shoppingLists)
        .where(eq(shoppingLists.chat_id, chat_id))

    // check if first argument
    let targetList = currentChatLists.find(
        (list) => list.list_name === potentialTargetListName
    )

    // ignore list selection and just add item, if its just 1 word
    if (args[0].split(" ").length <= 1) {
        targetList = undefined
    }

    let listExists = false
    let list_id: number = -1

    // first arg is name of some list
    if (targetList) {
        listExists = true
        list_id = targetList.list_id

        args[0] = args[0].split(" ").slice(1).join(" ")
    } else {
        list_id = await getMainListId(chat_id)
    }

    return {
        list_id,
        rest: args,
    }
}

export async function addItemCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    let { args } = parseCommand(ctx.message.text)

    const chat_id = ctx.chat.id

    const { list_id, rest } = await extractListIdFromArgs(args, chat_id)
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

export async function addItems(items: InsertableShoppingItem[]) {
    return await db.insert(shoppingItems).values(items)
}

export async function addItem(item: InsertableShoppingItem) {
    return await db.insert(shoppingItems).values([item])
}
