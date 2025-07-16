import { parseCommand } from "@/commands/parser"
import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export function parseTestCommand(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const { args } = parseCommand(ctx.message.text)

    ctx.sendMessage(JSON.stringify(args))
}
