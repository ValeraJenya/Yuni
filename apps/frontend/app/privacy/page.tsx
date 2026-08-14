import type { Metadata } from "next"
import { LegalPage } from "@/features/legal/components/legal-page"
import { privacyContent } from "@/features/legal/content/privacy"

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Yuni",
  description:
    "Какие данные Yuni собирает, зачем, кому передаёт и как вы можете ими управлять.",
}

export default function PrivacyPage() {
  return <LegalPage content={privacyContent} current="privacy" />
}
