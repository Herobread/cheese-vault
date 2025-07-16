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

export async function addCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const { args } = parseCommand(ctx.message.text)

    const chat_id = ctx.chat.id

    // TODO: parse name of list, if given
    const targetListName = MAIN_LIST_IDENTIFIER

    ctx.sendMessage("User wants to add " + JSON.stringify(args))

    // check if list exists:

    const currentChatLists = await db
        .select()
        .from(shoppingLists)
        .where(
            and(
                eq(shoppingLists.chat_id, ctx.chat.id),
                eq(shoppingLists.list_name, targetListName)
            )
        )

    const listExists = currentChatLists.length > 0

    let list_id = null

    if (listExists) {
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

    // insert items in the list:

    const items: InsertableShoppingItem[] = args.map((arg) => {
        return {
            item_name: arg,
            list_id,
        }
    })

    await addItems(items)
}

export async function addItems(items: InsertableShoppingItem[]) {
    return await db.insert(shoppingItems).values(items)
}

export async function addItem(item: InsertableShoppingItem) {
    return await db.insert(shoppingItems).values([item])
}
