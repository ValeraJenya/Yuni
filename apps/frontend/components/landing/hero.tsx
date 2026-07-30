"use client"

import { ArrowRight } from "lucide-react"

interface HeroProps {
  lang: "ru" | "en"
}

const copy = {
  ru: {
    eyebrow: "Знакомства без спешки",
    line1: "Замечать.",
    line2: "Слышать.",
    line3: "Сближаться.",
    tagline: "Не листать людей.\nЗамечать человека.",
    sub: "Yuni — спокойное пространство для честных знакомств и разговоров, которые хочется продолжить.",
    cta: "Познакомиться",
    ctaSub: "Войти",
  },
  en: {
    eyebrow: "Dating without the rush",
    line1: "Notice.",
    line2: "Listen.",
    line3: "Connect.",
    tagline: "People are not profiles.\nMake room for a real person.",
    sub: "Yuni is a calm space for honest introductions and conversations worth continuing.",
    cta: "Meet someone",
    ctaSub: "Sign in",
  },
}

export function Hero({ lang }: HeroProps) {
  const t = copy[lang]

  return (
    <section className="relative min-h-screen min-h-[100svh] overflow-hidden bg-background">

      {/* ── Background ─────────────────────────────────────── */}
      <div className="absolute inset-0 bg-background" />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.028,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Portrait — right half, bleeds to edge ──────────── */}
      <div
        className="absolute top-0 bottom-0 right-0 hidden lg:block"
        style={{ width: "44vw" }}
      >
        {/* Portrait */}
        <img
          src="/hero-portrait.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-background/35" />
      </div>

      {/* ── Text content ───────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex min-h-screen min-h-[100svh] max-w-7xl flex-col justify-center px-6 pb-14 pt-28 md:px-10 md:pb-20">

        {/* Eyebrow */}
        <div className="mb-8 flex items-center gap-3 md:mb-14">
          <span className="h-px w-6 flex-shrink-0 bg-primary" />
          <span className="font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-primary">
            {t.eyebrow}
          </span>
        </div>

        {/* Headline — asymmetric, left-anchored, runs wide */}
        <div className="flex flex-col">
          <h1
            className="font-display text-[clamp(3.25rem,16vw,10.5rem)] font-light leading-[0.9] tracking-[-0.015em]"
          >
            <span className="block text-foreground">{t.line1}</span>
            <span className="block italic text-muted-foreground">
              {t.line2}
            </span>
            <span className="block text-primary">
              {t.line3}
            </span>
          </h1>
        </div>

        {/* Bottom strip: tagline + sub + CTA */}
        <div className="mt-10 flex max-w-sm flex-col gap-5 md:mt-16 md:gap-8">

          {/* Emotional tagline — warm, direct */}
          <p className="whitespace-pre-line text-pretty font-display text-[clamp(1rem,1.8vw,1.25rem)] font-light italic leading-[1.3] text-secondary-foreground">
            {t.tagline}
          </p>

          <p className="text-pretty font-sans text-[13px] leading-relaxed text-muted-foreground">
            {t.sub}
          </p>

          <div className="flex items-center gap-6">
            <a
              href="/join"
              className="group inline-flex items-center gap-2.5 rounded-md bg-primary px-7 py-3.5 font-sans text-[13px] font-semibold tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {t.cta}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/signin"
              className="font-sans text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.ctaSub}
            </a>
          </div>
        </div>

        {/* Scroll indicator — bottom center */}
        <div
          className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
          style={{ opacity: 0.35 }}
        >
          <div className="h-10 w-px bg-muted-foreground" />
          <span className="font-sans text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
            {lang === "ru" ? "Далее" : "Scroll"}
          </span>
        </div>
      </div>
    </section>
  )
}
