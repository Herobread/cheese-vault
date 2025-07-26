import { logger } from "@/logger"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

type CommandHandler = (
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) => Promise<void>

export function withErrorHandling(handler: CommandHandler): CommandHandler {
    return async (ctx) => {
        try {
            await handler(ctx)
        } catch (error) {
            const chatId = ctx.chat?.id ?? "unknown"
            const userId = ctx.from?.id ?? "unknown"
            logger.error(
                `Error in command handler "${handler.name}" for user ${userId} in chat ${chatId}:`,
                error
            )
        }
    }
}
