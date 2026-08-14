import type { Metadata } from "next"
import { LegalPage } from "@/features/legal/components/legal-page"
import { helpContent } from "@/features/legal/content/help"

export const metadata: Metadata = {
  title: "Справочный центр — Yuni",
  description:
    "Ответы на частые вопросы о Yuni: профиль, совпадения, этапный чат, безопасность, аккаунт и данные.",
}

export default function HelpPage() {
  return <LegalPage content={helpContent} current="help" />
}
