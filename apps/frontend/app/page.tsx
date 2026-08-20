"use client"

import { useLang } from "@/lib/lang-context"
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
  // Task 052: лендинг больше не держит собственное состояние языка — иначе
  // выбор EN здесь терялся при переходе на регистрацию.
  const { lang, toggle: toggleLang } = useLang()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/*
        Scroll reveals start hidden in CSS and are un-hidden by IntersectionObserver.
        Without JS that never fires, so pin them to their resting state.
      */}
      <noscript>
        <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
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
