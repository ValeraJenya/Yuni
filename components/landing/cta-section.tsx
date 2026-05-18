"use client"

import { ArrowRight } from "lucide-react"

interface CtaSectionProps {
  lang: "ru" | "en"
}

const copy = {
  ru: {
    headline1: "Твоя история",
    headline2: "начинается",
    headline3: "здесь.",
    sub: "Первый шаг — бесплатный.",
    cta: "Создать профиль",
    ctaSub: "Уже есть аккаунт? Войти",
  },
  en: {
    headline1: "Your story",
    headline2: "starts",
    headline3: "here.",
    sub: "The first step is free.",
    cta: "Create a profile",
    ctaSub: "Already have an account? Sign in",
  },
}

export function CtaSection({ lang }: CtaSectionProps) {
  const t = copy[lang]

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "80vh" }}>

      {/* Full-bleed image */}
      <div className="absolute inset-0">
        <img
          src="/cta-image.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center"
        />
        {/* Heavy dark overlay — keeps text readable */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to right, oklch(0.065 0.008 15 / 0.96) 0%, oklch(0.065 0.008 15 / 0.70) 55%, oklch(0.065 0.008 15 / 0.85) 100%),
              linear-gradient(to top, oklch(0.065 0.008 15) 0%, transparent 50%)
            `,
          }}
        />
        {/* Rose cast */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 30% 50%, oklch(0.65 0.26 12 / 0.08) 0%, transparent 55%)",
          }}
        />
      </div>

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-10 flex flex-col justify-center"
        style={{ minHeight: "80vh", paddingTop: "8rem", paddingBottom: "8rem" }}
      >
        {/* Headline — large, left-anchored */}
        <h2
          className="font-display font-light leading-[0.95] tracking-[-0.01em] mb-12"
          style={{ fontSize: "clamp(4rem, 10vw, 9.5rem)" }}
        >
          <span className="block text-foreground">{t.headline1}</span>
          <span className="block" style={{ color: "oklch(0.96 0.005 60 / 0.28)", fontStyle: "italic" }}>
            {t.headline2}
          </span>
          <span className="block" style={{ color: "oklch(0.65 0.26 12)" }}>
            {t.headline3}
          </span>
        </h2>

        {/* Sub + CTAs — constrained */}
        <div className="flex flex-col gap-7 max-w-xs">
          <p
            className="font-sans"
            style={{ fontSize: "13px", color: "oklch(0.44 0.008 15)" }}
          >
            {t.sub}
          </p>

          <a
            href="/join"
            className="group inline-flex items-center gap-2.5 rounded-full px-8 py-4 font-sans font-semibold tracking-wide text-white transition-all hover:brightness-110 w-fit"
            style={{
              fontSize: "14px",
              background: "oklch(0.65 0.26 12)",
              boxShadow: "0 0 32px oklch(0.65 0.26 12 / 0.30), 0 0 80px oklch(0.65 0.26 12 / 0.10)",
            }}
          >
            {t.cta}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </a>

          <a
            href="/signin"
            className="font-sans transition-colors w-fit"
            style={{ fontSize: "12px", color: "oklch(0.38 0.008 15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.60 0.005 60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.38 0.008 15)")}
          >
            {t.ctaSub}
          </a>
        </div>
      </div>
    </section>
  )
}
