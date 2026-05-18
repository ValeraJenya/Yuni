"use client"

import { useState } from "react"
import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Manifesto } from "@/components/landing/manifesto"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Safety } from "@/components/landing/safety"
import { CtaSection } from "@/components/landing/cta-section"
import { Support } from "@/components/landing/support"
import { PinkRabbit } from "@/components/landing/pink-rabbit"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  const [lang, setLang] = useState<"ru" | "en">("ru")

  function toggleLang() {
    setLang((prev) => (prev === "ru" ? "en" : "ru"))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar lang={lang} onLangToggle={toggleLang} />
      <main>
        <Hero lang={lang} />
        <Manifesto lang={lang} />
        <HowItWorks lang={lang} />
        <Safety lang={lang} />
        <CtaSection lang={lang} />
        <Support lang={lang} />
        <PinkRabbit lang={lang} />
      </main>
      <Footer lang={lang} onLangToggle={toggleLang} />
    </div>
  )
}
