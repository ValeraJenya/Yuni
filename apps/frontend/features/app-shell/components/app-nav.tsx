"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame, MessageCircle, Heart, User, FlaskConical } from "lucide-react"
import { useLang } from "@/lib/lang-context"
import { useDemoSession } from "@/lib/demo-session"
import Image from "next/image"

const navItems = [
  {
    href: "/discover",
    icon: Flame,
    labelRu: "Поиск",
    labelEn: "Discover",
  },
  {
    href: "/matches",
    icon: Heart,
    labelRu: "Матчи",
    labelEn: "Matches",
    badge: 2,
  },
  {
    href: "/messages",
    icon: MessageCircle,
    labelRu: "Чаты",
    labelEn: "Messages",
    badge: 1,
  },
  {
    href: "/profile",
    icon: User,
    labelRu: "Профиль",
    labelEn: "Profile",
  },
]

export function AppNav() {
  const pathname = usePathname()
  const { lang, toggle } = useLang()
  const { exitDemo } = useDemoSession()

  return (
    <>
      {/* ── Mobile demo badge ────────────────────────────── */}
      <div className="fixed bottom-[64px] right-3 z-50 md:hidden">
        <button
          onClick={exitDemo}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-sans font-medium"
          style={{
            fontSize: "9px",
            letterSpacing: "0.10em",
            color: "oklch(0.65 0.26 12 / 0.70)",
            background: "oklch(0.09 0.008 15 / 0.88)",
            border: "1px solid oklch(0.65 0.26 12 / 0.18)",
            backdropFilter: "blur(12px)",
          }}
          aria-label={lang === "ru" ? "Выйти из демо" : "Exit demo"}
        >
          <FlaskConical size={9} />
          {lang === "ru" ? "Демо" : "Demo"}
        </button>
      </div>

      {/* ── Mobile bottom bar ────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        aria-label={lang === "ru" ? "Основная навигация" : "Main navigation"}
        style={{
          background: "oklch(0.09 0.008 15 / 0.96)",
          borderTop: "1px solid oklch(0.17 0.010 15)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-stretch" style={{ height: "64px" }}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            const label = lang === "ru" ? item.labelRu : item.labelEn
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-colors"
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                    style={{
                      color: isActive
                        ? "oklch(0.65 0.26 12)"
                        : "oklch(0.34 0.008 15)",
                      transition: "color 0.15s ease",
                    }}
                  />
                  {item.badge && !isActive && (
                    <span
                      className="absolute -top-0.5 -right-1.5 flex items-center justify-center rounded-full font-sans font-semibold text-white"
                      style={{
                        width: "14px",
                        height: "14px",
                        fontSize: "8px",
                        background: "oklch(0.65 0.26 12)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className="font-sans"
                  style={{
                    fontSize: "9.5px",
                    letterSpacing: "0.04em",
                    color: isActive
                      ? "oklch(0.65 0.26 12)"
                      : "oklch(0.30 0.008 15)",
                    transition: "color 0.15s ease",
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Desktop side rail ────────────────────────────── */}
      <nav
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col"
        aria-label={lang === "ru" ? "Основная навигация" : "Main navigation"}
        style={{
          width: "220px",
          background: "oklch(0.09 0.008 15 / 0.94)",
          borderRight: "1px solid oklch(0.15 0.010 15)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6" style={{ height: "68px" }}>
          <Link href="/discover" className="flex items-center gap-3 group select-none">
            <div style={{ width: "22px", height: "22px", flexShrink: 0 }}>
              <Image
                src="/yuni-logo.png"
                alt=""
                aria-hidden="true"
                width={22}
                height={22}
                className="object-contain group-hover:opacity-70 transition-opacity"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(44%) sepia(72%) saturate(600%) hue-rotate(310deg) brightness(105%)",
                  opacity: 0.6,
                }}
              />
            </div>
            <span
              className="font-display font-light tracking-[0.22em]"
              style={{ fontSize: "1.1rem", color: "oklch(0.70 0.005 60)" }}
            >
              YUNI
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <div className="flex flex-col gap-1 px-3 flex-1 pt-4">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            const label = lang === "ru" ? item.labelRu : item.labelEn
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all relative"
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                style={{
                  background: isActive
                    ? "oklch(0.65 0.26 12 / 0.10)"
                    : "transparent",
                  border: isActive
                    ? "1px solid oklch(0.65 0.26 12 / 0.14)"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "oklch(0.14 0.010 15)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent"
                  }
                }}
              >
                <div className="relative flex-shrink-0">
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2 : 1.5}
                    style={{
                      color: isActive
                        ? "oklch(0.65 0.26 12)"
                        : "oklch(0.40 0.008 15)",
                    }}
                  />
                  {item.badge && !isActive && (
                    <span
                      className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full font-sans font-semibold text-white"
                      style={{
                        width: "14px",
                        height: "14px",
                        fontSize: "8px",
                        background: "oklch(0.65 0.26 12)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className="font-sans"
                  style={{
                    fontSize: "13px",
                    color: isActive
                      ? "oklch(0.78 0.010 60)"
                      : "oklch(0.44 0.008 15)",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Lang + footer */}
        <div
          className="px-6 py-5 flex flex-col gap-3"
          style={{ borderTop: "1px solid oklch(0.14 0.008 15)" }}
        >
          <button
            onClick={toggle}
            className="flex items-center font-sans font-medium tracking-widest select-none"
            style={{ fontSize: "10px" }}
            aria-label="Switch language"
          >
            <span style={{ color: lang === "ru" ? "oklch(0.65 0.26 12)" : "oklch(0.28 0.008 15)" }}>RU</span>
            <span style={{ color: "oklch(0.20 0.008 15)", margin: "0 4px" }}>/</span>
            <span style={{ color: lang === "en" ? "oklch(0.65 0.26 12)" : "oklch(0.28 0.008 15)" }}>EN</span>
          </button>
          <Link
            href="/"
            className="font-sans transition-colors"
            style={{ fontSize: "10px", color: "oklch(0.24 0.008 15)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.40 0.005 60)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.24 0.008 15)")}
          >
            {lang === "ru" ? "На главную" : "Home"}
          </Link>
          {/* Demo exit */}
          <button
            onClick={exitDemo}
            className="flex items-center gap-1.5 font-sans transition-colors select-none"
            style={{ fontSize: "10px", color: "oklch(0.65 0.26 12 / 0.55)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.65 0.26 12 / 0.55)")}
            aria-label="Exit demo"
          >
            <FlaskConical size={10} />
            {lang === "ru" ? "Выйти из демо" : "Exit demo"}
          </button>
        </div>
      </nav>
    </>
  )
}
