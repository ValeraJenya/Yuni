import type { ReactNode } from "react"
import { LangProvider } from "@/lib/lang-context"
import { AppContent } from "@/features/app-shell/components/app-content"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <AppContent>{children}</AppContent>
    </LangProvider>
  )
}
