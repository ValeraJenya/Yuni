"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

const SESSION_KEY = "yuni_demo_session"

interface DemoSessionValue {
  isDemo: boolean
  enterDemo: () => void
  exitDemo: () => void
}

const DemoSessionContext = createContext<DemoSessionValue>({
  isDemo: false,
  enterDemo: () => {},
  exitDemo: () => {},
})

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  // Start as true so we avoid a flash-of-gate on first render —
  // we'll correct to false immediately if sessionStorage says no.
  const [isDemo, setIsDemo] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY)
    setIsDemo(stored === "1")
    setHydrated(true)
  }, [])

  function enterDemo() {
    sessionStorage.setItem(SESSION_KEY, "1")
    setIsDemo(true)
  }

  function exitDemo() {
    sessionStorage.removeItem(SESSION_KEY)
    setIsDemo(false)
  }

  return (
    <DemoSessionContext.Provider value={{ isDemo, enterDemo, exitDemo }}>
      {/* Suppress children until hydration so we never flash a wrong gate state */}
      {hydrated ? children : null}
    </DemoSessionContext.Provider>
  )
}

export function useDemoSession() {
  return useContext(DemoSessionContext)
}
