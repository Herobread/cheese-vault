import "dotenv/config"
import { eq } from "drizzle-orm"
import { Telegraf } from "telegraf"
import { message } from "telegraf/filters"
import { addItem, parseArgsAndAddItem } from "./commands/addItem"
import { clearItems } from "./commands/clearItems"
import { deleteItem } from "./commands/deleteItem"
import { listItems } from "./commands/listItems"
import { db } from "./db/connection"
import { pinnedListMessages } from "./db/schema"
import { logger } from "./logger"

const token = process.env.TELEGRAM_API_KEY || ""

if (!token) {
    logger.error(
        "TELEGRAM_API_KEY is not set. Please add it to your .env file."
    )
    process.exit(1)
}

const bot = new Telegraf(token)

bot.use((ctx, next) => {
    logger.debug(`Update received in chat ${ctx.chat?.id}`, {
        update: ctx.update,
    })
    return next()
})

bot.command("add", (ctx) => {
    logger.info(
        `'/add' command from user ${ctx.from.id} in chat ${ctx.chat.id}`
    )
    parseArgsAndAddItem(ctx)
})
bot.command("delete", (ctx) => {
    logger.info(
        `'/delete' command from user ${ctx.from.id} in chat ${ctx.chat.id}`
    )
    deleteItem(ctx)
})
bot.command("list", (ctx) => {
    logger.info(
        `'/list' command from user ${ctx.from.id} in chat ${ctx.chat.id}`
    )
    listItems(ctx)
})
bot.command("clear", (ctx) => {
    logger.info(
        `'/clear' command from user ${ctx.from.id} in chat ${ctx.chat.id}`
    )
    clearItems(ctx)
})
bot.command("start", (ctx) => {
    logger.info(
        `'/start' command from user ${ctx.from.id} in chat ${ctx.chat.id}`
    )
    ctx.reply(
        "Welcome! Use /add <item> to add items, /list to view items, and /clear to reset list."
    )
})

bot.on(message("text"), async (ctx) => {
    const chatId = ctx.message.chat.id
    const messageId = ctx.message.message_id
    const replyToMessageId = ctx.message.reply_to_message?.message_id
    const userId = ctx.from.id

    try {
        const pinnedMessage = await db
            .select()
            .from(pinnedListMessages)
            .where(eq(pinnedListMessages.chat_id, chatId))
            .limit(1)

        if (
            !pinnedMessage ||
            pinnedMessage[0].message_id !== replyToMessageId
        ) {
            return
        }

        logger.info(
            `Message from user ${userId} is a reply to the pinned list in chat ${chatId}. Adding item.`
        )
        const args = ctx.update.message.text.split(" ")

        await addItem(ctx, args)
    } catch (error) {
        // ignore errors if the message is not a reply to the pinned list
    }
})

bot.launch()
    .then(() => {
        logger.info("Bot active and listening for updates.")
    })
    .catch((err) => {
        logger.error("Failed to launch bot:", err)
        process.exit(1)
    })

process.once("SIGINT", () => {
    logger.info("SIGINT received. Stopping bot...")
    bot.stop("SIGINT")
})
process.once("SIGTERM", () => {
    logger.info("SIGTERM received. Stopping bot...")
    bot.stop("SIGTERM")
})
