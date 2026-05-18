import type { ReactNode } from "react"
import { LangProvider } from "@/lib/lang-context"
import { DemoSessionProvider } from "@/lib/demo-session"
import { AppContent } from "@/features/app-shell/components/app-content"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <DemoSessionProvider>
        <AppContent>{children}</AppContent>
      </DemoSessionProvider>
    </LangProvider>
  )
}
