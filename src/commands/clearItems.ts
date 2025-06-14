import { eq } from "drizzle-orm"
import { Context } from "telegraf"
import { db } from "../db/connection"
import { pinnedListMessages, shoppingTable } from "../db/schema"

export async function clearItems(ctx: Context) {
    const chatId = ctx.message?.chat.id

    if (!chatId) {
        await ctx.reply("🔴 Error. Could not determine chat ID.")
        return
    }

    await db
        .update(shoppingTable)
        .set({ isComplete: true })
        .where(eq(shoppingTable.chat_id, chatId))

    await db
        .delete(pinnedListMessages)
        .where(eq(pinnedListMessages.chat_id, chatId))

    ctx.reply("✅ Shopping list cleared.")
}
