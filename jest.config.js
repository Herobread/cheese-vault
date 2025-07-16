module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^@commands/(.*)$": "<rootDir>/src/commands/$1",
        "^@db/(.*)$": "<rootDir>/src/db/$1",
    },
}
