"use client"

import type { ReactNode } from "react"
import { useLang } from "@/lib/lang-context"

interface AuthShellProps {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  const { lang, toggle } = useLang()

  return (
    <div className="relative min-h-screen flex flex-col">

      {/* ── Background ──────────────────────────────────── */}
      <div className="absolute inset-0 bg-obsidian" />

      {/* Atmospheric rose glow — top left */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "-10%",
          width: "55vw",
          height: "60vh",
          background: "radial-gradient(ellipse at center, oklch(0.65 0.26 12 / 0.07) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />
      {/* Secondary glow — bottom right */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-15%",
          right: "-10%",
          width: "50vw",
          height: "55vh",
          background: "radial-gradient(ellipse at center, oklch(0.48 0.22 18 / 0.05) 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />

      {/* Grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Top bar ─────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-6 md:px-10"
        style={{ height: "60px" }}
      >
        {/* Brand lockup */}
        <a href="/" className="flex items-center gap-3 select-none group" aria-label="Yuni — на главную">
          <div className="relative flex-shrink-0" style={{ width: "24px", height: "24px" }}>
            <img
              src="/yuni-logo.png"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-contain transition-opacity group-hover:opacity-70"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(44%) sepia(72%) saturate(600%) hue-rotate(310deg) brightness(105%)",
                opacity: 0.65,
              }}
            />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="font-display font-light tracking-[0.22em] transition-colors"
              style={{ fontSize: "1.2rem", color: "oklch(0.72 0.005 60)" }}
            >
              YUNI
            </span>
            <span
              className="font-sans font-normal tracking-[0.22em] uppercase"
              style={{ fontSize: "7px", color: "oklch(0.26 0.008 15)", marginTop: "2px" }}
            >
              by Pink Rabbit
            </span>
          </div>
        </a>

        {/* Lang switcher */}
        <button
          onClick={toggle}
          className="flex items-center font-sans font-medium tracking-widest select-none"
          style={{ fontSize: "11px" }}
          aria-label="Switch language"
        >
          <span style={{ color: lang === "ru" ? "oklch(0.65 0.26 12)" : "oklch(0.34 0.008 15)" }}>RU</span>
          <span style={{ color: "oklch(0.24 0.008 15)", margin: "0 4px" }}>/</span>
          <span style={{ color: lang === "en" ? "oklch(0.65 0.26 12)" : "oklch(0.34 0.008 15)" }}>EN</span>
        </button>
      </header>

      {/* ── Page content ────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* ── Bottom legal strip ──────────────────────────── */}
      <footer
        className="relative z-10 flex items-center justify-center gap-6 px-6 py-6"
        style={{ borderTop: "1px solid oklch(0.14 0.008 15)" }}
      >
        <a
          href="/privacy"
          className="font-sans transition-colors"
          style={{ fontSize: "11px", color: "oklch(0.28 0.008 15)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.50 0.005 60)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.28 0.008 15)")}
        >
          {lang === "ru" ? "Конфиденциальность" : "Privacy"}
        </a>
        <span style={{ color: "oklch(0.20 0.008 15)", fontSize: "11px" }}>·</span>
        <a
          href="/terms"
          className="font-sans transition-colors"
          style={{ fontSize: "11px", color: "oklch(0.28 0.008 15)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.50 0.005 60)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.28 0.008 15)")}
        >
          {lang === "ru" ? "Условия" : "Terms"}
        </a>
        <span style={{ color: "oklch(0.20 0.008 15)", fontSize: "11px" }}>·</span>
        <span
          className="font-sans"
          style={{ fontSize: "11px", color: "oklch(0.24 0.008 15)" }}
        >
          {`© ${new Date().getFullYear()} Yuni by Pink Rabbit`}
        </span>
      </footer>
    </div>
  )
}
