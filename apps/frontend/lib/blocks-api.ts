import type { ApiRequestMethod } from "@/lib/auth-api"

export interface BlockSummary {
  blockedUserId: string
  createdAt: string
  status: "blocked"
}

export interface BlockResponse {
  block: BlockSummary
}

export interface UnblockResponse {
  success: true
  blockedUserId: string
}

export interface BlocksListResponse {
  blocks: BlockSummary[]
  nextCursor: string | null
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

export const blocksApi = {
  blockUser(request: AuthenticatedRequest, targetUserId: string) {
    return request<BlockResponse>(`/blocks/${encodeURIComponent(targetUserId)}`, {
      method: "POST",
    })
  },

  unblockUser(request: AuthenticatedRequest, targetUserId: string) {
    return request<UnblockResponse>(
      `/blocks/${encodeURIComponent(targetUserId)}`,
      {
        method: "DELETE",
      },
    )
  },

  getMyBlocks(
    request: AuthenticatedRequest,
    query: { cursor?: string; limit?: number } = {},
  ) {
    const params = new URLSearchParams()

    if (query.cursor) {
      params.set("cursor", query.cursor)
    }

    if (query.limit) {
      params.set("limit", String(query.limit))
    }

    const suffix = params.size > 0 ? `?${params.toString()}` : ""

    return request<BlocksListResponse>(`/blocks/me${suffix}`)
  },
}
