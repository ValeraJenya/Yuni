"use client"

import { ArrowRight } from "lucide-react"

interface HeroProps {
  lang: "ru" | "en"
}

const copy = {
  ru: {
    eyebrow: "Только по приглашению",
    line1: "Знакомства,",
    line2: "которые",
    line3: "ощущаются.",
    tagline: "Не свайпы. Не случайность.\nЛюди, с которыми хочется остаться.",
    sub: "Yuni — это пространство для тех, кто ищет настоящую близость. Интеллектуальный подбор. Деликатный дизайн.",
    cta: "Начать",
    ctaSub: "Войти",
  },
  en: {
    eyebrow: "Invite only",
    line1: "Connections",
    line2: "you can",
    line3: "feel.",
    tagline: "Not swipes. Not chance.\nPeople you actually want to stay with.",
    sub: "Yuni is a space for those seeking genuine closeness. Intelligent matching. Deliberate design.",
    cta: "Get started",
    ctaSub: "Sign in",
  },
}

export function Hero({ lang }: HeroProps) {
  const t = copy[lang]

  return (
    <section className="relative min-h-screen overflow-hidden">

      {/* ── Background ─────────────────────────────────────── */}
      <div className="absolute inset-0 bg-obsidian" />

      {/* Left atmospheric glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%",
          left: "-10%",
          width: "55vw",
          height: "70vh",
          background: "radial-gradient(ellipse at center, oklch(0.65 0.26 12 / 0.09) 0%, transparent 65%)",
          filter: "blur(40px)",
        }}
      />

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
        {/* Gradient masks — blends into obsidian on left and bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to right, oklch(0.09 0.008 15) 0%, transparent 30%),
              linear-gradient(to top, oklch(0.09 0.008 15) 0%, transparent 35%)
            `,
          }}
        />
        {/* Subtle rose cast on portrait */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 60% 40%, oklch(0.65 0.26 12 / 0.06) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* ── Text content ───────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 flex flex-col justify-center min-h-screen pt-28 pb-20">

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-14">
          <span
            className="h-px w-6 flex-shrink-0"
            style={{ background: "oklch(0.65 0.26 12 / 0.7)" }}
          />
          <span className="text-[10px] font-sans font-medium tracking-[0.28em] uppercase"
            style={{ color: "oklch(0.65 0.26 12)" }}
          >
            {t.eyebrow}
          </span>
        </div>

        {/* Headline — asymmetric, left-anchored, runs wide */}
        <div className="flex flex-col" style={{ gap: "0.04em" }}>
          <h1
            className="font-display font-light leading-[0.96] tracking-[-0.01em]"
            style={{ fontSize: "clamp(4.5rem, 11vw, 10.5rem)" }}
          >
            <span className="block text-foreground">{t.line1}</span>
            <span className="block" style={{ color: "oklch(0.96 0.005 60 / 0.32)", fontStyle: "italic" }}>
              {t.line2}
            </span>
            <span
              className="block"
              style={{ color: "oklch(0.65 0.26 12)" }}
            >
              {t.line3}
            </span>
          </h1>
        </div>

        {/* Bottom strip: tagline + sub + CTA */}
        <div className="mt-16 flex flex-col gap-8 max-w-sm">

          {/* Emotional tagline — warm, direct */}
          <p
            className="font-display font-light italic leading-[1.3] whitespace-pre-line text-pretty"
            style={{ fontSize: "clamp(1rem, 1.8vw, 1.25rem)", color: "oklch(0.75 0.012 20)" }}
          >
            {t.tagline}
          </p>

          <p className="font-sans leading-relaxed text-pretty"
            style={{ fontSize: "13px", color: "oklch(0.48 0.010 15)" }}
          >
            {t.sub}
          </p>

          <div className="flex items-center gap-6">
            <a
              href="/join"
              className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[13px] font-sans font-semibold tracking-wide text-white transition-all hover:brightness-110"
              style={{
                background: "oklch(0.65 0.26 12)",
                boxShadow: "0 0 28px oklch(0.65 0.26 12 / 0.30), 0 0 60px oklch(0.65 0.26 12 / 0.10)",
              }}
            >
              {t.cta}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="/signin"
              className="font-sans text-[13px] font-medium transition-colors"
              style={{ color: "oklch(0.45 0.010 15)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.75 0.005 60)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.45 0.010 15)")}
            >
              {t.ctaSub}
            </a>
          </div>
        </div>

        {/* Scroll indicator — bottom center */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{ opacity: 0.35 }}
        >
          <div className="h-10 w-px" style={{ background: "linear-gradient(to bottom, oklch(0.55 0.010 15), transparent)" }} />
          <span className="text-[9px] font-sans tracking-[0.28em] uppercase"
            style={{ color: "oklch(0.45 0.010 15)" }}
          >
            {lang === "ru" ? "Далее" : "Scroll"}
          </span>
        </div>
      </div>
    </section>
  )
}
