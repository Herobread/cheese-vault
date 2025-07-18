import { shoppingItems, shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import path from "path"

import { getMainListId, MAIN_LIST_IDENTIFIER } from "@/commands/addItemCommand"
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { ensureProjectRoot } from "tests/ensureProjectRoot"
import { getTestDb } from "tests/getTestDb"

const migrationsFolder = path.join(process.cwd(), "drizzle")

ensureProjectRoot(migrationsFolder)

describe("integration test with Drizzle migrations", () => {
    let db: BetterSQLite3Database

    beforeAll(async () => {
        db = getTestDb()
        migrate(db, { migrationsFolder })
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

describe("getMainListId", () => {
    let db: any
    const chat_id = 42

    beforeAll(async () => {
        db = getTestDb()
        migrate(db, { migrationsFolder })
    })

    beforeEach(async () => {
        await db.delete(shoppingLists)
    })

    it("creates main list if not present", async () => {
        // Table is empty
        const mainListId = await getMainListId(db, chat_id)
        // Should have created a list with proper name and chat_id
        const [list] = await db
            .select()
            .from(shoppingLists)
            .where(eq(shoppingLists.chat_id, chat_id))
        expect(list).toBeTruthy()
        expect(list.list_name).toBe(MAIN_LIST_IDENTIFIER)
        expect(list.list_id).toBe(mainListId)
    })

    it("returns existing list if present", async () => {
        // Create a main list manually
        const [created] = await db
            .insert(shoppingLists)
            .values({
                chat_id,
                list_name: MAIN_LIST_IDENTIFIER,
            })
            .returning()
        // Now getMainListId should return the same id, not create a new list
        const mainListId = await getMainListId(db, chat_id)
        expect(mainListId).toBe(created.list_id)

        // Table should still have only one such main list for this chat_id
        const lists = await db
            .select()
            .from(shoppingLists)
            .where(eq(shoppingLists.chat_id, chat_id))
        expect(lists.length).toBe(1)
    })
})
