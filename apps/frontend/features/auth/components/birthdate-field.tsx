"use client"

import { useRef } from "react"
import { useLang } from "@/lib/lang-context"

interface BirthdateFieldProps {
  value: string            // "DD.MM.YYYY" raw string being edited
  onChange: (value: string) => void
  error?: string
}

const copy = {
  ru: {
    label: "Дата рождения",
    placeholder: "ДД.ММ.ГГГГ",
    errorFormat: "Введи дату в формате ДД.ММ.ГГГГ",
    errorInvalid: "Укажи реальную дату",
    errorAge: "Тебе должно быть 18 лет или больше",
  },
  en: {
    label: "Date of birth",
    placeholder: "DD.MM.YYYY",
    errorFormat: "Enter date as DD.MM.YYYY",
    errorInvalid: "Enter a valid date",
    errorAge: "You must be at least 18 years old",
  },
}

/** Insert dots into a raw digit string (up to 8 digits) → "DD.MM.YYYY" */
function applyMask(digits: string): string {
  const d = digits.slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`
}

/** Strip non-digits */
function digitsOnly(s: string): string {
  return s.replace(/\D/g, "")
}

export function BirthdateField({ value, onChange, error }: BirthdateFieldProps) {
  const { lang } = useLang()
  const t = copy[lang]
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = digitsOnly(e.target.value)
    const masked = applyMask(raw)
    onChange(masked)
  }

  // Prevent non-digit key input except navigation
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowed = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp",
      "ArrowDown", "Tab", "Home", "End",
    ]
    if (allowed.includes(e.key)) return
    if (!/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const isFilled = value.replace(/\D/g, "").length === 8

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="birthdate"
        className="font-sans text-[11px] uppercase tracking-[0.06em] text-surface-6"
      >
        {t.label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id="birthdate"
          type="text"
          inputMode="numeric"
          // Task 081: Chrome flags `bday` as a non-standard autocomplete value
          // on this element regardless of `type` (confirmed against both
          // `type="text"` and `type="date"` in DevTools → Issues) — its
          // internal validity list disagrees with the WHATWG spec here, the
          // same way it rejects the spec-valid `nickname` token. It also
          // wouldn't have worked in practice: `handleChange` below strips
          // anything Chrome injects down to bare digits regardless of their
          // order, so an autofilled ISO date (YYYY-MM-DD) would scramble
          // into the wrong DD.MM.YYYY. The real fix is switching to a native
          // `type="date"` input or three separate bday-day/bday-month/
          // bday-year fields — a bigger UX change, tracked separately, not
          // this task.
          autoComplete="off"
          aria-invalid={!!error}
          placeholder={t.placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={10}
          aria-describedby={error ? "birthdate-error" : undefined}
          className="w-full bg-transparent font-sans text-sm text-text-5 tracking-[0.08em] outline-none transition-all caret-primary py-3 px-0 border-b border-b-surface-3 focus:border-b-primary/70 aria-invalid:border-b-destructive/80 aria-invalid:focus:border-b-destructive"
        />
        {/* Year digit count hint — shown while typing */}
        {!isFilled && value.length > 0 && (
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 font-sans text-[10px] text-surface-4 pointer-events-none"
            aria-hidden="true"
          >
            {value.replace(/\D/g, "").length}/8
          </span>
        )}
      </div>

      {error && (
        // Task 087a: same hue25 family finding as auth-field.tsx — deferred,
        // not forced onto --destructive.
        <p
          id="birthdate-error"
          className="font-sans text-[11px]"
          style={{ color: "oklch(0.62 0.18 25)" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Validate a "DD.MM.YYYY" masked string.
 * Returns an error key or null if valid and >= 18.
 */
export function validateBirthdate(
  masked: string,
  lang: "ru" | "en"
): string | null {
  const t = copy[lang]
  const digits = digitsOnly(masked)
  if (digits.length < 8) return t.errorFormat

  const day = parseInt(digits.slice(0, 2), 10)
  const month = parseInt(digits.slice(2, 4), 10)
  const year = parseInt(digits.slice(4, 8), 10)

  // Sanity ranges
  if (month < 1 || month > 12) return t.errorInvalid
  if (day < 1 || day > 31) return t.errorInvalid
  if (year < 1900 || year > new Date().getFullYear()) return t.errorInvalid

  // Real date check (handles leap years and month lengths)
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    return t.errorInvalid
  }

  // Age >= 18
  const today = new Date()
  let age = today.getFullYear() - year
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  ) {
    age--
  }
  if (age < 18) return t.errorAge

  return null
}

export function formatBirthdateForApi(masked: string): string {
  const digits = digitsOnly(masked)
  const day = digits.slice(0, 2)
  const month = digits.slice(2, 4)
  const year = digits.slice(4, 8)

  return `${year}-${month}-${day}`
}
