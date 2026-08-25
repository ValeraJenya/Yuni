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
        className="font-sans text-[11px] uppercase tracking-[0.06em] text-surface-6"
      >
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={!!error}
        className="w-full bg-transparent font-sans text-sm text-text-5 placeholder-shown:opacity-100 outline-none transition-all caret-primary py-3 px-0 border-b border-b-surface-3 focus:border-b-primary/70 aria-invalid:border-b-destructive/80 aria-invalid:focus:border-b-destructive"
        {...props}
      />
      {error && (
        // Task 087a: family of oklch(0.6x-0.7x 0.18-0.20 25) has three
        // real lightness levels (error text here, banner text, --destructive
        // itself) — same finding as --warning in the Task 086 pilot. Not
        // migrating to --destructive would shift the visible color;
        // deferred, not silently forced onto the one existing token.
        <p className="font-sans text-[11px]" style={{ color: "oklch(0.62 0.18 25)" }} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="font-sans text-[11px] text-surface-5">
          {hint}
        </p>
      )}
    </div>
  )
}
