import "dotenv/config"
import { eq } from "drizzle-orm"
import { Telegraf } from "telegraf"
import { message } from "telegraf/filters"
import { addItem, parseArgsAndAddItem } from "./commands/addItem"
import { clearItems } from "./commands/clearItems"
import { listItems, updateListMessageContent } from "./commands/listItems"
import { db } from "./db/connection"
import { pinnedListMessages } from "./db/schema"

const token = process.env.TELEGRAM_API_KEY || ""

const bot = new Telegraf(token)

bot.use((ctx, next) => {
    console.log("Update received:", ctx.update)
    return next()
})

bot.command("add", parseArgsAndAddItem)
bot.command("list", listItems)
bot.command("clear", clearItems)

bot.on(message("text"), async (ctx) => {
    const chatId = ctx.message.chat.id
    const messageId = ctx.message.message_id
    const replyToMessageId = ctx.message.reply_to_message?.message_id

    const pinnedMessage = await db
        .select()
        .from(pinnedListMessages)
        .where(eq(pinnedListMessages.chat_id, chatId))
        .limit(1)

    console.log("Pinned message:", pinnedMessage)
    if (!pinnedMessage || pinnedMessage[0].message_id !== replyToMessageId) {
        return
    }

    const args = ctx.update.message.text.split(" ")

    await addItem(ctx, args)
})

bot.launch()

console.log("Bot active")

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
