import "dotenv/config"
import { Telegraf } from "telegraf"
import { addItem } from "./commands/addItem"
import { listItems } from "./commands/listItems"
import { db } from "./db/connection"
import { shoppingTable } from "./db/schema"

const token = process.env.TELEGRAM_API_KEY || ""

const bot = new Telegraf(token)

bot.command("add", addItem)
bot.command("list", listItems)

bot.command("all", async (ctx) => {
    const all = await db.select().from(shoppingTable)

    ctx.sendMessage(JSON.stringify(all))
})

bot.command("dump", async (ctx) => {
    console.log(ctx)
    console.log(ctx.update.message.chat)
    console.log(ctx.update.message.from)
})

bot.launch()

console.log("Bot active")

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
