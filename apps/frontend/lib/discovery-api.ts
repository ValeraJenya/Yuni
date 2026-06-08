import type { ApiRequestMethod } from "@/lib/auth-api"
import type { Gender, LookingFor, UserProfile } from "@/types/app"

export interface DiscoveryPhoto {
  publicUrl: string
}

export interface DiscoveryCard {
  userId: string
  handle: string
  displayName: string
  bio: string | null
  gender: string | null
  lookingFor: string | null
  city: string | null
  country: string | null
  age: number
  primaryPhotoUrl: string | null
  photos: DiscoveryPhoto[]
}

export interface DiscoveryCardsResponse {
  cards: DiscoveryCard[]
  nextCursor: string | null
}

interface DiscoveryCardsQuery {
  limit?: number
  cursor?: string | null
}

type AuthenticatedRequest = <T>(
  path: string,
  options?: { method?: ApiRequestMethod; body?: unknown },
) => Promise<T>

const fallbackPhotoUrl = "/hero-portrait.jpg"

export const discoveryApi = {
  getCards(request: AuthenticatedRequest, query: DiscoveryCardsQuery = {}) {
    const searchParams = new URLSearchParams()

    if (query.limit !== undefined) {
      searchParams.set("limit", String(query.limit))
    }

    if (query.cursor) {
      searchParams.set("cursor", query.cursor)
    }

    const queryString = searchParams.toString()

    return request<DiscoveryCardsResponse>(
      `/discovery/cards${queryString ? `?${queryString}` : ""}`,
    )
  },
}

export function toUserProfile(card: DiscoveryCard): UserProfile {
  const photoUrls = [
    card.primaryPhotoUrl,
    ...card.photos.map((photo) => photo.publicUrl),
  ].filter((url): url is string => Boolean(url))
  const uniquePhotoUrls = Array.from(new Set(photoUrls))

  return {
    id: card.userId,
    name: card.displayName || card.handle,
    age: card.age,
    city: card.city ?? card.country ?? "",
    country: card.country ?? "",
    bio: card.bio ?? "",
    photos: uniquePhotoUrls.length > 0 ? uniquePhotoUrls : [fallbackPhotoUrl],
    interests: [],
    gender: toGender(card.gender),
    lookingFor: toLookingFor(card.lookingFor),
    isOnline: false,
    isVerified: false,
    isPremium: false,
    completionPct: 100,
  }
}

function toGender(value: string | null): Gender {
  if (
    value === "female" ||
    value === "male" ||
    value === "non-binary" ||
    value === "other"
  ) {
    return value
  }

  return "other"
}

function toLookingFor(value: string | null): LookingFor {
  if (
    value === "relationship" ||
    value === "casual" ||
    value === "friendship" ||
    value === "unsure"
  ) {
    return value
  }

  return "unsure"
}
