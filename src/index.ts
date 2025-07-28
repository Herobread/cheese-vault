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
import { renameItemCommandHandler } from "@/commands/renameCommand"
import { resetChat, resetCommandHandler } from "@/commands/resetCommand"
import { withErrorHandling } from "@/commands/withErrorHandling"
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

    return next()
})

bot.on(message("text"), async (ctx, next) => {
    const messageText = ctx.update.message.text

    if (messageText.startsWith("/")) {
        logger.info(
            `Chat ${ctx.chat.id}, user: ${ctx.from.id}, command: ${messageText}`
        )

        return next()
    }

    if (messageText.startsWith(".")) {
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
            !pinnedMessage[0] ||
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

// delete items
bot.command("delete", withErrorHandling(deleteItemCommandHandler))
bot.command("del", withErrorHandling(deleteItemCommandHandler))

// rename
bot.command("rename", withErrorHandling(renameItemCommandHandler))
bot.command("replace", withErrorHandling(renameItemCommandHandler))
bot.command("re", withErrorHandling(renameItemCommandHandler))

bot.command("reset", withErrorHandling(resetCommandHandler))

bot.action("reset_confirm", async (ctx) => {
    if (!ctx.chat) {
        return
    }
    await resetChat(ctx, db, ctx.chat.id)
    await ctx.editMessageText(
        "💥 All lists cleared. Create new list with /list"
    )
})

bot.action("reset_cancel", async (ctx) => {
    await ctx.editMessageText("Reset cancelled.\n\n🧀")
})

// items
bot.command("add", withErrorHandling(addItemCommandHandler))
bot.command("list", withErrorHandling(listCommandHandler))
bot.command("ls", withErrorHandling(listCommandHandler))

// lists
bot.command("lists", withErrorHandling(listListsCommandHandler))
bot.command("addList", withErrorHandling(addListCommandHandler))
bot.command("addlist", withErrorHandling(addListCommandHandler))
bot.command("deleteList", withErrorHandling(deleteListCommandHandler))
bot.command("deletelist", withErrorHandling(deleteListCommandHandler))
bot.command("delList", withErrorHandling(deleteListCommandHandler))
bot.command("dellist", withErrorHandling(deleteListCommandHandler))

bot.command("help", withErrorHandling(helpCommandHandler))

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
