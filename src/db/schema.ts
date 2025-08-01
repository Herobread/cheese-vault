import { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const shoppingItems = sqliteTable("shopping_items", {
    uid: int().primaryKey({ autoIncrement: true }).unique(),
    chat_id: int().notNull(),
    item_id: int().notNull(),
    item_name: text().notNull(),
    list_id: int()
        .notNull()
        .references(() => shoppingLists.list_id, {
            onDelete: "cascade",
        }),
})

export const shoppingLists = sqliteTable("shopping_lists", {
    list_id: int().primaryKey({ autoIncrement: true }).unique(),
    list_name: text().notNull(),
    chat_id: int().notNull(),
    message_id: int(),
})

export const chatDatas = sqliteTable("chat_data", {
    chat_id: int().notNull().primaryKey(),
    next_id: int().notNull().default(1),
    pinned_message_id: int(),
})

export type ShoppingItem = InferSelectModel<typeof shoppingItems>
export type InsertableShoppingItem = InferInsertModel<typeof shoppingItems>
export type InsertableChatData = InferInsertModel<typeof chatDatas>
