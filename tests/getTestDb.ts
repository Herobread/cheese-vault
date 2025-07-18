import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

export function getTestDb() {
    const db = new Database(":memory:")
    return drizzle(db)
}
