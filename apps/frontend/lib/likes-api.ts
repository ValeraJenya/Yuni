import type { ApiRequestMethod } from "@/lib/auth-api"
import type { MatchSummary } from "@/lib/matches-api"

export type LikeInteractionAction = "like" | "skip"

export interface LikeInteraction {
  targetProfileUserId: string
  action: LikeInteractionAction
  expiresAt: string
}

export interface LikeProfileResponse {
  interaction: LikeInteraction
  match?: MatchSummary
}

export interface SkipProfileResponse {
  interaction: LikeInteraction
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

export const likesApi = {
  likeProfile(request: AuthenticatedRequest, targetProfileUserId: string) {
    return request<LikeProfileResponse>(
      `/likes/${encodeURIComponent(targetProfileUserId)}`,
      {
        method: "POST",
      },
    )
  },

  skipProfile(request: AuthenticatedRequest, targetProfileUserId: string) {
    return request<SkipProfileResponse>(
      `/likes/${encodeURIComponent(targetProfileUserId)}/skip`,
      {
        method: "POST",
      },
    )
  },
}
