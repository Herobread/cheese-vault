import { InferSelectModel } from "drizzle-orm"
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const shoppingTable = sqliteTable("shopping", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    chat_id: int().notNull(),
    user_id: int().notNull(),
    user_first_name: text().notNull(),
    user_last_name: text(),
    user_username: text(),
    date: int().notNull(),
    isComplete: int({ mode: "boolean" }).notNull().default(false),
})

export const pinnedListMessages = sqliteTable("pinned_list_messages", {
    id: int().primaryKey({ autoIncrement: true }),
    chat_id: int().notNull(),
    message_id: int().notNull(),
    date: int().notNull(),
})

export type ShoppingItem = InferSelectModel<typeof shoppingTable>
