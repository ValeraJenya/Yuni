"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  ApiError,
  apiRequest,
  authApi,
  type ApiRequestMethod,
  type AuthSession,
  type LoginRequest,
  type RegisterRequest,
} from "@/lib/auth-api"
import type { AuthUser } from "@/types/auth"

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  register: (payload: RegisterRequest) => Promise<void>
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<AuthSession | null>
  authenticatedRequest: <T>(
    path: string,
    options?: { method?: ApiRequestMethod; body?: unknown },
  ) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshPromiseRef = useRef<Promise<AuthSession | null> | null>(null)
  const accessTokenRef = useRef<string | null>(null)

  const applySession = useCallback((session: AuthSession) => {
    setUser(session.user)
    setAccessToken(session.accessToken)
    accessTokenRef.current = session.accessToken
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    accessTokenRef.current = null
  }, [])

  const refreshSession = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    refreshPromiseRef.current = authApi
      .refresh()
      .then((session) => {
        applySession(session)
        return session
      })
      .catch((error: unknown) => {
        clearSession()

        if (error instanceof ApiError && error.status === 401) {
          return null
        }

        throw error
      })
      .finally(() => {
        refreshPromiseRef.current = null
      })

    return refreshPromiseRef.current
  }, [applySession, clearSession])

  useEffect(() => {
    let active = true

    refreshSession()
      .catch(() => null)
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [refreshSession])

  const register = useCallback(
    async (payload: RegisterRequest) => {
      const session = await authApi.register(payload)
      applySession(session)
    },
    [applySession],
  )

  const login = useCallback(
    async (payload: LoginRequest) => {
      const session = await authApi.login(payload)
      applySession(session)
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const authenticatedRequest = useCallback(
    async <T,>(
      path: string,
      options: { method?: ApiRequestMethod; body?: unknown } = {},
    ): Promise<T> => {
      let token = accessTokenRef.current

      if (!token) {
        const session = await refreshSession()
        token = session?.accessToken ?? null
      }

      try {
        return await apiRequest<T>(path, {
          ...options,
          accessToken: token,
        })
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error
        }

        const session = await refreshSession()

        if (!session) {
          clearSession()
          throw error
        }

        return apiRequest<T>(path, {
          ...options,
          accessToken: session.accessToken,
        })
      }
    },
    [clearSession, refreshSession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      register,
      login,
      logout,
      refreshSession,
      authenticatedRequest,
    }),
    [
      user,
      accessToken,
      isLoading,
      register,
      login,
      logout,
      refreshSession,
      authenticatedRequest,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  return value
}
