import {
    addItemCommandHandler,
    handleAddItemFromArgs,
} from "@/commands/addItemCommand"
import { addListCommandHandler } from "@/commands/addListCommand"
import { deleteItemCommandHandler } from "@/commands/deleteItemCommand"
import { deleteListCommandHandler } from "@/commands/deleteListCommand"
import { getChatData } from "@/commands/getChatData"
import { helpCommandHandler } from "@/commands/helpCommand"
import {
    listCommandHandler,
    updatePinnedMessageContent,
} from "@/commands/listCommand"
import { listListsCommandHandler } from "@/commands/listListsCommand"
import parseArgs from "@/commands/parser"
import { getRandomPositiveReactionEmoji } from "@/commands/reaction"
import { db } from "@/db/connection"
import { chatDatas } from "@/db/schema"
import "dotenv/config"
import { eq } from "drizzle-orm"
import { Telegraf } from "telegraf"
import { message } from "telegraf/filters"
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
// - log message
bot.use(async (ctx, next) => {
    if (ctx.chat?.id) {
        // - ensure chat data exists for each update
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
bot.command("addList", addListCommandHandler)
bot.command("addlist", addListCommandHandler)
bot.command("deleteList", deleteListCommandHandler)
bot.command("deletelist", deleteListCommandHandler)
bot.command("delList", deleteListCommandHandler)
bot.command("dellist", deleteListCommandHandler)

bot.command("help", helpCommandHandler)

bot.on(message("text"), async (ctx) => {
    const messageText = ctx.update.message.text

    if (messageText.startsWith("/") || messageText.startsWith(".")) {
        return
    }

    const chat_id = ctx.message.chat.id
    const replyToMessageId = ctx.message.reply_to_message?.message_id
    const userId = ctx.from.id

    try {
        const pinnedMessage = await db
            .select()
            .from(chatDatas)
            .where(eq(chatDatas.chat_id, chat_id))
            .limit(1)

        if (
            !pinnedMessage ||
            pinnedMessage[0].pinned_message_id !== replyToMessageId
        ) {
            return
        }

        logger.info(
            `Message from user ${userId} is a reply to the pinned list in chat ${chat_id}. Adding item.`
        )

        await handleAddItemFromArgs(db, parseArgs(messageText), chat_id)
        await updatePinnedMessageContent(ctx, db, chat_id)
        ctx.react(getRandomPositiveReactionEmoji())
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
