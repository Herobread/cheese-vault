import { Format } from "logform"
import { createLogger, format, Logger, transports } from "winston"
import DailyRotateFile from "winston-daily-rotate-file"

const { combine, timestamp, printf, colorize } = format

const logFormat: Format = printf(({ level, message, timestamp }: any) => {
    return `${timestamp} [${level}]: ${message}`
})

// Create logger
export const logger: Logger = createLogger({
    level: "info",
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
    transports: [
        new transports.Console({
            format: combine(colorize(), logFormat),
        }),
        new DailyRotateFile({
            filename: "logs/server-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxFiles: "14d",
        }),
    ],
})
