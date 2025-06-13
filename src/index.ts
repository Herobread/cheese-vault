import "dotenv/config"
import { Telegraf } from "telegraf"
import { db } from "./db/connection"
import { shoppingTable } from "./db/schema"

const token = process.env.TELEGRAM_API_KEY || ""

const bot = new Telegraf(token)

bot.command("echo", async (ctx) => {
    ctx.sendMessage(ctx.message.text)
})

bot.command("db", async (ctx) => {
    await db.insert(shoppingTable).values({ name: ctx.message.text })

    ctx.sendMessage("DB")
})

bot.command("get", async (ctx) => {
    const items = await db.select().from(shoppingTable)

    let listMessage = "Shopping list\n\n"

    listMessage += items
        .map((item) => {
            return item.name
        })
        .join("\n")

    ctx.sendMessage(listMessage)
})

bot.launch()

console.log("Bot active")

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
