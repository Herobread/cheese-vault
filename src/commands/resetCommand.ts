import { getChatData } from "@/commands/getChatData"
import { chatDatas, shoppingItems, shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import { LibSQLDatabase } from "drizzle-orm/libsql"
import { Context, Markup } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function resetChatData(db: LibSQLDatabase, chat_id: number) {
    await db.delete(shoppingItems).where(eq(shoppingItems.chat_id, chat_id))
    await db.delete(shoppingLists).where(eq(shoppingLists.chat_id, chat_id))
    await db
        .update(chatDatas)
        .set({
            next_id: 1,
            pinned_message_id: null,
        })
        .where(eq(chatDatas.chat_id, chat_id))
}

export async function resetChat(
    ctx: Context,
    db: LibSQLDatabase,
    chat_id: number
) {
    const chatData = await getChatData(db, chat_id)

    if (chatData.pinned_message_id) {
        await ctx.telegram.unpinChatMessage(chat_id, chatData.pinned_message_id)
    }

    await resetChatData(db, chat_id)
}

export async function resetCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    await ctx.reply(
        "Are you sure you want to reset all data for this chat? This action cannot be undone.",
        Markup.inlineKeyboard([
            Markup.button.callback("💥 Yes, reset everything", "reset_confirm"),
            Markup.button.callback("❌ Cancel", "reset_cancel"),
        ])
    )
}
