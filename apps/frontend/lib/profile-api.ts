import type { ApiRequestMethod } from "@/lib/auth-api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

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
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

export function resolveProfilePhotoUrl(publicUrl: string | null): string | null {
  if (!publicUrl) {
    return null
  }

  if (/^https?:\/\//.test(publicUrl)) {
    return publicUrl
  }

  return `${API_BASE_URL.replace(/\/$/, "")}${
    publicUrl.startsWith("/") ? publicUrl : `/${publicUrl}`
  }`
}

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

  myPhotos(request: AuthenticatedRequest) {
    return request<{ photos: SelfProfilePhoto[] }>("/media/profile-photos/me")
  },

  uploadPhoto(request: AuthenticatedRequest, file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return request<ProfileResponse<SelfProfile> & { photo: SelfProfilePhoto }>(
      "/media/profile-photos",
      {
        method: "POST",
        body: formData,
      },
    )
  },

  setPrimaryPhoto(request: AuthenticatedRequest, photoId: string) {
    return request<ProfileResponse<SelfProfile> & { photos: SelfProfilePhoto[] }>(
      `/media/profile-photos/${encodeURIComponent(photoId)}/primary`,
      {
        method: "PATCH",
      },
    )
  },

  deletePhoto(request: AuthenticatedRequest, photoId: string) {
    return request<
      ProfileResponse<SelfProfile> & {
        success: true
        photos: SelfProfilePhoto[]
      }
    >(`/media/profile-photos/${encodeURIComponent(photoId)}`, {
      method: "DELETE",
    })
  },
}
