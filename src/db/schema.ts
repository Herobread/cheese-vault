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
})
