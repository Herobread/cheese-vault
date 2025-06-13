import { eq } from "drizzle-orm"
import { Context } from "telegraf"
import { db } from "../db/connection"
import { shoppingTable } from "../db/schema"

export async function listItems(ctx: Context) {
    const chatId = ctx.message?.chat.id

    if (!chatId) {
        await ctx.reply("🔴 Error. Could not determine chat ID.")
        return
    }

    const items = await db
        .select()
        .from(shoppingTable)
        .where(eq(shoppingTable.chat_id, chatId))

    let listMessage = "Shopping list\n\n"

    listMessage += items.map((item) => item.name).join("\n")

    ctx.sendMessage(listMessage)
}
