"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react"
import { AuthField } from "./auth-field"
import {
  BirthdateField,
  formatBirthdateForApi,
  validateBirthdate,
} from "./birthdate-field"
import type { AuthFormState } from "@/types/auth"
import { useLang } from "@/lib/lang-context"
import { useAuth } from "@/lib/auth-context"
import { ApiError } from "@/lib/auth-api"

const copy = {
  ru: {
    nameLabel: "Имя",
    namePlaceholder: "Как тебя зовут",
    handleLabel: "Никнейм",
    handlePlaceholder: "alex.yuni",
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
    errorHandle: "3–30 символов: латиница, цифры, _, . или -",
    errorEmail: "Введи корректный email",
    errorPassword: "Минимум 8 символов",
    errorBirthdate: "Укажи дату рождения",
    errorAge: "Нужно подтвердить возраст",
    errorTerms: "Нужно принять условия",
    errorGeneral: "Не удалось создать профиль",
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
    handleLabel: "Handle",
    handlePlaceholder: "alex.yuni",
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
    errorHandle: "3-30 chars: letters, numbers, _, . or -",
    errorEmail: "Enter a valid email",
    errorPassword: "At least 8 characters",
    errorBirthdate: "Enter your date of birth",
    errorAge: "You must confirm your age",
    errorTerms: "You must accept the terms",
    errorGeneral: "Could not create profile",
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
  handle?: string
  email?: string
  password?: string
  birthdate?: string
  age?: string
  terms?: string
  general?: string
}

function validate(
  fields: {
    name: string
    handle: string
    email: string
    password: string
    birthdate: string
    agreedToAge: boolean
    agreedToTerms: boolean
  },
  lang: "ru" | "en"
): Errors {
  const t = copy[lang]
  const errs: Errors = {}
  if (!fields.name.trim()) errs.name = t.errorName
  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_.-]{2,29}$/.test(fields.handle)) {
    errs.handle = t.errorHandle
  }
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
          className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all mt-0.5 border ${
            error ? "border-destructive/80" : "border-surface-4"
          } ${checked ? "bg-primary" : "bg-transparent"}`}
        >
          {checked && <Check size={10} color="white" strokeWidth={3} />}
        </button>
        <span className="font-sans leading-relaxed text-surface-6" style={{ fontSize: "12px" }}>
          {children}
        </span>
      </label>
      {error && (
        // Task 087a: same hue25-family finding as AuthField — deferred.
        <p className="font-sans ml-7" style={{ fontSize: "11px", color: "oklch(0.62 0.18 25)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function SignUpForm() {
  const { lang } = useLang()
  const router = useRouter()
  const { register } = useAuth()
  const t = copy[lang]

  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [agreedToAge, setAgreedToAge] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formState, setFormState] = useState<AuthFormState>("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate({ name, handle, email, password, birthdate, agreedToAge, agreedToTerms }, lang)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setFormState("loading")

    try {
      await register({
        email,
        password,
        handle,
        displayName: name.trim(),
        birthDate: formatBirthdateForApi(birthdate),
      })
      setFormState("success")
      // Task 070: сразу после регистрации — анкета, а не Discovery. Профиль
      // ещё пуст, backend отфильтровывает неполные анкеты, поэтому раньше
      // человек попадал на пустой экран без объяснения, что делать дальше.
      router.replace("/onboarding")
    } catch (error) {
      setErrors({
        general: error instanceof ApiError ? error.message : t.errorGeneral,
      })
      setFormState("error")
    }
  }

  if (formState === "success") {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-primary/10 border border-primary/22">
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
          <p className="font-display font-light text-text-5" style={{ fontSize: "1.8rem" }}>
            {t.successHeadline}
          </p>
          <p className="font-sans leading-relaxed text-surface-6" style={{ fontSize: "13px" }}>
            {t.successSub}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7 w-full">
      {errors.general && (
        <div
          className="px-4 py-3 rounded-lg font-sans text-sm bg-destructive/8 border border-destructive/22"
          style={{ color: "oklch(0.70 0.16 25)", fontSize: "13px" }}
          role="alert"
        >
          {errors.general}
        </div>
      )}

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
          label={t.handleLabel}
          type="text"
          name="handle"
          autoComplete="username"
          placeholder={t.handlePlaceholder}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          error={errors.handle}
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
            className="absolute right-0 top-[34px] p-1 transition-colors text-surface-5"
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
          <a href="/terms" className="text-primary transition-colors hover:text-primary-hover">
            {t.terms}
          </a>
          {" "}{t.and}{" "}
          <a href="/privacy" className="text-primary transition-colors hover:text-primary-hover">
            {t.privacy}
          </a>
        </Checkbox>
      </div>

      {/* Primary CTA */}
      <button
        type="submit"
        disabled={formState === "loading"}
        className="group w-full flex items-center justify-center gap-2.5 rounded-full py-3.5 font-sans font-semibold tracking-wide text-white transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed bg-primary"
        style={{
          fontSize: "13px",
          boxShadow: formState !== "loading" ? "0 0 28px oklch(from var(--primary) l c h / 0.25)" : "none",
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
        <div className="flex-1 h-px bg-carbon" />
        <span className="font-sans text-[11px] text-surface-4">{t.divider}</span>
        <div className="flex-1 h-px bg-carbon" />
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
            className="w-full flex items-center justify-center gap-3 rounded-full py-3 font-sans font-medium transition-all text-text-2 border border-border bg-transparent hover:border-surface-4 hover:text-text-3"
            style={{ fontSize: "13px" }}
          >
            <span className="font-display font-light text-surface-6" style={{ fontSize: "14px" }}>
              {icon}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Sign in link */}
      <p className="text-center font-sans text-surface-5" style={{ fontSize: "12px" }}>
        {t.hasAccount}{" "}
        <a href="/signin" className="text-primary transition-colors hover:text-primary-hover">
          {t.signIn}
        </a>
      </p>
    </form>
  )
}
