"use client"

import { AuthShell } from "@/features/auth/components/auth-shell"
import { SignInForm } from "@/features/auth/components/sign-in-form"
import { useLang } from "@/lib/lang-context"

const copy = {
  ru: {
    eyebrow: "Вход",
    headline: "С возвращением.",
    sub: "Войди в свой аккаунт Yuni.",
  },
  en: {
    eyebrow: "Sign in",
    headline: "Welcome back.",
    sub: "Sign in to your Yuni account.",
  },
}

function SignInContent() {
  const { lang } = useLang()
  const t = copy[lang]

  return (
    <div className="w-full max-w-[400px]">

      {/* Eyebrow */}
      <div className="flex items-center gap-3 mb-8">
        <span className="h-px w-5 flex-shrink-0 bg-primary/65" />
        <span
          className="font-sans font-medium tracking-[0.26em] uppercase text-primary"
          style={{ fontSize: "9.5px" }}
        >
          {t.eyebrow}
        </span>
      </div>

      {/* Headline */}
      <div className="mb-10">
        <h1
          className="font-display font-light tracking-[-0.02em] mb-4 text-foreground"
          style={{ fontSize: "clamp(2.8rem, 6.5vw, 4rem)", lineHeight: 0.94 }}
        >
          {t.headline}
        </h1>
        <p
          className="font-sans leading-relaxed text-surface-5"
          style={{ fontSize: "13px" }}
        >
          {t.sub}
        </p>
      </div>

      <SignInForm />
    </div>
  )
}

export default function SignInPage() {
  return (
    <AuthShell>
      <SignInContent />
    </AuthShell>
  )
}
