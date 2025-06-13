import "dotenv/config"
import { eq } from "drizzle-orm"
import { Telegraf } from "telegraf"
import { addItem } from "./commands/addItem"
import { db } from "./db/connection"
import { shoppingTable } from "./db/schema"

const token = process.env.TELEGRAM_API_KEY || ""

const bot = new Telegraf(token)

bot.command("add", addItem)

bot.command("list", async (ctx) => {
    const chatId = ctx.update.message.chat.id

    const items = await db
        .select()
        .from(shoppingTable)
        .where(eq(shoppingTable.chat_id, chatId))

    let listMessage = "Shopping list\n\n"

    listMessage += items
        .map((item) => {
            return item.name
        })
        .join("\n")

    ctx.sendMessage(listMessage)
})

bot.command("all", async (ctx) => {
    const all = await db.select().from(shoppingTable)

    ctx.sendMessage(JSON.stringify(all))
})

bot.launch()

console.log("Bot active")

process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))
