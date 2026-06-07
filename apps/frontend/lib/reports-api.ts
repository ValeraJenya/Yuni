import type { ApiRequestMethod } from "@/lib/auth-api"

export type ReportReasonCode =
  | "spam"
  | "fake_profile"
  | "harassment"
  | "sexual_content"
  | "hate_speech"
  | "scam_or_money"
  | "underage_suspected"
  | "violence_or_threats"
  | "other"

export interface ReportUserRequest {
  targetUserId: string
  reason: ReportReasonCode
  details?: string | null
}

export interface ReportSummary {
  id: string
  targetUserId: string
  reason: ReportReasonCode
  createdAt: string
  status: "received"
}

export interface ReportResponse {
  report: ReportSummary
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

export const reportsApi = {
  reportUser(request: AuthenticatedRequest, payload: ReportUserRequest) {
    return request<ReportResponse>("/reports", {
      method: "POST",
      body: payload,
    })
  },
}
