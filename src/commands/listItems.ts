import { and, eq } from "drizzle-orm"
import { Context } from "telegraf"
import { db } from "../db/connection"
import { ShoppingItem, shoppingTable } from "../db/schema"

export async function listItems(ctx: Context) {
    const chatId = ctx.message?.chat.id
    const { args } = ctx as any

    let isBlame = false

    if (
        args &&
        args.length > 0 &&
        args[0]?.toString().toLowerCase() === "blame"
    ) {
        isBlame = true
    }

    if (!chatId) {
        await ctx.reply("🔴 Error. Could not determine chat ID.")
        return
    }

    const items = await db
        .select()
        .from(shoppingTable)
        .where(
            and(
                eq(shoppingTable.chat_id, chatId),
                eq(shoppingTable.isComplete, false)
            )
        )

    let listMessage = "🗒 Shopping list\n\n"

    if (items.length === 0) {
        listMessage += "\n<empty>"
    }

    items.forEach((item) => {
        listMessage += `- ${item.name}`

        if (isBlame) {
            listMessage += ` [${generateUserName(item)}]\n`
        }

        listMessage += "\n"
    })

    ctx.sendMessage(listMessage)
}

function generateUserName(item: ShoppingItem) {
    if (item.user_username) {
        return `${item.user_username}`
    }

    if (item.user_last_name) {
        return `${item.user_first_name} ${item.user_last_name}`
    }

    return `${item.user_first_name}`
}
