import type { Match, Chat, Message } from "@/types/app"
import { DISCOVER_PROFILES } from "./profiles"

export const MATCHES: Match[] = [
  {
    id: "m1",
    profile: DISCOVER_PROFILES[0],
    matchedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: "new",
    hasUnread: true,
    lastMessage: "Привет! Ты правда была в Токио?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isSuperLike: false,
  },
  {
    id: "m2",
    profile: DISCOVER_PROFILES[1],
    matchedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    status: "active",
    hasUnread: false,
    lastMessage: "Смотрела «Белые ночи»?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isSuperLike: true,
  },
  {
    id: "m3",
    profile: DISCOVER_PROFILES[2],
    matchedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "active",
    hasUnread: true,
    lastMessage: "Какую музыку слушаешь сейчас?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "m4",
    profile: DISCOVER_PROFILES[3],
    matchedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: "active",
    hasUnread: false,
    lastMessage: "Хочу показать тебе одно место.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

function msg(
  id: string,
  chatId: string,
  senderId: string,
  text: string,
  minutesAgo: number,
  isRead = true
): Message {
  return {
    id,
    chatId,
    senderId,
    type: "text",
    text,
    sentAt: new Date(Date.now() - 1000 * 60 * minutesAgo).toISOString(),
    isRead,
  }
}

export const CHATS: Chat[] = [
  {
    id: "m1",
    match: MATCHES[0],
    messages: [
      msg("msg-1-1", "m1", "u1", "Привет! Ты правда была в Токио?", 15, false),
    ],
  },
  {
    id: "m2",
    match: MATCHES[1],
    messages: [
      msg("msg-2-1", "m2", "me",  "Привет! Видела твой профиль — ты тоже читаешь Довлатова?", 140),
      msg("msg-2-2", "m2", "u2",  "Да, «Заповедник» перечитываю каждый год.", 130),
      msg("msg-2-3", "m2", "me",  "Это что-то. Есть любимая цитата?", 125),
      msg("msg-2-4", "m2", "u2",  "«Я никогда не был таким одиноким, как среди людей, которые меня любят.»", 120),
      msg("msg-2-5", "m2", "me",  "Сильно. А ты смотрела «Белые ночи»?", 118),
      msg("msg-2-6", "m2", "u2",  "Смотрела «Белые ночи»?", 115),
    ],
  },
  {
    id: "m3",
    match: MATCHES[2],
    messages: [
      msg("msg-3-1", "m3", "u3",  "Какую музыку слушаешь сейчас?", 18 * 60, false),
    ],
  },
  {
    id: "m4",
    match: MATCHES[3],
    messages: [
      msg("msg-4-1", "m4", "me",  "Привет! Твои фото — это Питер?", 25 * 60),
      msg("msg-4-2", "m4", "u4",  "Нет, это Тбилиси. Была там прошлым летом.", 24 * 60),
      msg("msg-4-3", "m4", "me",  "Обожаю Тбилиси. Как там было?", 24 * 60 - 5),
      msg("msg-4-4", "m4", "u4",  "Хочу показать тебе одно место.", 24 * 60),
    ],
  },
]
