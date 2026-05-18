"use client"

interface SafetyProps {
  lang: "ru" | "en"
}

const copy = {
  ru: {
    chapterLabel: "03 — Безопасность",
    headline: "Твоя безопасность —\nнаш стандарт.",
    sub: "Yuni создан с заботой о каждом пользователе. Мы не просто следуем правилам — мы их устанавливаем.",
    items: [
      { title: "Ручная верификация", body: "Каждый аккаунт проверяется нашей командой до появления в системе." },
      { title: "Шифрование", body: "Переписка и личные данные защищены сквозным шифрованием." },
      { title: "Приватный режим", body: "Ты сам решаешь, кто видит твой профиль и когда." },
      { title: "Живая модерация", body: "Наша команда реагирует на жалобы круглосуточно." },
    ],
  },
  en: {
    chapterLabel: "03 — Safety",
    headline: "Your safety is\nour standard.",
    sub: "Yuni is built with care for every person on it. We don't just follow rules — we set them.",
    items: [
      { title: "Manual verification", body: "Every account is reviewed by our team before appearing in the system." },
      { title: "Encryption", body: "Messages and personal data are protected with end-to-end encryption." },
      { title: "Private mode", body: "You decide who sees your profile and when." },
      { title: "Live moderation", body: "Our moderation team responds to reports around the clock." },
    ],
  },
}

export function Safety({ lang }: SafetyProps) {
  const t = copy[lang]

  return (
    <section id="safety" className="relative overflow-hidden">

      {/* Full-width obsidian panel — contrasted background */}
      <div
        className="absolute inset-0"
        style={{ background: "oklch(0.065 0.008 15)" }}
      />

      {/* Large rose glow — top right corner */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          right: "-15%",
          width: "60vw",
          height: "80vh",
          background: "radial-gradient(ellipse at center, oklch(0.65 0.26 12 / 0.07) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 md:px-10 pt-20 pb-28 md:pb-40">

        {/* Chapter label */}
        <span
          className="text-[10px] font-sans tracking-[0.28em] uppercase block mb-16"
          style={{ color: "oklch(0.65 0.26 12 / 0.60)" }}
        >
          {t.chapterLabel}
        </span>

        {/* Main layout — asymmetric two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-16 lg:gap-28 items-start">

          {/* Left: large headline + sub */}
          <div className="flex flex-col gap-10">
            <h2
              className="font-display font-light leading-[0.97] tracking-[-0.01em] whitespace-pre-line text-balance"
              style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)", color: "oklch(0.93 0.005 60)" }}
            >
              {t.headline}
            </h2>
            <p
              className="font-sans leading-[1.75] max-w-sm text-pretty"
              style={{ fontSize: "14px", color: "oklch(0.44 0.008 15)" }}
            >
              {t.sub}
            </p>

            {/* Decorative word watermark */}
            <div
              aria-hidden="true"
              className="font-display font-light leading-none select-none mt-4"
              style={{
                fontSize: "clamp(5rem, 14vw, 13rem)",
                color: "oklch(0.65 0.26 12 / 0.04)",
                letterSpacing: "-0.02em",
              }}
            >
              safe
            </div>
          </div>

          {/* Right: prose list — no icon boxes, just clean type */}
          <div className="flex flex-col divide-y" style={{ borderColor: "oklch(0.20 0.010 15 / 0.6)" }}>
            {t.items.map((item, i) => (
              <div key={i} className="flex gap-6 py-7 first:pt-0 last:pb-0 items-start">
                <span
                  className="font-display font-light leading-none flex-shrink-0 mt-1"
                  style={{ fontSize: "1rem", color: "oklch(0.65 0.26 12 / 0.35)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3
                    className="font-sans font-semibold tracking-wide"
                    style={{ fontSize: "13px", color: "oklch(0.78 0.005 60)" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="font-sans leading-relaxed text-pretty"
                    style={{ fontSize: "13px", color: "oklch(0.42 0.008 15)" }}
                  >
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
