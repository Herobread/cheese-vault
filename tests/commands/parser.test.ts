import parseArgs, { parseCommand } from "@commands/parser"

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

describe("The parseCommand utility function", () => {
    test("should parse a command with no arguments", () => {
        const input = "/start"
        const expected = { command: "start", args: [] }
        expect(parseCommand(input)).toEqual(expected)
    })

    test("should parse a command with one argument", () => {
        const input = "/add milk"
        const expected = { command: "add", args: ["milk"] }
        expect(parseCommand(input)).toEqual(expected)
    })

    test("should parse a command with multiple comma-separated arguments", () => {
        const input = "/add milk, bread, eggs"
        const expected = { command: "add", args: ["milk", "bread", "eggs"] }
        expect(parseCommand(input)).toEqual(expected)
    })

    test("should parse a command with multiple newline-separated arguments", () => {
        const input = "/add milk\nbread\neggs"
        const expected = { command: "add", args: ["milk", "bread", "eggs"] }
        console.log(parseCommand(input))

        expect(parseCommand(input)).toEqual(expected)
    })

    test("should handle extra whitespace between command and arguments", () => {
        const input = "/add   milk,  bread"
        const expected = { command: "add", args: ["milk", "bread"] }
        expect(parseCommand(input)).toEqual(expected)
    })

    test("should return an empty command object for a string without a command", () => {
        const input = "just some text"
        const expected = { command: "", args: [] }
        expect(parseCommand(input)).toEqual(expected)
    })

    test("should return an empty command object for an empty string", () => {
        const expected = { command: "", args: [] }
        expect(parseCommand("")).toEqual(expected)
    })

    test("should return null for a string with only a slash", () => {
        expect(parseCommand("/")).toEqual({ command: "", args: [] })
    })

    test("should handle commands with underscores and numbers", () => {
        const input = "/command_123 do_this"
        const expected = { command: "command_123", args: ["do_this"] }
        expect(parseCommand(input)).toEqual(expected)
    })
})
