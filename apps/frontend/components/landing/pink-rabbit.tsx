"use client"

interface PinkRabbitProps {
  lang: "ru" | "en"
}

const copy = {
  ru: {
    label: "Экосистема",
    sentence: "Yuni — проект студии Pink Rabbit.",
    sub: "Мы создаём премиальные цифровые продукты о близости, стиле жизни и человеческих связях.",
    products: [
      { name: "Yuni", desc: "Знакомства", active: true },
      { name: "Petal", desc: "Стиль жизни", active: false },
      { name: "Opal", desc: "Сообщество", active: false },
    ],
    liveLabel: "Сейчас",
    soonLabel: "Скоро",
  },
  en: {
    label: "Ecosystem",
    sentence: "Yuni is a Pink Rabbit project.",
    sub: "We build premium digital products about intimacy, lifestyle, and human connection.",
    products: [
      { name: "Yuni", desc: "Dating", active: true },
      { name: "Petal", desc: "Lifestyle", active: false },
      { name: "Opal", desc: "Community", active: false },
    ],
    liveLabel: "Live",
    soonLabel: "Soon",
  },
}

export function PinkRabbit({ lang }: PinkRabbitProps) {
  const t = copy[lang]

  return (
    <section className="relative overflow-hidden">

      <div className="divider-rose" />

      <div className="mx-auto max-w-7xl px-6 md:px-10 py-16 md:py-20">

        {/* Single horizontal strip */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-0">

          {/* Left: brand statement */}
          <div className="flex flex-col gap-3 max-w-xs">
            <span
              className="text-[10px] font-sans tracking-[0.28em] uppercase"
              style={{ color: "oklch(0.38 0.008 15)" }}
            >
              {t.label}
            </span>
            <p
              className="font-display font-light leading-[1.15] tracking-tight"
              style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.7rem)", color: "oklch(0.55 0.008 60)" }}
            >
              {t.sentence}
            </p>
            <p
              className="font-sans leading-relaxed text-pretty"
              style={{ fontSize: "12px", color: "oklch(0.36 0.008 15)" }}
            >
              {t.sub}
            </p>
          </div>

          {/* Right: product roster — Yuni spotlit, others recede */}
          <div className="flex items-end gap-10 md:gap-16">
            {t.products.map((product) => (
              <div key={product.name} className="flex flex-col" style={{ gap: product.active ? "0.5rem" : "0.35rem" }}>
                {product.active ? (
                  /* ── Yuni — hero product treatment ── */
                  <div className="flex flex-col gap-2">
                    {/* Live pill */}
                    <span
                      className="text-[9px] font-sans tracking-[0.24em] uppercase rounded-full px-2.5 py-0.5 self-start"
                      style={{
                        color: "oklch(0.65 0.26 12)",
                        background: "oklch(0.65 0.26 12 / 0.10)",
                        border: "1px solid oklch(0.65 0.26 12 / 0.22)",
                      }}
                    >
                      {t.liveLabel}
                    </span>
                    {/* Brand mark — wordmark only, no icon */}
                    <span
                      className="font-display font-light leading-none"
                      style={{
                        fontSize: "clamp(2.4rem, 4.5vw, 4rem)",
                        color: "oklch(0.88 0.005 60)",
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {product.name}
                    </span>
                    <span
                      className="text-[10px] font-sans tracking-[0.22em] uppercase"
                      style={{ color: "oklch(0.42 0.012 15)" }}
                    >
                      {product.desc}
                    </span>
                  </div>
                ) : (
                  /* ── Other products — subordinate ── */
                  <div className="flex flex-col gap-1">
                    <span
                      className="font-display font-light leading-none"
                      style={{
                        fontSize: "clamp(1.1rem, 2vw, 1.6rem)",
                        color: "oklch(0.22 0.008 15)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {product.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[9px] font-sans tracking-[0.18em] uppercase"
                        style={{ color: "oklch(0.20 0.008 15)" }}
                      >
                        {product.desc}
                      </span>
                      <span
                        className="text-[9px] font-sans tracking-[0.14em] uppercase"
                        style={{ color: "oklch(0.19 0.008 15)" }}
                      >
                        · {t.soonLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
