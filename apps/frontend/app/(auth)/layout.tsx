"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LangProvider } from "@/lib/lang-context"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/discover")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <span
          className="font-sans tracking-[0.18em] uppercase"
          style={{ fontSize: "10px", color: "oklch(0.42 0.008 15)" }}
        >
          Loading
        </span>
      </div>
    )
  }

  return (
    <LangProvider>
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </LangProvider>
  )
}
