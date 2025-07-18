import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import { shoppingItems, shoppingLists } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function deleteItem(
    db: LibSQLDatabase,
    item_id: number,
    chat_id: number
) {
    const targetList = await db
        .select({ list_id: shoppingLists.list_id })
        .from(shoppingLists)
        .where(eq(shoppingLists.chat_id, chat_id))
        .get()

    if (!targetList) return

    return await db
        .delete(shoppingItems)
        .where(
            and(
                eq(shoppingItems.item_id, item_id),
                eq(shoppingItems.list_id, targetList.list_id)
            )
        )
        .run()
}

// export async function deleteItemUid(db: LibSQLDatabase, uid: number) {
//     return await db.delete(shoppingItems).where(eq(shoppingItems.uid, uid))
// }

export async function deleteItemCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

    const { args } = parseCommand(ctx.message.text)

    if (!args[0]) {
        ctx.sendMessage("No id given")
        return
    }

    const itemId = Number(args[0])
    if (isNaN(itemId)) {
        ctx.sendMessage("Invalid id: please provide a number")
        return
    }

    await deleteItem(db, itemId, chat_id)

    ctx.sendMessage("Maybe deleted")
}
