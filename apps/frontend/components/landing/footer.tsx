"use client"

interface FooterProps {
  lang: "ru" | "en"
  onLangToggle: () => void
}

const copy = {
  ru: {
    tagline: "Настоящие связи для настоящих людей.",
    links: [
      { label: "О нас", href: "#about" },
      { label: "Безопасность", href: "#safety" },
      { label: "Поддержка", href: "#support" },
    ],
    legal: [
      { label: "Конфиденциальность", href: "/privacy" },
      { label: "Условия", href: "/terms" },
    ],
    copy: `© ${new Date().getFullYear()} Yuni by Pink Rabbit`,
  },
  en: {
    tagline: "Real connections for real people.",
    links: [
      { label: "About", href: "#about" },
      { label: "Safety", href: "#safety" },
      { label: "Support", href: "#support" },
    ],
    legal: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
    copy: `© ${new Date().getFullYear()} Yuni by Pink Rabbit`,
  },
}

export function Footer({ lang, onLangToggle }: FooterProps) {
  const t = copy[lang]

  return (
    <footer
      className="relative"
      style={{ borderTop: "1px solid oklch(0.16 0.010 15)" }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-14 md:py-16">

        {/* Top row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

          {/* Brand lockup */}
          <div className="flex flex-col gap-4">
            {/* Logo + wordmark row */}
            <div className="flex items-center gap-3">
              <img
                src="/yuni-logo.png"
                alt=""
                aria-hidden="true"
                style={{
                  width: "26px",
                  height: "26px",
                  objectFit: "contain",
                  filter:
                    "brightness(0) saturate(100%) invert(44%) sepia(72%) saturate(600%) hue-rotate(310deg) brightness(105%)",
                  opacity: 0.45,
                }}
              />
              <div className="flex flex-col leading-none">
                <span
                  className="font-display font-light tracking-[0.20em]"
                  style={{ fontSize: "1.6rem", color: "oklch(0.52 0.005 60)" }}
                >
                  YUNI
                </span>
                <span
                  className="font-sans font-normal tracking-[0.22em] uppercase"
                  style={{ fontSize: "7.5px", color: "oklch(0.26 0.008 15)", marginTop: "2px" }}
                >
                  by Pink Rabbit
                </span>
              </div>
            </div>
            <p
              className="font-sans leading-relaxed text-pretty max-w-[200px]"
              style={{ fontSize: "12px", color: "oklch(0.32 0.008 15)" }}
            >
              {t.tagline}
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-3">
            {t.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-sans transition-colors w-fit"
                style={{ fontSize: "12px", color: "oklch(0.36 0.008 15)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.65 0.005 60)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.36 0.008 15)")}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Lang + legal */}
          <div className="flex flex-col gap-5">
            <button
              onClick={onLangToggle}
              className="flex items-center gap-1 font-sans font-medium tracking-widest transition-colors select-none w-fit"
              style={{ fontSize: "11px" }}
              aria-label="Switch language"
            >
              <span style={{ color: lang === "ru" ? "oklch(0.65 0.26 12)" : "oklch(0.34 0.008 15)" }}>RU</span>
              <span style={{ color: "oklch(0.24 0.008 15)", margin: "0 4px" }}>/</span>
              <span style={{ color: lang === "en" ? "oklch(0.65 0.26 12)" : "oklch(0.34 0.008 15)" }}>EN</span>
            </button>
            <div className="flex flex-col gap-2">
              {t.legal.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-sans transition-colors w-fit"
                  style={{ fontSize: "11px", color: "oklch(0.28 0.008 15)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "oklch(0.50 0.005 60)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "oklch(0.28 0.008 15)")}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: copyright */}
        <div
          className="mt-12 pt-8 flex items-center justify-between"
          style={{ borderTop: "1px solid oklch(0.13 0.008 15)" }}
        >
          <p
            className="font-sans tracking-wide"
            style={{ fontSize: "11px", color: "oklch(0.26 0.008 15)" }}
          >
            {t.copy}
          </p>
        </div>
      </div>
    </footer>
  )
}
