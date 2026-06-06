import type { ApiRequestMethod } from "@/lib/auth-api"

export type LikeInteractionAction = "like" | "skip"

export interface LikeInteraction {
  targetProfileUserId: string
  action: LikeInteractionAction
  expiresAt: string
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

export const likesApi = {
  likeProfile(request: AuthenticatedRequest, targetProfileUserId: string) {
    return request<{ interaction: LikeInteraction }>(
      `/likes/${encodeURIComponent(targetProfileUserId)}`,
      {
        method: "POST",
      },
    )
  },

  skipProfile(request: AuthenticatedRequest, targetProfileUserId: string) {
    return request<{ interaction: LikeInteraction }>(
      `/likes/${encodeURIComponent(targetProfileUserId)}/skip`,
      {
        method: "POST",
      },
    )
  },
}
