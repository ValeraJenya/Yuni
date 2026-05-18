"use client"

import { useState } from "react"
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react"
import { AuthField } from "./auth-field"
import { BirthdateField, validateBirthdate } from "./birthdate-field"
import type { AuthFormState } from "@/types/auth"
import { useLang } from "@/lib/lang-context"

const copy = {
  ru: {
    nameLabel: "Имя",
    namePlaceholder: "Как тебя зовут",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Пароль",
    passwordPlaceholder: "Минимум 8 символов",
    birthdateLabel: "Дата рождения", // kept for compat, BirthdateField owns its own label
    consentAge: "Мне исполнилось 18 лет",
    consentTerms: "Я принимаю",
    terms: "Условия использования",
    and: "и",
    privacy: "Политику конфиденциальности",
    cta: "Создать профиль",
    ctaLoading: "Создаём...",
    hasAccount: "Уже есть аккаунт?",
    signIn: "Войти",
    errorName: "Введи своё имя",
    errorEmail: "Введи корректный email",
    errorPassword: "Минимум 8 символов",
    errorBirthdate: "Укажи дату рождения",
    errorAge: "Нужно подтвердить возраст",
    errorTerms: "Нужно принять условия",
    successHeadline: "Добро пожаловать в Yuni.",
    successSub: "Твой профиль создан. Скоро мы свяжемся с тобой.",
    divider: "или",
    socialGoogle: "Продолжить через Google",
    socialApple: "Продолжить через Apple",
    hintPassword: "Используй буквы, цифры и символы",
  },
  en: {
    nameLabel: "Name",
    namePlaceholder: "What's your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    birthdateLabel: "Date of birth",
    consentAge: "I am 18 years of age or older",
    consentTerms: "I agree to the",
    terms: "Terms of Service",
    and: "and",
    privacy: "Privacy Policy",
    cta: "Create a profile",
    ctaLoading: "Creating...",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
    errorName: "Enter your name",
    errorEmail: "Enter a valid email",
    errorPassword: "At least 8 characters",
    errorBirthdate: "Enter your date of birth",
    errorAge: "You must confirm your age",
    errorTerms: "You must accept the terms",
    successHeadline: "Welcome to Yuni.",
    successSub: "Your profile has been created. We will be in touch.",
    divider: "or",
    socialGoogle: "Continue with Google",
    socialApple: "Continue with Apple",
    hintPassword: "Use letters, numbers, and symbols",
  },
}

interface Errors {
  name?: string
  email?: string
  password?: string
  birthdate?: string
  age?: string
  terms?: string
}

function validate(
  fields: { name: string; email: string; password: string; birthdate: string; agreedToAge: boolean; agreedToTerms: boolean },
  lang: "ru" | "en"
): Errors {
  const t = copy[lang]
  const errs: Errors = {}
  if (!fields.name.trim()) errs.name = t.errorName
  if (!fields.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errs.email = t.errorEmail
  if (!fields.password || fields.password.length < 8) errs.password = t.errorPassword
  const bdErr = validateBirthdate(fields.birthdate, lang)
  if (bdErr) errs.birthdate = bdErr
  if (!fields.agreedToAge) errs.age = t.errorAge
  if (!fields.agreedToTerms) errs.terms = t.errorTerms
  return errs
}

function Checkbox({
  checked,
  onChange,
  children,
  error,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all mt-0.5"
          style={{
            border: error ? "1px solid oklch(0.52 0.20 25 / 0.80)" : "1px solid oklch(0.28 0.010 15)",
            background: checked ? "oklch(0.65 0.26 12)" : "transparent",
          }}
        >
          {checked && <Check size={10} color="white" strokeWidth={3} />}
        </button>
        <span className="font-sans leading-relaxed" style={{ fontSize: "12px", color: "oklch(0.46 0.008 15)" }}>
          {children}
        </span>
      </label>
      {error && (
        <p className="font-sans ml-7" style={{ fontSize: "11px", color: "oklch(0.62 0.18 25)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function SignUpForm() {
  const { lang } = useLang()
  const t = copy[lang]

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [agreedToAge, setAgreedToAge] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formState, setFormState] = useState<AuthFormState>("idle")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate({ name, email, password, birthdate, agreedToAge, agreedToTerms }, lang)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setFormState("loading")
    // Mock API
    setTimeout(() => { setFormState("success") }, 1400)
  }

  if (formState === "success") {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "oklch(0.65 0.26 12 / 0.10)", border: "1px solid oklch(0.65 0.26 12 / 0.22)" }}
        >
          <img
            src="/yuni-logo.png"
            alt=""
            aria-hidden="true"
            style={{ width: "24px", height: "24px", objectFit: "contain",
              filter: "brightness(0) saturate(100%) invert(44%) sepia(72%) saturate(600%) hue-rotate(310deg) brightness(105%)",
              opacity: 0.85,
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-display font-light" style={{ fontSize: "1.8rem", color: "oklch(0.88 0.005 60)" }}>
            {t.successHeadline}
          </p>
          <p className="font-sans leading-relaxed" style={{ fontSize: "13px", color: "oklch(0.40 0.008 15)" }}>
            {t.successSub}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7 w-full">

      <div className="flex flex-col gap-7">
        <AuthField
          label={t.nameLabel}
          type="text"
          name="name"
          autoComplete="given-name"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
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

        {/* Password with toggle */}
        <div className="relative">
          <AuthField
            label={t.passwordLabel}
            type={showPw ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint={t.hintPassword}
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

        <BirthdateField
          value={birthdate}
          onChange={setBirthdate}
          error={errors.birthdate}
        />
      </div>

      {/* Consent checkboxes */}
      <div className="flex flex-col gap-4 pt-1">
        <Checkbox checked={agreedToAge} onChange={setAgreedToAge} error={errors.age}>
          {t.consentAge}
        </Checkbox>
        <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms} error={errors.terms}>
          {t.consentTerms}{" "}
          <a
            href="/terms"
            style={{ color: "oklch(0.65 0.26 12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.78 0.22 12)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
          >
            {t.terms}
          </a>
          {" "}{t.and}{" "}
          <a
            href="/privacy"
            style={{ color: "oklch(0.65 0.26 12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.78 0.22 12)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
          >
            {t.privacy}
          </a>
        </Checkbox>
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
            <span className="font-display font-light" style={{ fontSize: "14px", color: "oklch(0.40 0.008 15)" }}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Sign in link */}
      <p className="text-center font-sans" style={{ fontSize: "12px", color: "oklch(0.36 0.008 15)" }}>
        {t.hasAccount}{" "}
        <a
          href="/signin"
          className="transition-colors"
          style={{ color: "oklch(0.65 0.26 12)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.78 0.22 12)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
        >
          {t.signIn}
        </a>
      </p>
    </form>
  )
}
