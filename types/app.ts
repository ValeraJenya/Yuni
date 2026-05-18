// ─── Profile ────────────────────────────────────────────────────────────────

export type Gender = "female" | "male" | "non-binary" | "other"
export type LookingFor = "relationship" | "casual" | "friendship" | "unsure"

export interface UserProfile {
  id: string
  name: string
  age: number
  city: string
  country: string
  bio: string
  photos: string[]           // photo URLs, first is primary
  interests: string[]
  gender: Gender
  lookingFor: LookingFor
  isOnline: boolean
  lastSeen?: string          // ISO date string
  isVerified: boolean
  isPremium: boolean
  completionPct: number      // 0–100
  height?: number            // cm
  occupation?: string
  education?: string
  languages?: string[]
}

// ─── Match ──────────────────────────────────────────────────────────────────

export type MatchStatus = "new" | "active" | "muted"

export interface Match {
  id: string
  profile: UserProfile
  matchedAt: string          // ISO date string
  status: MatchStatus
  hasUnread: boolean
  lastMessage?: string
  lastMessageAt?: string
  isSuperLike?: boolean
}

// ─── Chat / Messages ─────────────────────────────────────────────────────────

export type MessageType = "text" | "image" | "sticker" | "system"

export interface Message {
  id: string
  chatId: string
  senderId: string           // "me" | profile id
  type: MessageType
  text?: string
  imageUrl?: string
  sentAt: string             // ISO date string
  isRead: boolean
}

export interface Chat {
  id: string
  match: Match
  messages: Message[]
}

// ─── Discover ────────────────────────────────────────────────────────────────

export type SwipeAction = "like" | "pass" | "superlike"

export interface DiscoverCard {
  profile: UserProfile
  distance?: number          // km
}
