"use client"

import { AuthShell } from "@/features/auth/components/auth-shell"
import { SignUpForm } from "@/features/auth/components/sign-up-form"
import { useLang } from "@/lib/lang-context"

const copy = {
  ru: {
    eyebrow: "Регистрация",
    headline: "Начни здесь.",
    sub: "Создай свой профиль Yuni. Первый шаг — бесплатный.",
  },
  en: {
    eyebrow: "Sign up",
    headline: "Start here.",
    sub: "Create your Yuni profile. The first step is free.",
  },
}

function JoinContent() {
  const { lang } = useLang()
  const t = copy[lang]

  return (
    <div className="w-full max-w-[400px]">

      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-10">
        <span
          className="h-px w-5 flex-shrink-0"
          style={{ background: "oklch(0.65 0.26 12 / 0.65)" }}
        />
        <span
          className="font-sans font-medium tracking-[0.26em] uppercase"
          style={{ fontSize: "9.5px", color: "oklch(0.65 0.26 12)" }}
        >
          {t.eyebrow}
        </span>
      </div>

      {/* Headline */}
      <div className="mb-10">
        <h1
          className="font-display font-light tracking-[-0.02em] mb-4"
          style={{ fontSize: "clamp(2.8rem, 6.5vw, 4rem)", lineHeight: 0.94, color: "oklch(0.93 0.005 60)" }}
        >
          {t.headline}
        </h1>
        <p
          className="font-sans leading-relaxed"
          style={{ fontSize: "13px", color: "oklch(0.38 0.008 15)" }}
        >
          {t.sub}
        </p>
      </div>

      <SignUpForm />
    </div>
  )
}

export default function JoinPage() {
  return (
    <AuthShell>
      <JoinContent />
    </AuthShell>
  )
}
