"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  MessageCircle,
  ArrowLeft,
  Send,
  MoreHorizontal,
  Heart,
  Search,
} from "lucide-react"
import { ApiError } from "@/lib/auth-api"
import { chatApi, type ChatMessage, type ConversationSummary } from "@/lib/chat-api"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"

const copy = {
  ru: {
    title: "Сообщения",
    empty: "Выбери переписку",
    emptySub: "Здесь появятся твои чаты с матчами.",
    loading: "Загружаем переписки...",
    loadingMessages: "Загружаем сообщения...",
    loadError: "Не удалось загрузить переписки.",
    messagesError: "Не удалось загрузить сообщения.",
    sendError: "Не удалось отправить сообщение.",
    lastSeen: "Активный матч",
    placeholder: "Написать...",
    today: "Сегодня",
    send: "Отправить",
    noChats: "Пока нет переписок.",
    noMessages: "Сообщений пока нет.",
    loadMore: "Загрузить ещё",
    searchPlaceholder: "Поиск...",
    matchedWith: "Вы совпали",
    sayHi: "Напиши первой",
    youPrefix: "Ты: ",
  },
  en: {
    title: "Messages",
    empty: "Select a conversation",
    emptySub: "Your chats with matches will appear here.",
    loading: "Loading conversations...",
    loadingMessages: "Loading messages...",
    loadError: "Could not load conversations.",
    messagesError: "Could not load messages.",
    sendError: "Could not send message.",
    lastSeen: "Active match",
    placeholder: "Write a message...",
    today: "Today",
    send: "Send",
    noChats: "No conversations yet.",
    noMessages: "No messages yet.",
    loadMore: "Load more",
    searchPlaceholder: "Search...",
    matchedWith: "You matched",
    sayHi: "Say hello first",
    youPrefix: "You: ",
  },
}

const fallbackPhotoUrl = "/hero-portrait.jpg"

function formatMsgTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
}

function getProfileName(conversation: ConversationSummary) {
  return (
    conversation.otherParticipant.displayName ||
    conversation.otherParticipant.handle
  )
}

function getProfilePhoto(conversation: ConversationSummary) {
  return conversation.otherParticipant.primaryPhotoUrl || fallbackPhotoUrl
}

function MessagesInner() {
  const { lang } = useLang()
  const { authenticatedRequest, isLoading: authLoading, user } = useAuth()
  const t = copy[lang]
  const searchParams = useSearchParams()
  const conversationParam = searchParams.get("conversation")

  const [activeId, setActiveId] = useState<string | null>(
    conversationParam ?? null,
  )
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [nextConversationCursor, setNextConversationCursor] = useState<
    string | null
  >(null)
  const [input, setInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isConversationsLoading, setIsConversationsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(Boolean(activeId))
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] =
    useState(false)
  const [isSending, setIsSending] = useState(false)
  const [conversationsError, setConversationsError] = useState<string | null>(
    null,
  )
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeConversation =
    conversations.find((conversation) => conversation.conversationId === activeId) ??
    null

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((conversation) =>
        getProfileName(conversation)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : conversations

  useEffect(() => {
    if (authLoading) {
      return
    }

    let active = true

    chatApi
      .getConversations(authenticatedRequest)
      .then((response) => {
        if (active) {
          setConversations(response.conversations)
          setNextConversationCursor(response.nextCursor)
          setConversationsError(null)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setConversationsError(
            error instanceof ApiError ? error.message : t.loadError,
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsConversationsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [authLoading, authenticatedRequest, t.loadError])

  useEffect(() => {
    if (authLoading || !activeId) {
      return
    }

    let active = true

    chatApi
      .getMessages(authenticatedRequest, activeId, { limit: 50 })
      .then((response) => {
        if (active) {
          setMessages(response.messages)
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setMessages([])
          setMessagesError(
            error instanceof ApiError ? error.message : t.messagesError,
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsMessagesLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [activeId, authLoading, authenticatedRequest, t.messagesError])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, activeId])

  async function loadMoreConversations() {
    if (!nextConversationCursor || isLoadingMoreConversations) {
      return
    }

    setIsLoadingMoreConversations(true)
    setConversationsError(null)

    try {
      const response = await chatApi.getConversations(authenticatedRequest, {
        cursor: nextConversationCursor,
      })
      setConversations((current) => [...current, ...response.conversations])
      setNextConversationCursor(response.nextCursor)
    } catch (error) {
      setConversationsError(error instanceof ApiError ? error.message : t.loadError)
    } finally {
      setIsLoadingMoreConversations(false)
    }
  }

  async function sendMessage() {
    const text = input.trim()

    if (!text || !activeId || isSending) {
      return
    }

    setIsSending(true)
    setSendError(null)

    try {
      const response = await chatApi.sendMessage(
        authenticatedRequest,
        activeId,
        text,
      )
      setMessages((current) => [...current, response.message])
      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.conversationId === activeId
              ? {
                  ...conversation,
                  lastMessage: response.message,
                  updatedAt: response.message.createdAt,
                }
              : conversation,
          )
          .sort(
            (left, right) =>
              new Date(right.updatedAt).getTime() -
              new Date(left.updatedAt).getTime(),
          ),
      )
      setInput("")
    } catch (error) {
      setSendError(error instanceof ApiError ? error.message : t.sendError)
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

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
      <header
        className="px-5 pt-6 pb-4 flex-shrink-0"
        style={{ borderBottom: "1px solid oklch(0.14 0.010 15 / 0.60)" }}
      >
        <div className="flex items-center gap-2.5 mb-4">
          <MessageCircle
            size={16}
            strokeWidth={1.5}
            style={{ color: "oklch(0.65 0.26 12)" }}
          />
          <span
            className="font-display font-light"
            style={{
              fontSize: "1.2rem",
              color: "oklch(0.86 0.005 60)",
              lineHeight: 1.1,
            }}
          >
            {t.title}
          </span>
        </div>

        <div
          className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
          style={{
            background: "oklch(0.12 0.010 15 / 0.70)",
            border: "1px solid oklch(0.20 0.010 15 / 0.55)",
          }}
        >
          <Search
            size={13}
            style={{ color: "oklch(0.32 0.008 15)", flexShrink: 0 }}
          />
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

      <div className="flex flex-col gap-0.5 px-2 py-2 pb-8 overflow-y-auto flex-1">
        {isConversationsLoading ? (
          <p
            className="font-sans px-3 py-8 text-center"
            style={{ fontSize: "12px", color: "oklch(0.36 0.008 15)" }}
          >
            {t.loading}
          </p>
        ) : conversationsError ? (
          <p
            className="font-sans px-3 py-8 text-center"
            role="alert"
            style={{ fontSize: "12px", color: "oklch(0.60 0.18 25 / 0.85)" }}
          >
            {conversationsError}
          </p>
        ) : filteredConversations.length === 0 ? (
          <p
            className="font-sans px-3 py-8 text-center"
            style={{ fontSize: "12px", color: "oklch(0.30 0.008 15)" }}
          >
            {t.noChats}
          </p>
        ) : (
          filteredConversations.map((conversation) => {
            const last = conversation.lastMessage
            const isActive = conversation.conversationId === activeId
            const profileName = getProfileName(conversation)
            const isLastMine = last?.senderUserId === user?.id

            return (
              <button
                key={conversation.conversationId}
                onClick={() => {
                  setIsMessagesLoading(true)
                  setMessagesError(null)
                  setActiveId(conversation.conversationId)
                }}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all relative"
                style={{
                  background: isActive
                    ? "oklch(0.65 0.26 12 / 0.10)"
                    : "transparent",
                  border: isActive
                    ? "1px solid oklch(0.65 0.26 12 / 0.18)"
                    : "1px solid transparent",
                  boxShadow: isActive
                    ? "0 0 18px oklch(0.65 0.26 12 / 0.06)"
                    : "none",
                }}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className="overflow-hidden rounded-full"
                    style={{
                      width: "44px",
                      height: "44px",
                      border: isActive
                        ? "1.5px solid oklch(0.65 0.26 12 / 0.55)"
                        : "1.5px solid oklch(0.20 0.010 15 / 0.50)",
                    }}
                  >
                    <Image
                      src={getProfilePhoto(conversation)}
                      alt={profileName}
                      width={44}
                      height={44}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="font-sans font-medium truncate"
                      style={{ fontSize: "13px", color: "oklch(0.76 0.005 60)" }}
                    >
                      {profileName}
                    </span>
                    {last && (
                      <span
                        className="font-sans flex-shrink-0 ml-2"
                        style={{ fontSize: "10px", color: "oklch(0.26 0.008 15)" }}
                      >
                        {formatMsgTime(last.createdAt)}
                      </span>
                    )}
                  </div>
                  {last ? (
                    <p
                      className="font-sans truncate"
                      style={{ fontSize: "11.5px", color: "oklch(0.34 0.008 15)" }}
                    >
                      {isLastMine ? t.youPrefix : ""}
                      {last.text}
                    </p>
                  ) : (
                    <p
                      className="font-sans italic"
                      style={{ fontSize: "11px", color: "oklch(0.24 0.008 15)" }}
                    >
                      {t.noMessages}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}

        {nextConversationCursor && !isConversationsLoading && (
          <button
            type="button"
            onClick={() => void loadMoreConversations()}
            disabled={isLoadingMoreConversations}
            className="mx-3 mt-3 rounded-full px-4 py-2 font-sans transition-all disabled:opacity-45"
            style={{
              fontSize: "12px",
              color: "oklch(0.68 0.006 60)",
              border: "1px solid oklch(0.22 0.012 15 / 0.70)",
              background: "oklch(0.12 0.012 15 / 0.70)",
            }}
          >
            {t.loadMore}
          </button>
        )}
      </div>
    </aside>
  )

  const ChatThread = activeConversation ? (
    <div className="flex flex-col flex-1 relative" style={{ minHeight: "100dvh" }}>
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-0"
        style={{
          height: "200px",
          background:
            "radial-gradient(ellipse at 50% -20%, oklch(0.65 0.26 12 / 0.07) 0%, transparent 60%)",
        }}
      />

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
          aria-label={lang === "ru" ? "Назад" : "Back"}
        >
          <ArrowLeft size={17} strokeWidth={2} />
        </button>

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
              src={getProfilePhoto(activeConversation)}
              alt={getProfileName(activeConversation)}
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-sans font-medium truncate"
            style={{ fontSize: "13.5px", color: "oklch(0.86 0.005 60)" }}
          >
            {getProfileName(activeConversation)}
          </p>
          <p
            className="font-sans"
            style={{ fontSize: "10.5px", color: "oklch(0.28 0.008 15)" }}
          >
            {t.lastSeen}
          </p>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            className="p-2 rounded-full transition-all"
            style={{ color: "oklch(0.28 0.008 15)" }}
            aria-label="Like profile"
          >
            <Heart size={16} strokeWidth={1.5} />
          </button>
          <button
            className="p-2 rounded-full transition-all"
            style={{ color: "oklch(0.28 0.008 15)" }}
            aria-label="More options"
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div
        className="flex-1 flex flex-col gap-2.5 px-5 py-6 overflow-y-auto relative z-10"
        style={{ paddingBottom: "100px" }}
      >
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
              src={getProfilePhoto(activeConversation)}
              alt={getProfileName(activeConversation)}
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
              {getProfileName(activeConversation)}
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

        <div className="flex items-center gap-3 my-1">
          <div
            className="flex-1 h-px"
            style={{ background: "oklch(0.16 0.010 15 / 0.60)" }}
          />
          <span
            className="font-sans uppercase tracking-[0.12em]"
            style={{ fontSize: "9.5px", color: "oklch(0.24 0.008 15)" }}
          >
            {t.today}
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "oklch(0.16 0.010 15 / 0.60)" }}
          />
        </div>

        {isMessagesLoading ? (
          <p
            className="font-sans text-center py-8"
            style={{ fontSize: "12px", color: "oklch(0.36 0.008 15)" }}
          >
            {t.loadingMessages}
          </p>
        ) : messagesError ? (
          <p
            className="font-sans text-center py-8"
            role="alert"
            style={{ fontSize: "12px", color: "oklch(0.60 0.18 25 / 0.85)" }}
          >
            {messagesError}
          </p>
        ) : messages.length === 0 ? (
          <p
            className="font-sans text-center py-8"
            style={{ fontSize: "12px", color: "oklch(0.30 0.008 15)" }}
          >
            {t.noMessages}
          </p>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderUserId === user?.id
            const prevMsg = messages[idx - 1]
            const sameGroupAsPrev =
              prevMsg && prevMsg.senderUserId === msg.senderUserId

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                style={{ marginTop: sameGroupAsPrev ? "2px" : "8px" }}
              >
                <div
                  className="flex flex-col"
                  style={{
                    maxWidth: "68%",
                    alignItems: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    className="px-4 py-2.5"
                    style={{
                      borderRadius: isMe
                        ? "18px 18px 5px 18px"
                        : "18px 18px 18px 5px",
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
                      className="font-sans leading-relaxed whitespace-pre-wrap break-words"
                      style={{
                        fontSize: "13.5px",
                        color: isMe
                          ? "oklch(0.90 0.008 60)"
                          : "oklch(0.76 0.005 60)",
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
                    {formatMsgTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

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
        {sendError && (
          <p
            className="font-sans mb-2 rounded-xl px-3 py-2"
            role="alert"
            style={{
              fontSize: "11.5px",
              color: "oklch(0.60 0.18 25 / 0.85)",
              background: "oklch(0.11 0.012 15 / 0.80)",
              border: "1px solid oklch(0.55 0.20 25 / 0.25)",
            }}
          >
            {sendError}
          </p>
        )}
        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-2.5"
          style={{
            background: "oklch(0.12 0.012 15 / 0.85)",
            border: "1px solid oklch(0.22 0.012 15 / 0.65)",
            boxShadow: "inset 0 1px 0 oklch(0.28 0.010 15 / 0.12)",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            maxLength={2000}
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
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isSending}
            className="flex-shrink-0 self-end mb-0.5 flex items-center justify-center rounded-full transition-all hover:brightness-110 disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label={t.send}
            style={{
              width: "34px",
              height: "34px",
              background: input.trim()
                ? "oklch(0.65 0.26 12)"
                : "oklch(0.18 0.010 15)",
              boxShadow: input.trim()
                ? "0 0 18px oklch(0.65 0.26 12 / 0.38)"
                : "none",
              transition: "all 0.15s",
            }}
          >
            <Send size={14} color="white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  ) : (
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
