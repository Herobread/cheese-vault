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
    const commandMatch = messageText.match(/^\/(\w+)(?:\s+([\s\S]*))?$/)

    if (!commandMatch) {
        return {
            command: "",
            args: [],
        }
    }

    const command = commandMatch[1]
    const args = commandMatch[2] ? parseArgs(commandMatch[2]) : []

    return { command, args }
}
