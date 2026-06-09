"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Heart, Loader2, MessageCircle } from "lucide-react"
import { ApiError } from "@/lib/auth-api"
import { useAuth } from "@/lib/auth-context"
import { useLang } from "@/lib/lang-context"
import {
  emitNotificationsUpdated,
  notificationsApi,
  type NotificationItem,
} from "@/lib/notifications-api"

const COPY = {
  ru: {
    title: "Уведомления",
    subtitle: "Новые матчи и сообщения внутри Yuni.",
    markAll: "Прочитать все",
    loading: "Загрузка уведомлений...",
    loadMore: "Загрузить еще",
    empty: "Пока тихо.",
    emptySub: "Новые матчи и сообщения появятся здесь.",
    error: "Не удалось загрузить уведомления.",
    markError: "Не удалось обновить уведомление.",
    match: "Новый матч",
    matchSub: "Вы понравились друг другу.",
    message: "Новое сообщение",
    messageSub: "Откройте чат, чтобы ответить.",
    system: "Обновление Yuni",
    systemSub: "Системное уведомление.",
    unknownActor: "Yuni",
    read: "Прочитано",
    unread: "Новое",
  },
  en: {
    title: "Notifications",
    subtitle: "New matches and messages inside Yuni.",
    markAll: "Mark all read",
    loading: "Loading notifications...",
    loadMore: "Load more",
    empty: "Nothing here yet.",
    emptySub: "New matches and messages will appear here.",
    error: "Could not load notifications.",
    markError: "Could not update notification.",
    match: "New match",
    matchSub: "You liked each other.",
    message: "New message",
    messageSub: "Open the chat to reply.",
    system: "Yuni update",
    systemSub: "System notification.",
    unknownActor: "Yuni",
    read: "Read",
    unread: "New",
  },
} as const

export default function NotificationsPage() {
  const router = useRouter()
  const { lang } = useLang()
  const t = COPY[lang]
  const { authenticatedRequest, isLoading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const hasUnread = useMemo(
    () => notifications.some((notification) => !notification.readAt),
    [notifications],
  )

  const loadNotifications = useCallback(
    async (cursor?: string | null) => {
      if (authLoading) {
        return
      }

      if (cursor) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const response = await notificationsApi.getNotifications(
          authenticatedRequest,
          {
            limit: 20,
            cursor,
          },
        )

        setNotifications((current) =>
          cursor
            ? [
                ...current,
                ...response.notifications.filter(
                  (notification) =>
                    !current.some((item) => item.id === notification.id),
                ),
              ]
            : response.notifications,
        )
        setNextCursor(response.nextCursor)
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : t.error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [authLoading, authenticatedRequest, t.error],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadNotifications])

  async function markOneRead(notification: NotificationItem) {
    if (notification.readAt) {
      return notification
    }

    const response = await notificationsApi.markRead(
      authenticatedRequest,
      notification.id,
    )
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? response.notification : item,
      ),
    )
    emitNotificationsUpdated()
    return response.notification
  }

  async function handleNotificationClick(notification: NotificationItem) {
    setActionError(null)

    try {
      const updated = await markOneRead(notification)

      if (updated.type === "match_created") {
        router.push("/matches")
        return
      }

      if (updated.type === "message_received" && updated.conversationId) {
        router.push(
          `/messages?conversation=${encodeURIComponent(updated.conversationId)}`,
        )
      }
    } catch (markError) {
      setActionError(
        markError instanceof ApiError ? markError.message : t.markError,
      )
    }
  }

  async function handleMarkAllRead() {
    setActionError(null)
    setIsMarkingAll(true)

    try {
      await notificationsApi.markAllRead(authenticatedRequest)
      const readAt = new Date().toISOString()
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt: notification.readAt ?? readAt,
        })),
      )
      emitNotificationsUpdated()
    } catch (markError) {
      setActionError(
        markError instanceof ApiError ? markError.message : t.markError,
      )
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <div className="min-h-screen md:pl-[220px]">
      <header className="px-5 pt-6 pb-5 md:px-10 md:pt-8 md:pb-6">
        <div className="mx-auto flex w-full max-w-3xl items-start justify-between gap-4">
          <div>
            <p
              className="font-sans uppercase tracking-[0.22em]"
              style={{ fontSize: "10px", color: "oklch(0.52 0.010 60)" }}
            >
              Yuni
            </p>
            <h1
              className="mt-2 font-display font-light"
              style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", color: "oklch(0.92 0.005 60)" }}
            >
              {t.title}
            </h1>
            <p
              className="mt-2 max-w-xl font-sans"
              style={{ fontSize: "14px", color: "oklch(0.58 0.008 60)" }}
            >
              {t.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={!hasUnread || isMarkingAll}
            className="mt-2 inline-flex items-center gap-2 rounded-full px-4 py-2 font-sans font-medium transition-opacity disabled:opacity-40"
            style={{
              fontSize: "12px",
              color: "oklch(0.94 0.005 60)",
              background: "oklch(0.16 0.010 15)",
              border: "1px solid oklch(0.65 0.26 12 / 0.22)",
            }}
          >
            {isMarkingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            {t.markAll}
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 pb-24 md:px-10 md:pb-10">
        {actionError && (
          <div
            className="rounded-lg px-4 py-3 font-sans"
            style={{
              fontSize: "13px",
              color: "oklch(0.78 0.16 28)",
              background: "oklch(0.15 0.03 28 / 0.55)",
              border: "1px solid oklch(0.62 0.22 28 / 0.18)",
            }}
          >
            {actionError}
          </div>
        )}

        {isLoading ? (
          <StateBlock icon={<Loader2 className="animate-spin" size={18} />} text={t.loading} />
        ) : error ? (
          <StateBlock icon={<Bell size={18} />} text={error} />
        ) : notifications.length === 0 ? (
          <StateBlock icon={<Bell size={18} />} text={t.empty} subtext={t.emptySub} />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  lang={lang}
                  onClick={() => void handleNotificationClick(notification)}
                />
              ))}
            </div>

            {nextCursor && (
              <button
                type="button"
                onClick={() => void loadNotifications(nextCursor)}
                disabled={isLoadingMore}
                className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 font-sans font-medium disabled:opacity-50"
                style={{
                  fontSize: "12px",
                  color: "oklch(0.74 0.010 60)",
                  background: "oklch(0.13 0.010 15)",
                  border: "1px solid oklch(0.24 0.012 15)",
                }}
              >
                {isLoadingMore && <Loader2 size={14} className="animate-spin" />}
                {t.loadMore}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function NotificationRow({
  notification,
  lang,
  onClick,
}: {
  notification: NotificationItem
  lang: keyof typeof COPY
  onClick: () => void
}) {
  const t = COPY[lang]
  const actorName =
    notification.actor?.displayName ??
    notification.actor?.handle ??
    t.unknownActor
  const content = getNotificationContent(notification, t)
  const Icon =
    notification.type === "match_created"
      ? Heart
      : notification.type === "message_received"
        ? MessageCircle
        : Bell

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-transform hover:-translate-y-0.5"
      style={{
        background: notification.readAt
          ? "oklch(0.105 0.008 15 / 0.86)"
          : "oklch(0.15 0.018 15 / 0.92)",
        border: notification.readAt
          ? "1px solid oklch(0.18 0.010 15)"
          : "1px solid oklch(0.65 0.26 12 / 0.24)",
      }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{
          background: "oklch(0.65 0.26 12 / 0.12)",
          color: "oklch(0.70 0.22 18)",
        }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p
            className="truncate font-sans font-semibold"
            style={{ fontSize: "14px", color: "oklch(0.90 0.006 60)" }}
          >
            {content.title}
          </p>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 font-sans uppercase tracking-[0.12em]"
            style={{
              fontSize: "8px",
              color: notification.readAt
                ? "oklch(0.42 0.008 60)"
                : "oklch(0.78 0.16 28)",
              background: notification.readAt
                ? "oklch(0.16 0.008 15)"
                : "oklch(0.65 0.26 12 / 0.14)",
            }}
          >
            {notification.readAt ? t.read : t.unread}
          </span>
        </div>
        <p
          className="mt-1 truncate font-sans"
          style={{ fontSize: "13px", color: "oklch(0.56 0.008 60)" }}
        >
          {actorName} · {content.subtitle}
        </p>
      </div>
    </button>
  )
}

function StateBlock({
  icon,
  text,
  subtext,
}: {
  icon: ReactNode
  text: string
  subtext?: string
}) {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center rounded-lg px-6 text-center"
      style={{
        background: "oklch(0.10 0.008 15 / 0.78)",
        border: "1px solid oklch(0.18 0.010 15)",
      }}
    >
      <div style={{ color: "oklch(0.65 0.26 12)" }}>{icon}</div>
      <p
        className="mt-3 font-sans font-medium"
        style={{ fontSize: "14px", color: "oklch(0.76 0.006 60)" }}
      >
        {text}
      </p>
      {subtext && (
        <p
          className="mt-1 max-w-xs font-sans"
          style={{ fontSize: "12px", color: "oklch(0.44 0.008 60)" }}
        >
          {subtext}
        </p>
      )}
    </div>
  )
}

function getNotificationContent(
  notification: NotificationItem,
  t: (typeof COPY)[keyof typeof COPY],
) {
  if (notification.type === "match_created") {
    return {
      title: t.match,
      subtitle: t.matchSub,
    }
  }

  if (notification.type === "message_received") {
    return {
      title: t.message,
      subtitle: t.messageSub,
    }
  }

  return {
    title: t.system,
    subtitle: t.systemSub,
  }
}
