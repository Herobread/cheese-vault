/**
 * Parses a string into an array of arguments. Used for shopping
 * lists, as it separates items more naturally, aka doesnt separate by each space.
 *
 * @param str The input string to parse.
 * @returns An array of trimmed arguments.
 */
export default function parseArgs(str: string): string[] {
    return (
        str
            // split by new lines and commas, but also ignore big gaps and empty elements
            .trim()
            .replace(/[ ]{2,}/g, " ")
            .split(/[\n,]+/)
            .map((arg) => arg.trim())
            .filter((arg) => arg.length > 0)
    )
}

/**
 * function to parse command argumments from string with /command args
 * @param messageText The text of the message containing the command and arguments.
 * @returns object of command name and arguments
 */
export function parseCommand(messageText: string): {
    command: string
    args: string[]
} {
    if (!messageText.startsWith("/")) {
        return { command: "", args: [] }
    }

    const firstSpaceIndex = messageText.indexOf(" ")
    if (firstSpaceIndex === -1) {
        return { command: messageText.substring(1), args: [] }
    }

    const command = messageText.substring(1, firstSpaceIndex)
    const args = parseArgs(messageText.substring(firstSpaceIndex + 1))

    return { command, args }
}
