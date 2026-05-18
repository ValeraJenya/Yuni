"use client"

interface SupportProps {
  lang: "ru" | "en"
}

const copy = {
  ru: {
    chapterLabel: "04 — Поддержка",
    headline: "Мы рядом.",
    body: "Реальные люди, живые ответы. Напиши нам — обычно отвечаем в течение нескольких часов.",
    emailLabel: "Написать",
    email: "hello@yuni.app",
    helpLabel: "Справочный центр",
    helpHref: "/help",
  },
  en: {
    chapterLabel: "04 — Support",
    headline: "We are here.",
    body: "Real people, real responses. Write to us — we usually reply within a few hours.",
    emailLabel: "Write to us",
    email: "hello@yuni.app",
    helpLabel: "Help centre",
    helpHref: "/help",
  },
}

export function Support({ lang }: SupportProps) {
  const t = copy[lang]

  return (
    <section id="support" className="relative overflow-hidden">

      <div className="divider-rose" />

      <div className="mx-auto max-w-7xl px-6 md:px-10 pt-20 pb-28 md:pb-40">

        {/* Chapter label */}
        <span
          className="text-[10px] font-sans tracking-[0.28em] uppercase block mb-16"
          style={{ color: "oklch(0.65 0.26 12 / 0.60)" }}
        >
          {t.chapterLabel}
        </span>

        {/* Asymmetric two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-24 items-end">

          {/* Left: headline */}
          <h2
            className="font-display font-light leading-[0.97] tracking-[-0.01em]"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)", color: "oklch(0.93 0.005 60)" }}
          >
            {t.headline}
          </h2>

          {/* Right: body + contact strip */}
          <div className="flex flex-col gap-10">
            <p
              className="font-sans leading-[1.75] max-w-md text-pretty"
              style={{ fontSize: "14px", color: "oklch(0.44 0.008 15)" }}
            >
              {t.body}
            </p>

            {/* Contact row */}
            <div
              className="flex flex-col sm:flex-row sm:items-center gap-8 pt-6"
              style={{ borderTop: "1px solid oklch(0.20 0.010 15 / 0.50)" }}
            >
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-sans tracking-[0.22em] uppercase"
                  style={{ color: "oklch(0.38 0.008 15)" }}
                >
                  {t.emailLabel}
                </span>
                <a
                  href={`mailto:${t.email}`}
                  className="font-sans font-medium transition-colors"
                  style={{ fontSize: "15px", color: "oklch(0.65 0.26 12)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.75 0.20 12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
                >
                  {t.email}
                </a>
              </div>

              <div
                className="hidden sm:block w-px self-stretch"
                style={{ background: "oklch(0.20 0.010 15 / 0.50)" }}
              />

              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-sans tracking-[0.22em] uppercase"
                  style={{ color: "oklch(0.38 0.008 15)" }}
                >
                  {lang === "ru" ? "Документация" : "Docs"}
                </span>
                <a
                  href={t.helpHref}
                  className="font-sans font-medium transition-colors"
                  style={{ fontSize: "15px", color: "oklch(0.55 0.005 60)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.80 0.005 60)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.55 0.005 60)")}
                >
                  {t.helpLabel}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
