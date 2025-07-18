import { shoppingItems, shoppingLists } from "@/db/schema"
import { eq } from "drizzle-orm"
import path from "path"

import {
    extractListIdFromArgs,
    getMainListId,
    MAIN_LIST_IDENTIFIER,
} from "@/commands/addItemCommand"
import parseArgs from "@/commands/parser"
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

    it("creates separate main lists for different chat_ids", async () => {
        const id1 = await getMainListId(db, 1)
        const id2 = await getMainListId(db, 2)
        expect(id1).not.toBe(id2)
        const lists = await db.select().from(shoppingLists)
        expect(lists.length).toBe(2)
    })

    it("is idempotent: repeated calls don’t create new lists", async () => {
        const idA = await getMainListId(db, chat_id)
        const idB = await getMainListId(db, chat_id)
        expect(idA).toBe(idB)
        const lists = await db
            .select()
            .from(shoppingLists)
            .where(eq(shoppingLists.chat_id, chat_id))
        expect(lists.length).toBe(1)
    })

    // TODO: use for when big scale
    // it("does not create duplicate main lists under race condition", async () => {
    //     const results = await Promise.all([
    //         getMainListId(db, chat_id),
    //         getMainListId(db, chat_id),
    //     ])
    //     expect(results[0]).toBe(results[1])
    //     const lists = await db
    //         .select()
    //         .from(shoppingLists)
    //         .where(eq(shoppingLists.chat_id, chat_id))
    //     expect(lists.length).toBe(1)
    // })
})

describe("extractListIdFromArgs", () => {
    let db: any
    const chat_id = 1337

    beforeAll(async () => {
        db = getTestDb()
        migrate(db, { migrationsFolder })
    })

    beforeEach(async () => {
        await db.delete(shoppingLists)
    })

    it("returns list_id 0 and empty rest for empty args", async () => {
        const result = await extractListIdFromArgs(db, [], chat_id)
        expect(result).toEqual({ list_id: 0, rest: [] })
    })

    it("falls back to main list if only one item, returns original args", async () => {
        const args = ["Milk"]
        const mainListId = await getMainListId(db, chat_id)
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(mainListId)
        expect(result.rest).toEqual(args)
    })

    it("returns main list when first word is not a list name", async () => {
        const args = ["OtherList Milk"]
        const mainListId = await getMainListId(db, chat_id)
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(mainListId)
        expect(result.rest).toEqual(args)
    })

    it("returns existing list id and rest when first word matches a list name", async () => {
        // Create a custom list
        const [customList] = await db
            .insert(shoppingLists)
            .values({
                chat_id,
                list_name: "Custom",
            })
            .returning()
        const args = ["Custom Bread", "Eggs"]
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(customList.list_id)
        expect(result.rest[0]).toBe("Bread") // First arg's first word removed
        expect(result.rest[1]).toBe("Eggs")
    })

    it("does not strip argument if first word matches but nothing after", async () => {
        // Create a custom list
        const [customList] = await db
            .insert(shoppingLists)
            .values({
                chat_id,
                list_name: "Custom",
            })
            .returning()
        const args = ["Custom"]
        // This will fall into the single-item branch, so should return main list
        const mainListId = await getMainListId(db, chat_id)
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(mainListId)
        expect(result.rest).toEqual(args)
    })

    it("works when list name contains spaces", async () => {
        const [customList] = await db
            .insert(shoppingLists)
            .values({
                chat_id,
                list_name: "Super Market",
            })
            .returning()
        // Only the first word is extracted for potentialList lookup, so list with space won't match
        const args = ["Super Market Bread", "Eggs"]
        const mainListId = await getMainListId(db, chat_id)
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(mainListId)
        expect(result.rest).toEqual(args)
    })

    it("returns main list for unknown list and does not strip args", async () => {
        const args = ["UnknownList Bread", "Eggs"]
        const mainListId = await getMainListId(db, chat_id)
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(mainListId)
        expect(result.rest).toEqual(args)
    })

    it("is case-sensitive with list names by default", async () => {
        // Only 'Target' (capital T) exists
        const [list] = await db
            .insert(shoppingLists)
            .values({ chat_id, list_name: "Target" })
            .returning()
        const args = ["target Bread", "Eggs"]
        const mainListId = await getMainListId(db, chat_id)
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(mainListId)
        expect(result.rest).toEqual(args)
    })

    it("returns matching list id and strips only first word, even if multiple spaces", async () => {
        const [list] = await db
            .insert(shoppingLists)
            .values({ chat_id, list_name: "Target" })
            .returning()
        const args = parseArgs("Target   Bread Milk, Eggs")
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(list.list_id)
        expect(result.rest[0]).toBe("Bread Milk")
        expect(result.rest[1]).toBe("Eggs")
    })

    it("does not match partial list name", async () => {
        await db
            .insert(shoppingLists)
            .values({ chat_id, list_name: "Shopping" })
        const mainListId = await getMainListId(db, chat_id)
        const args = ["Shop Bread", "Eggs"]
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(mainListId)
        expect(result.rest).toEqual(args)
    })

    it("returns main list for numeric first word", async () => {
        const mainListId = await getMainListId(db, chat_id)
        const args = parseArgs("1234 Bread")
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(mainListId)
        expect(result.rest).toEqual(args)
    })

    it("works with non-ASCII list names", async () => {
        const [list] = await db
            .insert(shoppingLists)
            .values({ chat_id, list_name: "Список" })
            .returning()
        const args = ["Список Молоко", "Яйца"]
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(list.list_id)
        expect(result.rest[0]).toBe("Молоко")
        expect(result.rest[1]).toBe("Яйца")
    })

    it("works with emoji in list names", async () => {
        const [list] = await db
            .insert(shoppingLists)
            .values({ chat_id, list_name: "🛒" })
            .returning()
        const args = ["🛒 Apples", "Bananas"]
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(list.list_id)
        expect(result.rest[0]).toBe("Apples")
        expect(result.rest[1]).toBe("Bananas")
    })

    it("handles multiple spaces between words in args", async () => {
        const [list] = await db
            .insert(shoppingLists)
            .values({ chat_id, list_name: "Special" })
            .returning()
        const args = parseArgs("Special     Bread,  Eggs")
        const result = await extractListIdFromArgs(db, args, chat_id)
        expect(result.list_id).toBe(list.list_id)
        expect(result.rest[0]).toBe("Bread")
        expect(result.rest[1]).toBe("Eggs")
    })
})
