"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useLang } from "@/lib/lang-context"

interface AuthShellProps {
  children: ReactNode
}

export function AuthShell({ children }: AuthShellProps) {
  const { lang, toggle } = useLang()

  // overflow-hidden: декоративные градиенты ниже намеренно вынесены за границы
  // экрана (`left: -10%`, `right: -10%`). Без клиппинга нижний правый выходит
  // за правый край вьюпорта и даёт паразитный горизонтальный скролл на
  // мобильном. Все секции лендинга уже используют этот же приём
  // (`relative overflow-hidden`) — auth-shell был единственным местом с такими
  // же градиентами и без него.
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">

      {/* ── Background ──────────────────────────────────── */}
      <div className="absolute inset-0 bg-obsidian" />

      {/* Atmospheric rose glow — top left. Horizontal position and width
          frozen at their ~1440px viewport values past that point (Task 091):
          this glow is 55vw and the one below is 50vw, so past 1440 they used
          to drift apart faster than the centred form does, reading as light
          coming from one side only. Below 1440, min(100vw,1440px)=100vw, so
          this is numerically identical to the original "-10%"/"55vw". */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "calc(min(100vw, 1440px) * -0.10)",
          width: "calc(min(100vw, 1440px) * 0.55)",
          height: "60vh",
          background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 65%)",
          opacity: 0.07,
          filter: "blur(60px)",
        }}
      />
      {/* Secondary glow — bottom right */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-15%",
          right: "calc(min(100vw, 1440px) * -0.10)",
          width: "calc(min(100vw, 1440px) * 0.50)",
          height: "55vh",
          background: "radial-gradient(ellipse at center, var(--ruby) 0%, transparent 65%)",
          opacity: 0.05,
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
        <Link href="/" className="flex items-center gap-3 select-none group" aria-label="Yuni — на главную">
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
              className="font-display font-light tracking-[0.22em] transition-colors text-text-3"
              style={{ fontSize: "1.2rem" }}
            >
              YUNI
            </span>
            <span
              className="font-sans font-normal tracking-[0.22em] uppercase text-surface-3"
              style={{ fontSize: "7px", marginTop: "2px" }}
            >
              by Pink Rabbit
            </span>
          </div>
        </Link>

        {/* Lang switcher */}
        <button
          onClick={toggle}
          className="flex items-center font-sans font-medium tracking-widest select-none"
          style={{ fontSize: "11px" }}
          aria-label="Switch language"
        >
          <span className={lang === "ru" ? "text-primary" : "text-surface-5"}>RU</span>
          <span className="text-surface-3 mx-1">/</span>
          <span className={lang === "en" ? "text-primary" : "text-surface-5"}>EN</span>
        </button>
      </header>

      {/* ── Page content ────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* ── Bottom legal strip ──────────────────────────── */}
      <footer
        className="relative z-10 flex items-center justify-center gap-6 px-6 py-6 border-t border-smoke"
      >
        <a
          href="/privacy"
          className="font-sans text-[11px] text-surface-4 transition-colors hover:text-text-1"
        >
          {lang === "ru" ? "Конфиденциальность" : "Privacy"}
        </a>
        <span className="text-surface-3 text-[11px]">·</span>
        <a
          href="/terms"
          className="font-sans text-[11px] text-surface-4 transition-colors hover:text-text-1"
        >
          {lang === "ru" ? "Условия" : "Terms"}
        </a>
        <span className="text-surface-3 text-[11px]">·</span>
        <span className="font-sans text-[11px] text-surface-3">
          {`© ${new Date().getFullYear()} Yuni by Pink Rabbit`}
        </span>
      </footer>
    </div>
  )
}
