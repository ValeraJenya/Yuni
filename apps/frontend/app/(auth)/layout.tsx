"use client"

import { LangProvider } from "@/lib/lang-context"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </LangProvider>
  )
}
