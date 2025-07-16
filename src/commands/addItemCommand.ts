import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import {
    InsertableShoppingItem,
    shoppingItems,
    shoppingLists,
} from "@/db/schema"
import { eq } from "drizzle-orm"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export const MAIN_LIST_IDENTIFIER = "main"

export async function addItemCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const { args } = parseCommand(ctx.message.text)

    const chat_id = ctx.chat.id

    // TODO: parse name of list, if given
    // assume target is primary list
    let targetListName = MAIN_LIST_IDENTIFIER
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

    let listExists = false
    let list_id = null

    // first arg is name of some list
    if (targetList) {
        listExists = true
        list_id = targetList.list_id

        args[0] = args[0].split(" ").slice(1).join(" ")
    } else {
        // check if main list exists:
        targetList = currentChatLists.find(
            (list) => list.list_name === MAIN_LIST_IDENTIFIER
        )

        // if not - create:
        const mainListExists = !!targetList
        if (mainListExists) {
            list_id = currentChatLists[0].list_id
        } else {
            // create primary list
            const primaryList = await db
                .insert(shoppingLists)
                .values({
                    chat_id,
                    list_name: targetListName,
                })
                .returning()

            list_id = primaryList[0].list_id
        }
    }

    // const listExists = currentChatLists.length > 0

    // insert items in the list:

    const items: InsertableShoppingItem[] = args.map((arg) => {
        return {
            item_name: arg,
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
