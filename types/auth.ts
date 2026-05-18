export type Lang = "ru" | "en"

export interface AuthUser {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  name: string
  email: string
  password: string
  birthdate: string
  agreedToTerms: boolean
  agreedToAge: boolean
}

export interface ForgotPasswordPayload {
  email: string
}

export type AuthFormState = "idle" | "loading" | "success" | "error"
