import { addItemCommandHandler } from "@/commands/addItemCommand"
import { addListCommandHandler } from "@/commands/addListCommand"
import { deleteItemCommandHandler } from "@/commands/deleteItemCommand"
import { getChatData } from "@/commands/getChatData"
import { listCommandHandler } from "@/commands/listCommand"
import { listListsCommandHandler } from "@/commands/listListsCommand"
import { db } from "@/db/connection"
import "dotenv/config"
import { Telegraf } from "telegraf"
import { logger } from "./logger"

const token = process.env.TELEGRAM_API_KEY || ""

if (!token) {
    logger.error(
        "TELEGRAM_API_KEY is not set. Please add it to your .env file."
    )
    process.exit(1)
}

const bot = new Telegraf(token)

// Middleware:
// - ensure chat data exists for each update
// - log message
bot.use(async (ctx, next) => {
    if (ctx.chat?.id) {
        await getChatData(db, ctx.chat.id)
    } else {
        logger.warn(
            `Recieved update with no chat id. If first call: this might break chat data dependant features for this qeury. ${JSON.stringify(
                ctx.chat
            )}`
        )
    }

    logger.debug(`Update received in chat ${ctx.chat?.id}`, {
        update: ctx.update,
    })

    return next()
})

// delete items
bot.command("delete", deleteItemCommandHandler)
bot.command("del", deleteItemCommandHandler)

// items
bot.command("add", addItemCommandHandler)
bot.command("list", listCommandHandler)

// lists
bot.command("lists", listListsCommandHandler)
bot.command("addlist", addListCommandHandler)

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
