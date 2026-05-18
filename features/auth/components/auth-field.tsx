"use client"

import type { InputHTMLAttributes } from "react"

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function AuthField({ label, error, hint, id, ...props }: AuthFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={fieldId}
        className="font-sans"
        style={{ fontSize: "11px", color: "oklch(0.44 0.008 15)", letterSpacing: "0.06em", textTransform: "uppercase" }}
      >
        {label}
      </label>
      <input
        id={fieldId}
        className="w-full bg-transparent font-sans outline-none transition-all placeholder-shown:opacity-100"
        style={{
          fontSize: "14px",
          color: "oklch(0.88 0.005 60)",
          padding: "12px 0",
          borderBottom: error
            ? "1px solid oklch(0.52 0.20 25 / 0.80)"
            : "1px solid oklch(0.22 0.010 15)",
          caretColor: "oklch(0.65 0.26 12)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderBottomColor = error
            ? "oklch(0.52 0.20 25)"
            : "oklch(0.65 0.26 12 / 0.70)"
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderBottomColor = error
            ? "oklch(0.52 0.20 25 / 0.80)"
            : "oklch(0.22 0.010 15)"
        }}
        {...props}
      />
      {error && (
        <p
          className="font-sans"
          style={{ fontSize: "11px", color: "oklch(0.62 0.18 25)" }}
          role="alert"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          className="font-sans"
          style={{ fontSize: "11px", color: "oklch(0.36 0.008 15)" }}
        >
          {hint}
        </p>
      )}
    </div>
  )
}
