"use client"

interface ManifestoProps {
  lang: "ru" | "en"
}

const copy = {
  ru: {
    chapterLabel: "01 — О нас",
    bigStatement: "Другой подход\nк близости.",
    col1: "Мы создали Yuni, потому что устали от свайпов без смысла и алгоритмов без души. Нам хотелось чего-то, что уважает твоё время и помогает найти людей, с которыми действительно есть о чём говорить.",
    col2: "Это не очередное приложение для знакомств. Это пространство, выстроенное вокруг намеренности, конфиденциальности и глубины — трёх вещей, которых большинство сервисов никогда не предлагали.",
    pullQuote: "Знакомство — это не игра.\nЭто начало истории.",
    pillars: ["Намеренность", "Конфиденциальность", "Верификация", "Глубина"],
  },
  en: {
    chapterLabel: "01 — About",
    bigStatement: "A different\napproach.",
    col1: "We built Yuni because we were tired of soulless swipes and cold algorithms. We wanted something that respects your time and helps you find people you genuinely want to talk to.",
    col2: "This is not another dating app. It is a space built around intentionality, privacy, and depth — three things most services have never offered.",
    pullQuote: "Dating is not a game.\nIt is the beginning of a story.",
    pillars: ["Intentionality", "Privacy", "Verification", "Depth"],
  },
}

export function Manifesto({ lang }: ManifestoProps) {
  const t = copy[lang]

  return (
    <section id="about" className="relative overflow-hidden">

      {/* ── Top thin border ─────────────────────────────────── */}
      <div className="divider-rose" />

      {/* ── Chapter marker row ──────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pt-20 pb-0 flex items-center justify-between">
        <span
          className="text-[10px] font-sans tracking-[0.28em] uppercase"
          style={{ color: "oklch(0.65 0.26 12 / 0.60)" }}
        >
          {t.chapterLabel}
        </span>
        {/* Pillar tags — horizontal strip, right-aligned */}
        <div className="hidden md:flex items-center gap-6">
          {t.pillars.map((p) => (
            <span
              key={p}
              className="text-[10px] font-sans tracking-[0.20em] uppercase"
              style={{ color: "oklch(0.38 0.010 15)" }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* ── Massive editorial statement ─────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pt-12 pb-0">
        <h2
          className="font-display font-light leading-[0.94] tracking-[-0.015em] whitespace-pre-line text-foreground"
          style={{ fontSize: "clamp(3.8rem, 9.5vw, 9rem)" }}
        >
          {t.bigStatement}
        </h2>
      </div>

      {/* ── Two-column body text — editorial layout ──────────── */}
      <div className="mx-auto max-w-7xl px-6 md:px-10 pt-14 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 max-w-5xl ml-auto">
          <p
            className="font-sans leading-[1.75] text-pretty"
            style={{ fontSize: "14px", color: "oklch(0.50 0.010 15)" }}
          >
            {t.col1}
          </p>
          <p
            className="font-sans leading-[1.75] text-pretty"
            style={{ fontSize: "14px", color: "oklch(0.50 0.010 15)" }}
          >
            {t.col2}
          </p>
        </div>
      </div>

      {/* ── Pull quote — full-width, typographic, indented ───── */}
      <div
        className="mx-auto max-w-7xl px-6 md:px-10 pt-20 pb-24 md:pb-32"
      >
        {/* Left-offset rule + quote */}
        <div className="flex gap-8 md:gap-16 items-start">
          <div
            className="flex-shrink-0 w-px self-stretch mt-1"
            style={{ background: "oklch(0.65 0.26 12 / 0.35)" }}
            aria-hidden="true"
          />
          <blockquote
            className="font-display font-light italic leading-[1.15] tracking-tight whitespace-pre-line text-balance"
            style={{
              fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
              color: "oklch(0.78 0.005 60 / 0.55)",
            }}
          >
            {t.pullQuote}
          </blockquote>
        </div>
      </div>
    </section>
  )
}
