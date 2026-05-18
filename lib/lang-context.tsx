"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Lang } from "@/types/auth"

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggle: () => void
}

const LangContext = createContext<LangContextValue>({
  lang: "ru",
  setLang: () => {},
  toggle: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru")
  const toggle = () => setLang((l) => (l === "ru" ? "en" : "ru"))
  return (
    <LangContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
