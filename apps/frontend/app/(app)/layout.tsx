import type { ReactNode } from "react"
import { AppContent } from "@/features/app-shell/components/app-content"

export default function AppLayout({ children }: { children: ReactNode }) {
  // LangProvider живёт в корневом layout (Task 052): отдельный инстанс здесь
  // означал бы, что язык, выбранный до логина, снова теряется.
  return <AppContent>{children}</AppContent>
}
