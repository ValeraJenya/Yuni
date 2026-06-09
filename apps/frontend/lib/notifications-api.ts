import type { ApiRequestMethod } from "@/lib/auth-api"

export const NOTIFICATIONS_UPDATED_EVENT = "yuni:notifications-updated"

export type NotificationType = "match_created" | "message_received" | "system"

export interface NotificationActor {
  userId: string
  handle: string
  displayName: string | null
  primaryPhotoUrl: string | null
}

export interface NotificationItem {
  id: string
  type: NotificationType
  messageKey: string
  createdAt: string
  readAt: string | null
  actor: NotificationActor | null
  matchId: string | null
  conversationId: string | null
  messageId: string | null
}

export interface NotificationsListResponse {
  notifications: NotificationItem[]
  nextCursor: string | null
}

export interface NotificationsUnreadCountResponse {
  unreadCount: number
}

export interface NotificationReadResponse {
  notification: NotificationItem
}

export interface NotificationsReadAllResponse {
  success: true
  markedReadCount: number
}

interface CursorQuery {
  limit?: number
  cursor?: string | null
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

function toQueryString(query: CursorQuery = {}) {
  const searchParams = new URLSearchParams()

  if (query.limit !== undefined) {
    searchParams.set("limit", String(query.limit))
  }

  if (query.cursor) {
    searchParams.set("cursor", query.cursor)
  }

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}

export function emitNotificationsUpdated() {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT))
}

export const notificationsApi = {
  getNotifications(request: AuthenticatedRequest, query: CursorQuery = {}) {
    return request<NotificationsListResponse>(
      `/notifications${toQueryString(query)}`,
    )
  },

  getUnreadCount(request: AuthenticatedRequest) {
    return request<NotificationsUnreadCountResponse>(
      "/notifications/unread-count",
    )
  },

  markRead(request: AuthenticatedRequest, notificationId: string) {
    return request<NotificationReadResponse>(
      `/notifications/${encodeURIComponent(notificationId)}/read`,
      {
        method: "POST",
      },
    )
  },

  markAllRead(request: AuthenticatedRequest) {
    return request<NotificationsReadAllResponse>("/notifications/read-all", {
      method: "POST",
    })
  },
}
