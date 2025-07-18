import { shoppingItems, shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import path from "path"

import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { getTestDb } from "tests/getTestDb"

const migrationsFolder = path.join(process.cwd(), "drizzle")

describe("integration test with Drizzle migrations", () => {
    let db: any

    beforeAll(async () => {
        db = getTestDb()
        await migrate(db, { migrationsFolder })
    })

    it("should insert and read shopping items", async () => {
        const [list] = await db
            .insert(shoppingLists)
            .values({ list_name: "Groceries", chat_id: 12345 })
            .returning()
        const [item] = await db
            .insert(shoppingItems)
            .values({ item_name: "Milk", list_id: list.list_id })
            .returning()
        const items = await db
            .select()
            .from(shoppingItems)
            .where(eq(shoppingItems.list_id, list.list_id))
        expect(items[0].item_name).toBe("Milk")
    })
})
