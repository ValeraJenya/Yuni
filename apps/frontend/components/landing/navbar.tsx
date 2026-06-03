"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Menu } from "lucide-react"

interface NavbarProps {
  lang: "ru" | "en"
  onLangToggle: () => void
}

const copy = {
  ru: {
    safety: "Безопасность",
    support: "Поддержка",
    signIn: "Войти",
    join: "Начать",
  },
  en: {
    safety: "Safety",
    support: "Support",
    signIn: "Sign in",
    join: "Join",
  },
}

export function Navbar({ lang, onLangToggle }: NavbarProps) {
  const t = copy[lang]
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className="relative"
        style={{
          background: "oklch(0.09 0.008 15 / 0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid oklch(0.16 0.010 15 / 0.60)",
        }}
      >
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-6 md:px-10">

          {/* Brand lockup: monomark + wordmark */}
          <Link href="/" className="flex items-center gap-3 select-none group" aria-label="Yuni">
            {/* Rabbit-heart monomark — tinted to rose, small and precise */}
            <div
              className="relative flex-shrink-0"
              style={{ width: "28px", height: "28px" }}
            >
              <img
                src="/yuni-logo.png"
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain transition-opacity group-hover:opacity-80"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(44%) sepia(72%) saturate(600%) hue-rotate(310deg) brightness(105%)",
                  opacity: 0.72,
                }}
              />
            </div>

            {/* Wordmark: YUNI / by Pink Rabbit */}
            <div className="flex flex-col leading-none">
              <span
                className="font-display font-light tracking-[0.22em] transition-colors"
                style={{ fontSize: "1.35rem", color: "oklch(0.80 0.005 60)", letterSpacing: "0.22em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.80 0.005 60)")}
              >
                YUNI
              </span>
              <span
                className="font-sans font-normal tracking-[0.18em] uppercase"
                style={{ fontSize: "7.5px", color: "oklch(0.28 0.008 15)", marginTop: "2px", letterSpacing: "0.22em" }}
              >
                by Pink Rabbit
              </span>
            </div>
          </Link>

          {/* Desktop — minimal nav: only the essentials */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: t.safety, href: "#safety" },
              { label: t.support, href: "#support" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-sans transition-colors"
                style={{ fontSize: "12px", color: "oklch(0.38 0.008 15)", letterSpacing: "0.04em" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.65 0.005 60)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.38 0.008 15)")}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-5">
            {/* Lang switcher */}
            <button
              onClick={onLangToggle}
              className="flex items-center font-sans font-medium tracking-widest transition-colors select-none"
              style={{ fontSize: "11px" }}
              aria-label="Switch language"
            >
              <span style={{ color: lang === "ru" ? "oklch(0.65 0.26 12)" : "oklch(0.34 0.008 15)" }}>RU</span>
              <span style={{ color: "oklch(0.24 0.008 15)", margin: "0 4px" }}>/</span>
              <span style={{ color: lang === "en" ? "oklch(0.65 0.26 12)" : "oklch(0.34 0.008 15)" }}>EN</span>
            </button>

            <a
              href="/signin"
              className="font-sans font-medium transition-colors"
              style={{ fontSize: "12px", color: "oklch(0.40 0.008 15)", letterSpacing: "0.04em" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.65 0.005 60)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.40 0.008 15)")}
            >
              {t.signIn}
            </a>

            <a
              href="/join"
              className="font-sans font-semibold tracking-wide text-white transition-all hover:brightness-110 rounded-full px-5 py-2"
              style={{
                fontSize: "12px",
                background: "oklch(0.65 0.26 12)",
                boxShadow: "0 0 16px oklch(0.65 0.26 12 / 0.22)",
              }}
            >
              {t.join}
            </a>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={onLangToggle}
              className="font-sans font-medium tracking-widest select-none"
              style={{ fontSize: "11px" }}
            >
              <span style={{ color: lang === "ru" ? "oklch(0.65 0.26 12)" : "oklch(0.34 0.008 15)" }}>RU</span>
              <span style={{ color: "oklch(0.24 0.008 15)", margin: "0 4px" }}>/</span>
              <span style={{ color: lang === "en" ? "oklch(0.65 0.26 12)" : "oklch(0.34 0.008 15)" }}>EN</span>
            </button>
            <button
              onClick={() => setOpen(!open)}
              style={{ color: "oklch(0.45 0.008 15)" }}
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div
            className="md:hidden px-6 pb-6 pt-4 flex flex-col gap-5"
            style={{ borderTop: "1px solid oklch(0.16 0.010 15 / 0.50)" }}
          >
            <a href="#safety" onClick={() => setOpen(false)}
              className="font-sans py-1" style={{ fontSize: "13px", color: "oklch(0.44 0.008 15)" }}>
              {t.safety}
            </a>
            <a href="#support" onClick={() => setOpen(false)}
              className="font-sans py-1" style={{ fontSize: "13px", color: "oklch(0.44 0.008 15)" }}>
              {t.support}
            </a>
            <div style={{ height: "1px", background: "oklch(0.16 0.010 15 / 0.50)" }} />
            <div className="flex items-center gap-3">
              <a href="/signin"
                className="flex-1 text-center py-2.5 rounded-full font-sans text-sm"
                style={{ border: "1px solid oklch(0.20 0.010 15)", color: "oklch(0.50 0.008 15)" }}>
                {t.signIn}
              </a>
              <a href="/join"
                className="flex-1 text-center py-2.5 rounded-full font-sans text-sm font-semibold text-white"
                style={{ background: "oklch(0.65 0.26 12)" }}>
                {t.join}
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
