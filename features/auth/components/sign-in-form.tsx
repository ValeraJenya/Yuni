"use client"

import { useState } from "react"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import { AuthField } from "./auth-field"
import type { AuthFormState } from "@/types/auth"
import { useLang } from "@/lib/lang-context"

const copy = {
  ru: {
    headline: "С возвращением.",
    sub: "Войди в свой аккаунт Yuni.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Пароль",
    passwordPlaceholder: "••••••••",
    forgot: "Забыл пароль?",
    cta: "Войти",
    ctaLoading: "Входим...",
    noAccount: "Ещё нет аккаунта?",
    join: "Создать профиль",
    errorEmail: "Введи корректный email",
    errorPassword: "Минимум 6 символов",
    errorGeneral: "Неверный email или пароль",
    successMessage: "Добро пожаловать обратно.",
    divider: "или",
    socialGoogle: "Войти через Google",
    socialApple: "Войти через Apple",
  },
  en: {
    headline: "Welcome back.",
    sub: "Sign in to your Yuni account.",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    forgot: "Forgot password?",
    cta: "Sign in",
    ctaLoading: "Signing in...",
    noAccount: "No account yet?",
    join: "Create a profile",
    errorEmail: "Enter a valid email",
    errorPassword: "At least 6 characters",
    errorGeneral: "Incorrect email or password",
    successMessage: "Welcome back.",
    divider: "or",
    socialGoogle: "Continue with Google",
    socialApple: "Continue with Apple",
  },
}

function validate(email: string, password: string, lang: "ru" | "en") {
  const t = copy[lang]
  const errs: { email?: string; password?: string } = {}
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t.errorEmail
  if (!password || password.length < 6) errs.password = t.errorPassword
  return errs
}

export function SignInForm() {
  const { lang } = useLang()
  const t = copy[lang]

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [formState, setFormState] = useState<AuthFormState>("idle")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(email, password, lang)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setFormState("loading")

    // Mock API call
    setTimeout(() => {
      // Mock: wrong password simulation
      if (password === "wrongpass") {
        setErrors({ general: t.errorGeneral })
        setFormState("error")
      } else {
        setFormState("success")
      }
    }, 1200)
  }

  if (formState === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.65 0.26 12 / 0.12)", border: "1px solid oklch(0.65 0.26 12 / 0.25)" }}
        >
          <img
            src="/yuni-logo.png"
            alt=""
            aria-hidden="true"
            style={{ width: "20px", height: "20px", objectFit: "contain",
              filter: "brightness(0) saturate(100%) invert(44%) sepia(72%) saturate(600%) hue-rotate(310deg) brightness(105%)",
              opacity: 0.8,
            }}
          />
        </div>
        <p
          className="font-display font-light italic"
          style={{ fontSize: "1.5rem", color: "oklch(0.82 0.005 60)" }}
        >
          {t.successMessage}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8 w-full">

      {/* General error */}
      {errors.general && (
        <div
          className="px-4 py-3 rounded-lg font-sans text-sm"
          style={{
            background: "oklch(0.52 0.20 25 / 0.08)",
            border: "1px solid oklch(0.52 0.20 25 / 0.22)",
            color: "oklch(0.70 0.16 25)",
            fontSize: "13px",
          }}
          role="alert"
        >
          {errors.general}
        </div>
      )}

      <div className="flex flex-col gap-7">
        <AuthField
          label={t.emailLabel}
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        {/* Password with show/hide */}
        <div className="relative">
          <AuthField
            label={t.passwordLabel}
            type={showPw ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-0 top-[34px] p-1 transition-colors"
            style={{ color: "oklch(0.36 0.008 15)" }}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Forgot password */}
      <div className="flex justify-end -mt-4">
        <a
          href="/forgot-password"
          className="font-sans transition-colors"
          style={{ fontSize: "11px", color: "oklch(0.36 0.008 15)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.36 0.008 15)")}
        >
          {t.forgot}
        </a>
      </div>

      {/* Primary CTA */}
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

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px" style={{ background: "oklch(0.18 0.008 15)" }} />
        <span className="font-sans" style={{ fontSize: "11px", color: "oklch(0.30 0.008 15)" }}>{t.divider}</span>
        <div className="flex-1 h-px" style={{ background: "oklch(0.18 0.008 15)" }} />
      </div>

      {/* Social placeholders */}
      <div className="flex flex-col gap-3">
        {[
          { label: t.socialGoogle, icon: "G" },
          { label: t.socialApple, icon: "A" },
        ].map(({ label, icon }) => (
          <button
            key={icon}
            type="button"
            className="w-full flex items-center justify-center gap-3 rounded-full py-3 font-sans font-medium transition-all"
            style={{
              fontSize: "13px",
              color: "oklch(0.55 0.005 60)",
              border: "1px solid oklch(0.20 0.010 15)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.28 0.010 15)"
              e.currentTarget.style.color = "oklch(0.72 0.005 60)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.20 0.010 15)"
              e.currentTarget.style.color = "oklch(0.55 0.005 60)"
            }}
          >
            <span
              className="font-display font-light"
              style={{ fontSize: "14px", color: "oklch(0.40 0.008 15)" }}
            >
              {icon}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Sign up link */}
      <p
        className="text-center font-sans"
        style={{ fontSize: "12px", color: "oklch(0.36 0.008 15)" }}
      >
        {t.noAccount}{" "}
        <a
          href="/join"
          className="transition-colors"
          style={{ color: "oklch(0.65 0.26 12)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.78 0.22 12)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
        >
          {t.join}
        </a>
      </p>
    </form>
  )
}
