"use client"

import { useState, useRef } from "react"
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
  const [focused, setFocused] = useState(false)

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
  const borderColor = error
    ? "oklch(0.52 0.20 25 / 0.80)"
    : focused
    ? "oklch(0.65 0.26 12 / 0.70)"
    : "oklch(0.22 0.010 15)"

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="birthdate"
        className="font-sans"
        style={{
          fontSize: "11px",
          color: "oklch(0.44 0.008 15)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {t.label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id="birthdate"
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          placeholder={t.placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={10}
          aria-describedby={error ? "birthdate-error" : undefined}
          className="w-full bg-transparent font-sans outline-none transition-all"
          style={{
            fontSize: "14px",
            color: isFilled ? "oklch(0.88 0.005 60)" : "oklch(0.88 0.005 60)",
            padding: "12px 0",
            borderBottom: `1px solid ${borderColor}`,
            caretColor: "oklch(0.65 0.26 12)",
            transition: "border-color 0.18s ease",
            letterSpacing: "0.08em",
          }}
        />
        {/* Year digit count hint — shown while typing */}
        {!isFilled && value.length > 0 && (
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 font-sans pointer-events-none"
            style={{ fontSize: "10px", color: "oklch(0.30 0.008 15)" }}
            aria-hidden="true"
          >
            {value.replace(/\D/g, "").length}/8
          </span>
        )}
      </div>

      {error && (
        <p
          id="birthdate-error"
          className="font-sans"
          style={{ fontSize: "11px", color: "oklch(0.62 0.18 25)" }}
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
