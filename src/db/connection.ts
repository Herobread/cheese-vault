import "dotenv/config"
import { sql, SQL } from "drizzle-orm"
import { drizzle } from "drizzle-orm/libsql"
import { AnySQLiteColumn } from "drizzle-orm/sqlite-core"

export const db = drizzle(process.env.DB_FILE_NAME!)

export function lower(email: AnySQLiteColumn): SQL {
    return sql`(lower(${email}))`
}
