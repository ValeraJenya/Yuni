import type { AuthUser } from "@/types/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

interface BackendErrorBody {
  message?: string | string[]
  error?: string
  statusCode?: number
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
}

export interface RegisterRequest {
  email: string
  password: string
  handle: string
  displayName: string
  birthDate: string
}

export interface LoginRequest {
  email: string
  password: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly messages: string[],
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export type ApiRequestMethod = "GET" | "POST" | "PATCH" | "DELETE"

interface ApiRequestOptions {
  method?: ApiRequestMethod
  body?: unknown
  accessToken?: string | null
}

function buildUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, "")}${path}`
}

async function parseError(response: Response): Promise<ApiError> {
  let body: BackendErrorBody | null = null

  try {
    body = (await response.json()) as BackendErrorBody
  } catch {
    body = null
  }

  const messages = Array.isArray(body?.message)
    ? body.message
    : [body?.message ?? response.statusText ?? "Request failed"]
  const message = messages[0] ?? "Request failed"

  return new ApiError(message, response.status, messages)
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  const isFormDataBody =
    typeof FormData !== "undefined" && options.body instanceof FormData
  let requestBody: BodyInit | undefined

  if (options.body !== undefined && !isFormDataBody) {
    headers["Content-Type"] = "application/json"
  }

  if (options.body !== undefined) {
    requestBody = isFormDataBody
      ? (options.body as BodyInit)
      : JSON.stringify(options.body)
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`
  }

  const response = await fetch(buildUrl(path), {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: requestBody,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return (await response.json()) as T
}

export const authApi = {
  register(payload: RegisterRequest) {
    return apiRequest<AuthSession>("/auth/register", {
      method: "POST",
      body: payload,
    })
  },

  login(payload: LoginRequest) {
    return apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: payload,
    })
  },

  refresh() {
    return apiRequest<AuthSession>("/auth/refresh", {
      method: "POST",
    })
  },

  logout() {
    return apiRequest<{ success: true }>("/auth/logout", {
      method: "POST",
    })
  },

  me(accessToken: string) {
    return apiRequest<{ user: AuthUser }>("/auth/me", {
      accessToken,
    })
  },
}
