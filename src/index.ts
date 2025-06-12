import "dotenv/config"
import TelegramBot from "node-telegram-bot-api"

const token = process.env.TELEGRAM_API_KEY || ""

console.log(token)

const bot = new TelegramBot(token, { polling: true })

bot.onText(
    /\/echo (.+)/,
    (msg: TelegramBot.Message, match: RegExpExecArray | null) => {
        if (!match) return

        const chatId = msg.chat.id
        const resp = match[1]

        bot.sendMessage(chatId, resp)
    }
)
