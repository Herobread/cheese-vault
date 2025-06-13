import { int, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const shoppingTable = sqliteTable("shopping", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
})
