export type Lang = "ru" | "en"

export interface AuthUser {
  id: string
  email: string
  status: string
  createdAt: string
  profile: {
    handle: string
    displayName: string
  } | null
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  email: string
  password: string
  handle: string
  displayName: string
  birthDate: string
}

export interface ForgotPasswordPayload {
  email: string
}

export type AuthFormState = "idle" | "loading" | "success" | "error"
