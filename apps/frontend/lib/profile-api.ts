export interface SelfProfilePhoto {
  id: string
  publicUrl: string | null
  blurhash: string | null
  isPrimary: boolean
  position: number
  moderationStatus: string
  publishedAt: string | null
}

export interface SelfProfile {
  userId: string
  handle: string
  displayName: string
  birthDate?: string
  bio: string | null
  gender: string | null
  lookingFor: string | null
  city: string | null
  country: string | null
  isDiscoverable?: boolean
  completedAt?: string | null
  photos: SelfProfilePhoto[]
}

export interface PublicProfilePhoto {
  id: string
  publicUrl: string
  blurhash: string | null
  isPrimary: boolean
  position: number
}

export interface PublicProfile {
  userId: string
  handle: string
  displayName: string | null
  bio: string | null
  gender: string | null
  lookingFor: string | null
  city: string | null
  country: string | null
  photos: PublicProfilePhoto[]
}

export interface UpdateProfileRequest {
  displayName?: string
  bio?: string | null
  gender?: string | null
  lookingFor?: string | null
  city?: string | null
  country?: string | null
  isDiscoverable?: boolean
}

export interface ProfileResponse<TProfile> {
  profile: TProfile
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: "GET" | "POST" | "PATCH"; body?: unknown },
) => Promise<T>

export const profileApi = {
  me(request: AuthenticatedRequest) {
    return request<ProfileResponse<SelfProfile>>("/profiles/me")
  },

  updateMe(request: AuthenticatedRequest, payload: UpdateProfileRequest) {
    return request<ProfileResponse<SelfProfile>>("/profiles/me", {
      method: "PATCH",
      body: payload,
    })
  },

  byHandle(request: AuthenticatedRequest, handle: string) {
    return request<ProfileResponse<PublicProfile>>(
      `/profiles/${encodeURIComponent(handle)}`,
    )
  },
}
