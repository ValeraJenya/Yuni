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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item"

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
              className="font-sans uppercase tracking-[0.22em] text-text-1"
              style={{ fontSize: "10px" }}
            >
              Yuni
            </p>
            <h1
              className="mt-2 font-display font-light text-text-5"
              style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
            >
              {t.title}
            </h1>
            <p
              className="mt-2 max-w-xl font-sans text-text-2"
              style={{ fontSize: "14px" }}
            >
              {t.subtitle}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={!hasUnread || isMarkingAll}
            className="mt-2 rounded-full bg-muted font-sans font-medium text-text-6 border-primary/22 hover:bg-muted hover:text-text-6 disabled:opacity-40 dark:bg-muted dark:border-primary/22 dark:hover:bg-muted"
            style={{ fontSize: "12px" }}
          >
            {isMarkingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            {t.markAll}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 pb-24 md:px-10 md:pb-10">
        {actionError && (
          <Alert
            variant="warning"
            className="font-sans bg-smoke/55"
            style={{ fontSize: "13px", borderColor: "oklch(0.62 0.22 28 / 0.18)" }}
          >
            <AlertDescription
              className="font-sans"
              style={{ color: "oklch(0.78 0.16 28)" }}
            >
              {actionError}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <StateBlock icon={<Loader2 className="animate-spin" size={18} />} text={t.loading} />
        ) : error ? (
          <StateBlock icon={<Bell size={18} />} text={error} />
        ) : notifications.length === 0 ? (
          <Empty className="min-h-[220px] border bg-background/78 border-carbon">
            <EmptyHeader>
              <EmptyMedia variant="default" className="text-primary">
                <Bell size={18} />
              </EmptyMedia>
              <EmptyTitle
                className="font-sans font-medium text-text-4"
                style={{ fontSize: "14px" }}
              >
                {t.empty}
              </EmptyTitle>
              <EmptyDescription
                className="max-w-xs font-sans text-surface-6"
                style={{ fontSize: "12px" }}
              >
                {t.emptySub}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadNotifications(nextCursor)}
                disabled={isLoadingMore}
                className="mx-auto mt-4 rounded-full bg-surface-2 font-sans font-medium text-text-4 border-surface-3 hover:bg-surface-2 hover:text-text-4 dark:bg-surface-2 dark:border-surface-3 dark:hover:bg-surface-2"
                style={{ fontSize: "12px" }}
              >
                {isLoadingMore && <Loader2 size={14} className="animate-spin" />}
                {t.loadMore}
              </Button>
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
    <Item
      asChild
      size="sm"
      className={`w-full gap-3 p-3 text-left transition-transform hover:-translate-y-0.5 ${
        notification.readAt
          ? "bg-background/86 border-carbon"
          : "bg-smoke/92 border-primary/24"
      }`}
    >
      <button type="button" onClick={onClick}>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/12"
          style={{ color: "oklch(0.70 0.22 18)" }}
        >
          <Icon size={18} />
        </div>
        <ItemContent className="min-w-0 gap-0">
          <div className="flex items-center justify-between gap-3">
            <ItemTitle
              className="min-w-0 truncate font-sans font-semibold text-text-5"
              style={{ fontSize: "14px" }}
            >
              {content.title}
            </ItemTitle>
            <Badge
              variant="outline"
              className={`shrink-0 rounded-full border-transparent px-2 py-0.5 font-sans uppercase tracking-[0.12em] ${
                notification.readAt ? "bg-muted text-surface-6" : "bg-primary/14"
              }`}
              style={{
                fontSize: "8px",
                color: notification.readAt ? undefined : "oklch(0.78 0.16 28)",
              }}
            >
              {notification.readAt ? t.read : t.unread}
            </Badge>
          </div>
          <ItemDescription
            className="mt-1 line-clamp-1 font-sans"
            style={{ fontSize: "13px" }}
          >
            {actorName} · {content.subtitle}
          </ItemDescription>
        </ItemContent>
      </button>
    </Item>
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
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-carbon bg-background/78 px-6 text-center">
      <div className="text-primary">{icon}</div>
      <p
        className="mt-3 font-sans font-medium text-text-4"
        style={{ fontSize: "14px" }}
      >
        {text}
      </p>
      {subtext && (
        <p
          className="mt-1 max-w-xs font-sans text-surface-6"
          style={{ fontSize: "12px" }}
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
