"use client"

import Link from "next/link"
import { useState } from "react"
import type { LegalBlock, LegalContent, Lang } from "../types"

interface LegalPageProps {
  content: LegalContent
  /** Текущий документ — подсвечивается в переключателе внизу страницы. */
  current: "privacy" | "terms" | "help"
}

const siblings = {
  ru: [
    { key: "privacy", href: "/privacy", label: "Конфиденциальность" },
    { key: "terms", href: "/terms", label: "Условия" },
    { key: "help", href: "/help", label: "Справка" },
  ],
  en: [
    { key: "privacy", href: "/privacy", label: "Privacy" },
    { key: "terms", href: "/terms", label: "Terms" },
    { key: "help", href: "/help", label: "Help" },
  ],
} as const

const backLabel = { ru: "На главную", en: "Back home" }

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="font-sans text-sm leading-[1.85] text-muted-foreground text-pretty">
          {block.text}
        </p>
      )

    case "list":
      return (
        <ul className="flex flex-col gap-2.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="font-sans text-sm leading-[1.8] text-muted-foreground text-pretty pl-5 relative"
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-[0.7em] size-1 rounded-full bg-primary/60"
              />
              {item}
            </li>
          ))}
        </ul>
      )

    case "table":
      return (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="bg-muted/50">
                {block.head.map((cell) => (
                  <th
                    key={cell}
                    scope="col"
                    className="font-sans text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-4 py-3 font-medium"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-border align-top">
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="font-sans text-[13px] leading-[1.7] text-muted-foreground px-4 py-3"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case "note":
      return (
        <p className="font-sans text-[13px] leading-[1.8] text-muted-foreground text-pretty border-l border-border pl-5 py-1">
          {block.text}
        </p>
      )

    case "todo":
      return (
        <p className="font-sans text-[13px] leading-[1.8] text-destructive/90 text-pretty border-l-2 border-destructive/70 pl-5 py-1">
          {block.text}
        </p>
      )
  }
}

export function LegalPage({ content, current }: LegalPageProps) {
  const [lang, setLang] = useState<Lang>("ru")
  const doc = content[lang]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar: back link + language toggle */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 md:px-10 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-sans text-[12px] tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {backLabel[lang]}
          </Link>

          <button
            type="button"
            onClick={() => setLang((prev) => (prev === "ru" ? "en" : "ru"))}
            className="flex items-center gap-1 font-sans text-[11px] font-medium tracking-widest select-none"
            aria-label="Switch language"
          >
            <span className={lang === "ru" ? "text-primary" : "text-muted-foreground"}>RU</span>
            <span className="text-border mx-1">/</span>
            <span className={lang === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 md:px-10 pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Title block */}
        <span className="block font-sans text-[10px] uppercase tracking-[0.28em] text-primary/60 mb-8">
          {doc.eyebrow}
        </span>

        {/* Длинные русские заголовки («Политика конфиденциальности») не влезают
            в 390px без переноса, поэтому нижняя граница clamp намеренно мелкая. */}
        <h1 className="font-display font-light leading-[1.02] tracking-[-0.01em] text-[clamp(1.875rem,5.5vw,4.25rem)] break-words hyphens-auto">
          {doc.title}
        </h1>

        <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-6">
          {doc.updatedLabel}: {doc.updated}
        </p>

        <div className="mt-10 flex flex-col gap-4 max-w-2xl">
          {doc.intro.map((paragraph, i) => (
            <p
              key={i}
              className="font-sans text-[15px] leading-[1.8] text-muted-foreground text-pretty"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Table of contents */}
        <nav
          aria-label={doc.tocLabel}
          className="mt-14 rounded-lg border border-border bg-card px-6 py-6 md:px-8 md:py-7"
        >
          <span className="block font-sans text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-5">
            {doc.tocLabel}
          </span>
          <ol className="flex flex-col gap-2.5">
            {doc.sections.map((section, i) => (
              <li key={section.id} className="flex gap-4">
                <span className="font-sans text-[11px] tabular-nums text-muted-foreground/60 pt-[3px] w-5 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <a
                  href={`#${section.id}`}
                  className="font-sans text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="mt-20 flex flex-col gap-16">
          {doc.sections.map((section, i) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="flex gap-4 md:gap-6 items-baseline mb-6">
                <span className="font-sans text-[11px] tabular-nums text-primary/50 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display font-light leading-tight text-[clamp(1.375rem,3vw,2.25rem)] break-words hyphens-auto">
                  {section.title}
                </h2>
              </div>
              <div className="flex flex-col gap-5 md:pl-[calc(0.75rem+1.5rem)]">
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Sibling documents */}
        <nav className="mt-24 pt-8 border-t border-border flex flex-wrap gap-x-8 gap-y-3">
          {siblings[lang].map((doc) =>
            doc.key === current ? (
              <span
                key={doc.key}
                aria-current="page"
                className="font-sans text-[12px] text-foreground"
              >
                {doc.label}
              </span>
            ) : (
              <Link
                key={doc.key}
                href={doc.href}
                className="font-sans text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {doc.label}
              </Link>
            ),
          )}
        </nav>
      </main>
    </div>
  )
}
