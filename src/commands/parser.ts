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
