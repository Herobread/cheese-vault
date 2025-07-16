import parseArgs from "@commands/parser"

describe("The parseArgs utility function", () => {
    test("should split arguments by commas", () => {
        const input = "milk, bread, eggs"
        const expected = ["milk", "bread", "eggs"]
        expect(parseArgs(input)).toEqual(expected)
    })

    test("should split arguments by newlines", () => {
        const input = "milk\nbread\neggs"
        const expected = ["milk", "bread", "eggs"]
        expect(parseArgs(input)).toEqual(expected)
    })

    test("should handle a mix of separators", () => {
        const input = "milk,\nbread\n\neggs, cheese"
        const expected = ["milk", "bread", "eggs", "cheese"]
        expect(parseArgs(input)).toEqual(expected)
    })

    test("should trim whitespace from each argument", () => {
        const input = "  milk  ,   bread   ,   eggs  "
        const expected = ["milk", "bread", "eggs"]
        expect(parseArgs(input)).toEqual(expected)
    })

    test("should return an empty array for empty input", () => {
        expect(parseArgs("")).toEqual([])
    })

    test("should filter out empty elements", () => {
        const input = "milk,,bread,\n\n\n\n\n\n\n\n,eggs"
        const expected = ["milk", "bread", "eggs"]
        expect(parseArgs(input)).toEqual(expected)
    })

    test("should return an empty array for input with only whitespace", () => {
        expect(parseArgs("   \n\t   ")).toEqual([])
    })

    test("should handle leading and trailing separators", () => {
        const input = ",milk,bread,eggs,"
        const expected = ["milk", "bread", "eggs"]
        expect(parseArgs(input)).toEqual(expected)
    })

    test("should trim various whitespace characters", () => {
        const input = " \tmilk\n\r\nbread\t\n eggs \t"
        const expected = ["milk", "bread", "eggs"]
        expect(parseArgs(input)).toEqual(expected)
    })
})
