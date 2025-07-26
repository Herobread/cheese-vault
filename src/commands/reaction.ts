import { TelegramEmoji } from "telegraf/typings/core/types/typegram"

export function getRandomPositiveReactionEmoji() {
    const emojis: TelegramEmoji[] = [
        "👍",
        "❤",
        "🔥",
        "🥰",
        "👏",
        "😁",
        "🎉",
        "🤩",
        "😍",
        "❤‍🔥",
        "💯",
        "🤣",
        "⚡",
        "🏆",
        "🍓",
        "🍾",
        "💋",
        "🤗",
        "🫡",
        "🎅",
        "🎄",
        "☃",
        "💅",
        "🆒",
        "💘",
        "🦄",
        "😘",
        "😎",
    ]
    return emojis[Math.floor(Math.random() * emojis.length)]
}
