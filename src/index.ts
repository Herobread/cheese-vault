import { addCommandHandler } from "@/commands/addCommand"
import { addListCommandHandler } from "@/commands/addListCommand"
import { listCommandHandler } from "@/commands/listCommand"
import { listListsCommandHandler } from "@/commands/listListsCommand"
import "dotenv/config"
import { Telegraf } from "telegraf"
import { parseTestCommand } from "./commands/parserTestCommand"
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

bot.command("echo", (ctx) => {
    ctx.sendMessage(`You said: ${ctx.message.text.replace("/echo", "").trim()}`)
})

bot.command("args", (ctx) => {
    parseTestCommand(ctx)
})

bot.command("add", (ctx) => {
    addCommandHandler(ctx)
})

bot.command("list", (ctx) => {
    listCommandHandler(ctx)
})

bot.command("lists", (ctx) => {
    listListsCommandHandler(ctx)
})

bot.command("addlist", (ctx) => {
    addListCommandHandler(ctx)
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
