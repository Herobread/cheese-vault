import { db } from "@/db/connection"
import { shoppingItems, shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export function generateListMessage() {}

export async function listCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

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

    if (!itemsWithLists.length) {
        return ctx.sendMessage("You have no items in your shopping lists.")
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

    let formattedListsString = "Items:\n"

    for (const listId in itemsByList) {
        const list = itemsByList[listId]
        const listName = list.listName || `List ${listId}`
        formattedListsString += `\n--- ${listName} ---\n`

        list.items.forEach((item) => {
            formattedListsString += `[${item.itemId}] ${item.itemName}\n`
        })
    }

    ctx.sendMessage(formattedListsString)
}
