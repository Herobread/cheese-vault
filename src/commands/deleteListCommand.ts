import { getListIdByName } from "@/commands/getListByName"
import { updatePinnedMessageContent } from "@/commands/listCommand"
import { parseCommand } from "@/commands/parser"
import { db } from "@/db/connection"
import { shoppingItems, shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function deleteListById(db: LibSQLDatabase, list_id: number) {
    // delete list entry
    await db.delete(shoppingLists).where(eq(shoppingLists.list_id, list_id))

    //delete list content
    await db.delete(shoppingItems).where(eq(shoppingItems.list_id, list_id))
}

export async function deleteListCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const chat_id = ctx.chat.id

    const { args } = parseCommand(ctx.message.text)

    if (!args[0]) {
        ctx.sendMessage("Pease give list name")
        return
    }

    const list_name = args[0]

    const list_id = await getListIdByName(db, list_name)

    if (list_id == null) {
        return
    }

    try {
        deleteListById(db, list_id)
        ctx.sendMessage(`🗑 Deleted list ${list_name}`)
    } catch (error) {
        ctx.sendMessage(`❌ Error deleting list ${list_name}\n\n\`${error}\``, {
            parse_mode: "MarkdownV2",
        })
    }

    await updatePinnedMessageContent(ctx, db, chat_id)
}
