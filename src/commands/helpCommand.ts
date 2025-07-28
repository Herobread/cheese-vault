import { Context } from "telegraf"
import { Message, Update } from "telegraf/typings/core/types/typegram"

export async function helpCommandHandler(
    ctx: Context<Update.MessageUpdate<Message.TextMessage>>
) {
    const helpMessage = `*🧀 Welcome to Cheese Vault Bot\\!*

Here are the commands you can use:

*🛒 Item Management*
\`/add\` \`<item name>\`
you can also add list name before item name to add it to specific list
\`/add\` \`<list name>\` \`<item name>\`
\`/rename\` \`<item id>\` \`<new name>\` \\- Rename an item
\`/delete\` \`<item id>\` or \`/del\` \`<item id>\` \\- Delete an item

*🗒️ List Management*
\`/list\` \\- show all items
\`/lists\` \\- show lists
\`/addList\` \`<list name>\` \\- create a list \\(no spaces\\!\\)
\`/rename\` \`<list name>\` \`<new name>\` \\- Rename a list
\`/deleteList\` \`<list name>\` \\- delete a shopping list and all its items
    
*💡 Pro Tip*
You can also add items by simply replying to the pinned list message with the item name
`
    ctx.sendMessage(helpMessage, { parse_mode: "MarkdownV2" })
}
