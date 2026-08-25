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
  /**
   * Task 079: internal to useAuth(). Not part of the public hook surface —
   * see the destructure in useAuth() below.
   */
  ensureBootstrapped: () => void
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

  /**
   * Task 079: the AuthProvider mounts unconditionally at the root layout,
   * so it must not fire refreshSession() itself — that hit /auth/refresh
   * (and logged a 401) on every anonymous public page. Bootstrap is
   * triggered lazily, once, by the first useAuth() consumer that mounts
   * (see ensureBootstrapped below and its call site in useAuth()).
   *
   * bootstrappedRef is set synchronously so concurrent consumers mounting
   * in the same tick still only trigger one refreshSession() call.
   */
  const bootstrappedRef = useRef(false)

  const ensureBootstrapped = useCallback(() => {
    if (bootstrappedRef.current) {
      return
    }

    bootstrappedRef.current = true

    refreshSession()
      .catch(() => null)
      .finally(() => {
        setIsLoading(false)
      })
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
      ensureBootstrapped,
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
      ensureBootstrapped,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider")
  }

  const { ensureBootstrapped, ...publicValue } = value

  // Task 079: every useAuth() consumer requests bootstrap on mount. This is
  // what makes it structurally impossible for a public page to end up with
  // isLoading stuck at true — anyone reading session state runs this effect.
  // ensureBootstrapped() itself is idempotent (see AuthProvider), so having
  // several consumers on one page never triggers more than one refresh.
  useEffect(() => {
    ensureBootstrapped()
  }, [ensureBootstrapped])

  // value is already memoized in AuthProvider, but the rest-spread above
  // builds a fresh object on every call regardless — without this useMemo,
  // useAuth() would return a new reference on every render even when
  // nothing changed, breaking dependency arrays for anyone who does
  // `const auth = useAuth()` and lists it as a dependency.
  // publicValue is derived from value alone (see destructure above); adding
  // it to the deps array would defeat the memo, since it's a fresh object
  // every render by construction.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => publicValue, [value])
}
