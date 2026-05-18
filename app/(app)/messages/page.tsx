"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  MessageCircle,
  ArrowLeft,
  Send,
  Paperclip,
  MoreHorizontal,
  Heart,
  Search,
} from "lucide-react"
import { CHATS } from "@/mock-data/matches"
import type { Message } from "@/types/app"
import { useLang } from "@/lib/lang-context"

const copy = {
  ru: {
    title: "Сообщения",
    empty: "Выбери переписку",
    emptySub: "Здесь появятся твои чаты с матчами.",
    online: "В сети",
    lastSeen: "Была недавно",
    placeholder: "Написать...",
    today: "Сегодня",
    send: "Отправить",
    noChats: "Пока нет переписок.",
    searchPlaceholder: "Поиск...",
    matchedWith: "Вы совпали",
    sayHi: "Напиши первой",
  },
  en: {
    title: "Messages",
    empty: "Select a conversation",
    emptySub: "Your chats with matches will appear here.",
    online: "Online",
    lastSeen: "Active recently",
    placeholder: "Write a message...",
    today: "Today",
    send: "Send",
    noChats: "No conversations yet.",
    searchPlaceholder: "Search...",
    matchedWith: "You matched",
    sayHi: "Say hello first",
  },
}

function formatMsgTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
}

function MessagesInner() {
  const { lang } = useLang()
  const t = copy[lang]
  const searchParams = useSearchParams()
  const chatIdParam = searchParams.get("chat")

  const [activeId, setActiveId] = useState<string | null>(chatIdParam ?? null)
  const [chatState, setChatState] = useState(CHATS)
  const [input, setInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeChat = chatState.find((c) => c.id === activeId) ?? null

  const filteredChats = searchQuery.trim()
    ? chatState.filter((c) =>
        c.match.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chatState

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeChat?.messages.length])

  function sendMessage() {
    const text = input.trim()
    if (!text || !activeId) return
    const newMsg: Message = {
      id: `new-${Date.now()}`,
      chatId: activeId,
      senderId: "me",
      type: "text",
      text,
      sentAt: new Date().toISOString(),
      isRead: false,
    }
    setChatState((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, newMsg] } : c
      )
    )
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  /* ── Conversation list ───────────────────────────── */
  const ConversationList = (
    <aside
      className={`flex flex-col flex-shrink-0 ${activeId ? "hidden md:flex" : "flex"}`}
      style={{
        width: "100%",
        maxWidth: "300px",
        borderRight: "1px solid oklch(0.15 0.012 15 / 0.80)",
        minHeight: "100dvh",
        background: "oklch(0.085 0.010 15 / 0.80)",
      }}
    >
      {/* Sidebar header */}
      <header
        className="px-5 pt-6 pb-4 flex-shrink-0"
        style={{ borderBottom: "1px solid oklch(0.14 0.010 15 / 0.60)" }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <MessageCircle size={16} strokeWidth={1.5} style={{ color: "oklch(0.65 0.26 12)" }} />
          <span
            className="font-display font-light tracking-[-0.01em]"
            style={{ fontSize: "1.2rem", color: "oklch(0.86 0.005 60)", lineHeight: 1.1 }}
          >
            {t.title}
          </span>
        </div>

        {/* Search bar */}
        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{
            background: "oklch(0.12 0.010 15 / 0.70)",
            border: "1px solid oklch(0.20 0.010 15 / 0.55)",
          }}
        >
          <Search size={13} style={{ color: "oklch(0.32 0.008 15)", flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent font-sans outline-none"
            style={{
              fontSize: "12.5px",
              color: "oklch(0.80 0.005 60)",
              caretColor: "oklch(0.65 0.26 12)",
            }}
          />
        </div>
      </header>

      {/* Chat list */}
      <div className="flex flex-col gap-0.5 px-2 py-2 pb-8 overflow-y-auto flex-1">
        {filteredChats.length === 0 && (
          <p
            className="font-sans px-3 py-8 text-center"
            style={{ fontSize: "12px", color: "oklch(0.30 0.008 15)" }}
          >
            {t.noChats}
          </p>
        )}
        {filteredChats.map((chat) => {
          const last = chat.messages.at(-1)
          const isActive = chat.id === activeId
          return (
            <button
              key={chat.id}
              onClick={() => setActiveId(chat.id)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all relative"
              style={{
                background: isActive ? "oklch(0.65 0.26 12 / 0.10)" : "transparent",
                border: isActive
                  ? "1px solid oklch(0.65 0.26 12 / 0.18)"
                  : "1px solid transparent",
                boxShadow: isActive ? "0 0 18px oklch(0.65 0.26 12 / 0.06)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "oklch(0.12 0.010 15 / 0.70)"
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent"
              }}
            >
              {/* Unread left bar */}
              {chat.match.hasUnread && !isActive && (
                <div
                  className="absolute left-0 top-3 bottom-3 rounded-r-full"
                  style={{
                    width: "2.5px",
                    background: "oklch(0.65 0.26 12)",
                    boxShadow: "0 0 6px oklch(0.65 0.26 12 / 0.50)",
                  }}
                />
              )}

              <div className="relative flex-shrink-0">
                <div
                  className="overflow-hidden rounded-full"
                  style={{
                    width: "44px",
                    height: "44px",
                    border: isActive
                      ? "1.5px solid oklch(0.65 0.26 12 / 0.55)"
                      : chat.match.hasUnread
                      ? "1.5px solid oklch(0.65 0.26 12 / 0.32)"
                      : "1.5px solid oklch(0.20 0.010 15 / 0.50)",
                  }}
                >
                  <Image
                    src={chat.match.profile.photos[0]}
                    alt={chat.match.profile.name}
                    width={44}
                    height={44}
                    className="object-cover w-full h-full"
                  />
                </div>
                {chat.match.profile.isOnline && (
                  <span
                    className="absolute bottom-0 right-0 rounded-full"
                    style={{
                      width: "10px",
                      height: "10px",
                      background: "oklch(0.78 0.20 145)",
                      border: "2px solid oklch(0.085 0.010 15)",
                      boxShadow: "0 0 6px oklch(0.78 0.20 145 / 0.55)",
                    }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className="font-sans font-medium truncate"
                    style={{
                      fontSize: "13px",
                      color: chat.match.hasUnread ? "oklch(0.88 0.005 60)" : "oklch(0.52 0.008 15)",
                    }}
                  >
                    {chat.match.profile.name}
                  </span>
                  {last && (
                    <span
                      className="font-sans flex-shrink-0 ml-2"
                      style={{ fontSize: "10px", color: "oklch(0.26 0.008 15)" }}
                    >
                      {formatMsgTime(last.sentAt)}
                    </span>
                  )}
                </div>
                {last?.text ? (
                  <p
                    className="font-sans truncate"
                    style={{
                      fontSize: "11.5px",
                      color: chat.match.hasUnread ? "oklch(0.50 0.008 15)" : "oklch(0.30 0.008 15)",
                      fontWeight: chat.match.hasUnread ? 500 : 400,
                    }}
                  >
                    {last.senderId === "me" ? (lang === "ru" ? "Ты: " : "You: ") : ""}{last.text}
                  </p>
                ) : (
                  <p
                    className="font-sans italic"
                    style={{ fontSize: "11px", color: "oklch(0.24 0.008 15)" }}
                  >
                    {lang === "ru" ? "Нет сообщений" : "No messages yet"}
                  </p>
                )}
              </div>

              {chat.match.hasUnread && !isActive && (
                <span
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: "7px",
                    height: "7px",
                    background: "oklch(0.65 0.26 12)",
                    boxShadow: "0 0 6px oklch(0.65 0.26 12 / 0.55)",
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )

  /* ── Active chat thread ──────────────────────────── */
  const ChatThread = activeChat ? (
    <div
      className="flex flex-col flex-1 relative"
      style={{ minHeight: "100dvh" }}
    >
      {/* Ambient top glow */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-0"
        style={{
          height: "200px",
          background:
            "radial-gradient(ellipse at 50% -20%, oklch(0.65 0.26 12 / 0.07) 0%, transparent 60%)",
        }}
      />

      {/* ── Chat header ── */}
      <header
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0 relative z-10"
        style={{
          borderBottom: "1px solid oklch(0.15 0.012 15 / 0.80)",
          background: "oklch(0.09 0.010 15 / 0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          position: "sticky",
          top: 0,
        }}
      >
        {/* Mobile back */}
        <button
          onClick={() => setActiveId(null)}
          className="md:hidden flex items-center justify-center rounded-xl transition-all flex-shrink-0"
          style={{
            width: "36px",
            height: "36px",
            color: "oklch(0.60 0.006 60)",
            background: "oklch(0.13 0.010 15 / 0.70)",
            border: "1px solid oklch(0.20 0.010 15 / 0.55)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "oklch(0.82 0.005 60)"
            e.currentTarget.style.borderColor = "oklch(0.65 0.26 12 / 0.28)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "oklch(0.60 0.006 60)"
            e.currentTarget.style.borderColor = "oklch(0.20 0.010 15 / 0.55)"
          }}
          aria-label={lang === "ru" ? "Назад" : "Back"}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="overflow-hidden rounded-full"
            style={{
              width: "40px",
              height: "40px",
              border: "1.5px solid oklch(0.65 0.26 12 / 0.35)",
              boxShadow: "0 0 16px oklch(0.65 0.26 12 / 0.14)",
            }}
          >
            <Image
              src={activeChat.match.profile.photos[0]}
              alt={activeChat.match.profile.name}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          {activeChat.match.profile.isOnline && (
            <span
              className="absolute bottom-0 right-0 rounded-full"
              style={{
                width: "9px",
                height: "9px",
                background: "oklch(0.78 0.20 145)",
                border: "1.5px solid oklch(0.09 0.010 15)",
                boxShadow: "0 0 6px oklch(0.78 0.20 145 / 0.60)",
              }}
            />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p
            className="font-sans font-medium truncate"
            style={{ fontSize: "13.5px", color: "oklch(0.86 0.005 60)" }}
          >
            {activeChat.match.profile.name}
            <span
              className="font-sans font-light ml-1.5"
              style={{ fontSize: "12px", color: "oklch(0.44 0.006 60)" }}
            >
              {activeChat.match.profile.age}
            </span>
          </p>
          <p
            className="font-sans"
            style={{
              fontSize: "10.5px",
              color: activeChat.match.profile.isOnline
                ? "oklch(0.66 0.16 145)"
                : "oklch(0.28 0.008 15)",
            }}
          >
            {activeChat.match.profile.isOnline ? t.online : t.lastSeen}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            className="p-2 rounded-full transition-all"
            style={{ color: "oklch(0.28 0.008 15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.50 0.005 60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.28 0.008 15)")}
            aria-label="Like profile"
          >
            <Heart size={16} strokeWidth={1.5} />
          </button>
          <button
            className="p-2 rounded-full transition-all"
            style={{ color: "oklch(0.28 0.008 15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.50 0.005 60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.28 0.008 15)")}
            aria-label="More options"
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* ── Messages scroll area ── */}
      <div
        className="flex-1 flex flex-col gap-2.5 px-5 py-6 overflow-y-auto relative z-10"
        style={{ paddingBottom: "100px" }}
      >
        {/* Match context banner */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <div
            className="overflow-hidden rounded-full"
            style={{
              width: "54px",
              height: "54px",
              border: "1.5px solid oklch(0.65 0.26 12 / 0.40)",
              boxShadow: "0 0 22px oklch(0.65 0.26 12 / 0.16)",
            }}
          >
            <Image
              src={activeChat.match.profile.photos[0]}
              alt={activeChat.match.profile.name}
              width={54}
              height={54}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="text-center">
            <p
              className="font-display font-light"
              style={{ fontSize: "1.1rem", color: "oklch(0.78 0.005 60)" }}
            >
              {activeChat.match.profile.name}
            </p>
            <p
              className="font-sans mt-0.5"
              style={{ fontSize: "11px", color: "oklch(0.28 0.008 15)" }}
            >
              {t.matchedWith}
            </p>
          </div>
          <div
            className="flex items-center justify-center rounded-full px-4 py-2 font-sans"
            style={{
              fontSize: "11px",
              color: "oklch(0.65 0.26 12 / 0.75)",
              background: "oklch(0.65 0.26 12 / 0.07)",
              border: "1px solid oklch(0.65 0.26 12 / 0.16)",
            }}
          >
            <Heart size={11} strokeWidth={1.5} style={{ marginRight: "6px" }} />
            {t.sayHi}
          </div>
        </div>

        {/* Date divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: "oklch(0.16 0.010 15 / 0.60)" }} />
          <span
            className="font-sans uppercase tracking-[0.12em]"
            style={{ fontSize: "9.5px", color: "oklch(0.24 0.008 15)" }}
          >
            {t.today}
          </span>
          <div className="flex-1 h-px" style={{ background: "oklch(0.16 0.010 15 / 0.60)" }} />
        </div>

        {/* Messages */}
        {activeChat.messages.map((msg, idx) => {
          const isMe = msg.senderId === "me"
          const prevMsg = activeChat.messages[idx - 1]
          const sameGroupAsPrev = prevMsg && prevMsg.senderId === msg.senderId

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              style={{ marginTop: sameGroupAsPrev ? "2px" : "8px" }}
            >
              <div
                className="flex flex-col"
                style={{ maxWidth: "68%", alignItems: isMe ? "flex-end" : "flex-start" }}
              >
                <div
                  className="px-4 py-2.5"
                  style={{
                    borderRadius: isMe
                      ? sameGroupAsPrev ? "18px 18px 5px 18px" : "18px 18px 5px 18px"
                      : sameGroupAsPrev ? "18px 18px 18px 5px" : "18px 18px 18px 5px",
                    background: isMe
                      ? "oklch(0.56 0.24 12 / 0.22)"
                      : "oklch(0.13 0.012 15 / 0.94)",
                    border: isMe
                      ? "1px solid oklch(0.65 0.26 12 / 0.28)"
                      : "1px solid oklch(0.20 0.012 15 / 0.70)",
                    boxShadow: isMe
                      ? "0 2px 14px oklch(0.65 0.26 12 / 0.10)"
                      : "0 2px 10px oklch(0.04 0.005 15 / 0.28)",
                  }}
                >
                  <p
                    className="font-sans leading-relaxed"
                    style={{
                      fontSize: "13.5px",
                      color: isMe ? "oklch(0.90 0.008 60)" : "oklch(0.76 0.005 60)",
                    }}
                  >
                    {msg.text}
                  </p>
                </div>
                <p
                  className="font-sans mt-1"
                  style={{
                    fontSize: "9.5px",
                    color: "oklch(0.26 0.008 15)",
                    paddingLeft: isMe ? 0 : "4px",
                    paddingRight: isMe ? "4px" : 0,
                  }}
                >
                  {formatMsgTime(msg.sentAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Composer ── */}
      <div
        className="sticky bottom-0 px-4 py-3 z-20"
        style={{
          background: "oklch(0.085 0.010 15 / 0.97)",
          borderTop: "1px solid oklch(0.15 0.012 15 / 0.70)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-2.5"
          style={{
            background: "oklch(0.12 0.012 15 / 0.85)",
            border: "1px solid oklch(0.22 0.012 15 / 0.65)",
            boxShadow: "inset 0 1px 0 oklch(0.28 0.010 15 / 0.12)",
          }}
        >
          <button
            className="p-1 flex-shrink-0 self-end mb-0.5"
            style={{ color: "oklch(0.26 0.008 15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.44 0.006 60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.26 0.008 15)")}
            aria-label={lang === "ru" ? "Прикрепить" : "Attach"}
          >
            <Paperclip size={16} strokeWidth={1.5} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={1}
            className="flex-1 bg-transparent font-sans resize-none outline-none"
            style={{
              fontSize: "13.5px",
              color: "oklch(0.84 0.005 60)",
              caretColor: "oklch(0.65 0.26 12)",
              lineHeight: "1.5",
              maxHeight: "108px",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="flex-shrink-0 self-end mb-0.5 flex items-center justify-center rounded-full transition-all hover:brightness-110 disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label={t.send}
            style={{
              width: "34px",
              height: "34px",
              background: input.trim() ? "oklch(0.65 0.26 12)" : "oklch(0.18 0.010 15)",
              boxShadow: input.trim() ? "0 0 18px oklch(0.65 0.26 12 / 0.38)" : "none",
              transition: "all 0.15s",
            }}
          >
            <Send size={14} color="white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  ) : (
    /* ── Empty state (desktop) ── */
    <div className="hidden md:flex flex-1 items-center justify-center relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, oklch(0.65 0.26 12 / 0.05) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-5 text-center max-w-xs">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "oklch(0.65 0.26 12 / 0.07)",
            border: "1px solid oklch(0.65 0.26 12 / 0.15)",
            boxShadow: "0 0 32px oklch(0.65 0.26 12 / 0.07)",
          }}
        >
          <MessageCircle
            size={24}
            style={{ color: "oklch(0.65 0.26 12 / 0.55)" }}
            strokeWidth={1.5}
          />
        </div>
        <div>
          <p
            className="font-display font-light mb-2"
            style={{ fontSize: "1.35rem", color: "oklch(0.60 0.005 60)" }}
          >
            {t.empty}
          </p>
          <p
            className="font-sans leading-relaxed"
            style={{ fontSize: "12.5px", color: "oklch(0.30 0.008 15)" }}
          >
            {t.emptySub}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen md:pl-[220px]">
      {ConversationList}
      {ChatThread}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesInner />
    </Suspense>
  )
}
