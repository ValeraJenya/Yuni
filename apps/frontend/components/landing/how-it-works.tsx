"use client"

interface HowItWorksProps {
  lang: "ru" | "en"
}

const copy = {
  ru: {
    chapterLabel: "02 — Как это работает",
    steps: [
      { num: "I", title: "Верификация", body: "Каждый профиль проверяется вручную. Никаких ботов." },
      { num: "II", title: "Подбор", body: "Ценности, интересы, стиль общения — не только фото." },
      { num: "III", title: "Разговор", body: "Вопросы-подсказки помогают начать диалог глубоко и естественно." },
      { num: "IV", title: "Связь", body: "Без игр, без давления. В своём темпе." },
    ],
  },
  en: {
    chapterLabel: "02 — How it works",
    steps: [
      { num: "I", title: "Verification", body: "Every profile reviewed by hand. No bots." },
      { num: "II", title: "Matching", body: "Values, interests, communication style — not only photos." },
      { num: "III", title: "Conversation", body: "Prompt questions open a dialogue that feels natural and meaningful." },
      { num: "IV", title: "Connection", body: "No games, no pressure. At your own pace." },
    ],
  },
}

export function HowItWorks({ lang }: HowItWorksProps) {
  const t = copy[lang]

  return (
    <section id="how" className="relative overflow-hidden">

      <div className="divider-rose" />

      <div className="mx-auto max-w-7xl px-6 md:px-10 pt-20 pb-28 md:pb-40">

        {/* Chapter label */}
        <span
          className="text-[10px] font-sans tracking-[0.28em] uppercase block mb-20"
          style={{ color: "oklch(0.65 0.26 12 / 0.60)" }}
        >
          {t.chapterLabel}
        </span>

        {/* Horizontal numbered rail */}
        <div className="relative">

          {/* Connecting line */}
          <div
            className="absolute top-[2.1rem] left-0 right-0 hidden md:block"
            style={{
              height: "1px",
              background: "linear-gradient(to right, oklch(0.65 0.26 12 / 0.18), oklch(0.65 0.26 12 / 0.08), transparent)",
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
            {t.steps.map((step) => (
              <div key={step.num} className="flex flex-col gap-6">

                {/* Roman numeral — sits on the line */}
                <div className="flex items-center gap-4">
                  <span
                    className="font-display font-light leading-none"
                    style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", color: "oklch(0.65 0.26 12 / 0.45)" }}
                  >
                    {step.num}
                  </span>
                  <div
                    className="flex-1 md:hidden"
                    style={{ height: "1px", background: "oklch(0.65 0.26 12 / 0.12)" }}
                  />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-2.5">
                  <h3
                    className="font-sans font-semibold tracking-wide"
                    style={{ fontSize: "13px", color: "oklch(0.82 0.005 60)" }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="font-sans leading-relaxed text-pretty"
                    style={{ fontSize: "13px", color: "oklch(0.44 0.008 15)" }}
                  >
                    {step.body}
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
