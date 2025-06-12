import "dotenv/config"
import { Telegraf } from "telegraf"

const token = process.env.TELEGRAM_API_KEY || ""

const bot = new Telegraf(token)

bot.command("echo", async (ctx) => {
    ctx.sendMessage(ctx.message.text)
})

bot.launch()

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
