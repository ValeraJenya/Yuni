import type { ApiRequestMethod } from "@/lib/auth-api"
import type { StartConversationResponse } from "@/lib/chat-api"

export interface MatchProfileSummary {
  userId: string
  handle: string
  displayName: string | null
  primaryPhotoUrl: string | null
}

export interface MatchSummary {
  id: string
  matchedProfile: MatchProfileSummary
  matchedAt: string
  expiresAt: string
  status: "active" | "expired" | "unmatched" | "blocked"
  conversationId: string | null
  conversationStarted: boolean
}

export interface MatchesListResponse {
  matches: MatchSummary[]
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

export const matchesApi = {
  getMyMatches(request: AuthenticatedRequest) {
    return request<MatchesListResponse>("/matches/me")
  },

  startConversation(request: AuthenticatedRequest, matchId: string) {
    return request<StartConversationResponse>(
      `/matches/${encodeURIComponent(matchId)}/conversation`,
      {
        method: "POST",
      },
    )
  },
}
