"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { ReactNode } from "react"

interface SettingsScreenProps {
  eyebrow: string
  title: string
  description: string
  backLabel: string
  children: ReactNode
}

export function SettingsScreen({
  eyebrow,
  title,
  description,
  backLabel,
  children,
}: SettingsScreenProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 md:px-8 pt-5 pb-24 flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <Link
          href="/profile"
          className="flex items-center gap-1.5 font-sans text-[12px] text-muted-foreground transition-colors hover:text-foreground w-fit"
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
          {backLabel}
        </Link>

        <div className="flex flex-col gap-3">
          <span className="font-sans text-[10px] uppercase tracking-[0.24em] text-primary/60">
            {eyebrow}
          </span>
          <h1 className="font-display font-light leading-tight text-[clamp(1.75rem,5vw,2.5rem)] break-words">
            {title}
          </h1>
          <p className="font-sans text-[13.5px] leading-[1.7] text-muted-foreground text-pretty max-w-xl">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  )
}

export function SettingsGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </span>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {children}
      </div>
    </section>
  )
}

interface SettingToggleProps {
  label: string
  hint?: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}

export function SettingToggle({
  label,
  hint,
  checked,
  disabled = false,
  onChange,
}: SettingToggleProps) {
  return (
    <label
      className={`flex items-start gap-4 px-5 py-4 border-b border-border last:border-b-0 transition-colors ${
        disabled ? "opacity-50" : "cursor-pointer hover:bg-muted/40"
      }`}
    >
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="font-sans text-[13.5px] text-foreground">{label}</span>
        {hint ? (
          <span className="font-sans text-[12px] leading-[1.6] text-muted-foreground text-pretty">
            {hint}
          </span>
        ) : null}
      </span>

      {/* Нативный input оставлен доступным для скринридеров и клавиатуры,
          но визуально скрыт — переключатель рисуется соседним span. */}
      <input
        type="checkbox"
        role="switch"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      {/* Смещение «ручки» задаётся через `peer-checked:[&>span]:…`, потому что
          обычный `peer-checked:` действует только на соседей инпута, а ручка —
          вложенный элемент. */}
      <span
        aria-hidden="true"
        className="mt-0.5 relative h-5 w-9 shrink-0 rounded-full border border-border bg-muted transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-checked:[&>span]:translate-x-4 peer-checked:[&>span]:bg-primary-foreground"
      >
        <span className="absolute left-0.5 top-0.5 size-3.5 rounded-full bg-foreground/70 transition-transform" />
      </span>
    </label>
  )
}
