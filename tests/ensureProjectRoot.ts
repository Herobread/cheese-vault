import fs from "fs"
import path from "path"

/**
 * Ensures that the test is running from the project root (or at least that the migrations folder is where we expect).
 * If not, throws a descriptive error.
 */
export function ensureProjectRoot(
    migrationsFolder: string = path.join(process.cwd(), "drizzle")
) {
    if (!fs.existsSync(migrationsFolder)) {
        throw new Error(
            `❌ Could not find the migrations folder at: ${migrationsFolder}\n` +
                `Are you running this test from the project root?\n` +
                `Try running your test command from the root of your repository.\n` +
                `If your migrations folder is elsewhere, set the correct path in your configuration.`
        )
    }
}
