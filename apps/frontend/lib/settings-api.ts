import type { ApiRequestMethod } from "@/lib/auth-api"

export type ProfileVisibilityMode = "open" | "private"

export interface PrivacySettings {
  profileVisibilityMode: ProfileVisibilityMode
  showDistance: boolean
  showOnlineStatus: boolean
  showDisplayNameInPrivateMode: boolean
  showBioInPrivateMode: boolean
  showLocationInPrivateMode: boolean
  discoverable: boolean
  allowMessagesFromMatchesOnly: boolean
}

export interface NotificationSettings {
  likesEnabled: boolean
  matchesEnabled: boolean
  messagesEnabled: boolean
  productUpdatesEnabled: boolean
}

export interface PrivacySettingsResponse {
  privacySettings: PrivacySettings
}

export interface NotificationSettingsResponse {
  notificationSettings: NotificationSettings
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

/**
 * Контракт зеркалит `SettingsController` (Task 057). Поле
 * `anonymousAvatarKey` бэкенд намеренно не отдаёт — оно ждёт отдельного
 * security-решения, поэтому и здесь его нет.
 */
export const settingsApi = {
  getPrivacy(request: AuthenticatedRequest) {
    return request<PrivacySettingsResponse>("/settings/privacy")
  },

  updatePrivacy(request: AuthenticatedRequest, payload: Partial<PrivacySettings>) {
    return request<PrivacySettingsResponse>("/settings/privacy", {
      method: "PATCH",
      body: payload,
    })
  },

  getNotifications(request: AuthenticatedRequest) {
    return request<NotificationSettingsResponse>("/settings/notifications")
  },

  updateNotifications(
    request: AuthenticatedRequest,
    payload: Partial<NotificationSettings>,
  ) {
    return request<NotificationSettingsResponse>("/settings/notifications", {
      method: "PATCH",
      body: payload,
    })
  },
}
