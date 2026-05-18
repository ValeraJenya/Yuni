"use client"

import { useState } from "react"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { AuthShell } from "@/features/auth/components/auth-shell"
import { AuthField } from "@/features/auth/components/auth-field"
import { useLang } from "@/lib/lang-context"
import type { AuthFormState } from "@/types/auth"

const copy = {
  ru: {
    eyebrow: "Восстановление",
    headline: "Забыл пароль?",
    sub: "Введи email — мы отправим ссылку для сброса.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    cta: "Отправить ссылку",
    ctaLoading: "Отправляем...",
    backToSignIn: "Вернуться ко входу",
    errorEmail: "Введи корректный email",
    successHeadline: "Письмо отправлено.",
    successSub: "Проверь почту — ссылка для сброса уже там. Не забудь проверить папку спам.",
    successCta: "Войти",
  },
  en: {
    eyebrow: "Password reset",
    headline: "Forgot your\npassword?",
    sub: "Enter your email and we will send you a reset link.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    cta: "Send reset link",
    ctaLoading: "Sending...",
    backToSignIn: "Back to sign in",
    errorEmail: "Enter a valid email",
    successHeadline: "Check your inbox.",
    successSub: "We sent you a reset link. Don't forget to check your spam folder.",
    successCta: "Sign in",
  },
}

function ForgotPasswordContent() {
  const { lang } = useLang()
  const t = copy[lang]

  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [formState, setFormState] = useState<AuthFormState>("idle")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t.errorEmail)
      return
    }
    setEmailError("")
    setFormState("loading")
    // Mock API
    setTimeout(() => { setFormState("success") }, 1200)
  }

  return (
    <div className="w-full max-w-[380px]">

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

      {formState === "success" ? (
        /* ── Success state ──────────────────────────── */
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1
              className="font-display font-light leading-[0.96] tracking-[-0.01em]"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.2rem)", color: "oklch(0.92 0.005 60)" }}
            >
              {t.successHeadline}
            </h1>
            <p
              className="font-sans leading-relaxed text-pretty"
              style={{ fontSize: "13px", color: "oklch(0.40 0.008 15)" }}
            >
              {t.successSub}
            </p>
          </div>
          <a
            href="/signin"
            className="group inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 font-sans font-semibold tracking-wide text-white transition-all hover:brightness-110 w-fit"
            style={{
              fontSize: "13px",
              background: "oklch(0.65 0.26 12)",
              boxShadow: "0 0 24px oklch(0.65 0.26 12 / 0.22)",
            }}
          >
            {t.successCta}
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      ) : (
        /* ── Form ──────────────────────────────────── */
        <div className="flex flex-col gap-10">
          <div>
            <h1
              className="font-display font-light tracking-[-0.02em] mb-3 whitespace-nowrap"
              style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.2rem)", lineHeight: 1.0, color: "oklch(0.92 0.005 60)" }}
            >
              {t.headline}
            </h1>
            <p
              className="font-sans leading-relaxed"
              style={{ fontSize: "13px", color: "oklch(0.40 0.008 15)" }}
            >
              {t.sub}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
            <AuthField
              label={t.emailLabel}
              type="email"
              name="email"
              autoComplete="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
            />

            <button
              type="submit"
              disabled={formState === "loading"}
              className="group w-full flex items-center justify-center gap-2.5 rounded-full py-3.5 font-sans font-semibold tracking-wide text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                fontSize: "13px",
                background: "oklch(0.65 0.26 12)",
                boxShadow: formState !== "loading" ? "0 0 28px oklch(0.65 0.26 12 / 0.25)" : "none",
              }}
            >
              {formState === "loading" ? t.ctaLoading : (
                <>
                  {t.cta}
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <a
            href="/signin"
            className="group inline-flex items-center gap-2 font-sans transition-colors w-fit"
            style={{ fontSize: "12px", color: "oklch(0.36 0.008 15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.65 0.005 60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.36 0.008 15)")}
          >
            <ArrowLeft size={12} />
            {t.backToSignIn}
          </a>
        </div>
      )}
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordContent />
    </AuthShell>
  )
}
