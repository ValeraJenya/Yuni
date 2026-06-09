import type { ApiRequestMethod } from "@/lib/auth-api"

export interface ChatParticipantSummary {
  userId: string
  handle: string
  displayName: string | null
  primaryPhotoUrl: string | null
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderUserId: string
  text: string
  status: "sent" | "deleted"
  createdAt: string
}

export interface ConversationSummary {
  conversationId: string
  otherParticipant: ChatParticipantSummary
  lastMessage: ChatMessage | null
  updatedAt: string
  status: "active" | "archived" | "closed"
}

export interface ConversationsListResponse {
  conversations: ConversationSummary[]
  nextCursor: string | null
}

export interface MessagesListResponse {
  messages: ChatMessage[]
  nextCursor: string | null
}

export interface SendMessageResponse {
  message: ChatMessage
}

export interface StartConversationResponse {
  conversation: ConversationSummary
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

export const chatApi = {
  getConversations(request: AuthenticatedRequest, query: CursorQuery = {}) {
    return request<ConversationsListResponse>(
      `/chat/conversations${toQueryString(query)}`,
    )
  },

  getMessages(
    request: AuthenticatedRequest,
    conversationId: string,
    query: CursorQuery = {},
  ) {
    return request<MessagesListResponse>(
      `/chat/conversations/${encodeURIComponent(conversationId)}/messages${toQueryString(
        query,
      )}`,
    )
  },

  sendMessage(
    request: AuthenticatedRequest,
    conversationId: string,
    text: string,
  ) {
    return request<SendMessageResponse>(
      `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
      {
        method: "POST",
        body: {
          text,
        },
      },
    )
  },
}
