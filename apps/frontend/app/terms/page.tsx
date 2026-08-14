import type { Metadata } from "next"
import { LegalPage } from "@/features/legal/components/legal-page"
import { termsContent } from "@/features/legal/content/terms"

export const metadata: Metadata = {
  title: "Условия использования — Yuni",
  description:
    "Правила пользования Yuni: кто может зарегистрироваться, как работают знакомства, модерация и удаление аккаунта.",
}

export default function TermsPage() {
  return <LegalPage content={termsContent} current="terms" />
}
