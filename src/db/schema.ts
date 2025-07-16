import { InferSelectModel } from "drizzle-orm"
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const shoppingItems = sqliteTable("shopping_items", {
    item_id: int().primaryKey({ autoIncrement: true }),
    item_name: text().notNull(),
    list_id: int()
        .notNull()
        .references(() => shoppingLists.list_id, {
            onDelete: "cascade",
        }),
})

export const shoppingLists = sqliteTable("shopping_lists", {
    list_id: int().primaryKey({ autoIncrement: true }),
    list_name: text().notNull(),
    chat_id: int().notNull(),
    message_id: int().notNull(),
})

export type ShoppingItem = InferSelectModel<typeof shoppingItems>
