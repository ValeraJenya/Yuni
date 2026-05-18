"use client"

import Image from "next/image"
import Link from "next/link"
import { FlaskConical } from "lucide-react"
import { useDemoSession } from "@/lib/demo-session"

export function DemoGate() {
  const { enterDemo } = useDemoSession()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: "oklch(0.07 0.008 15)" }}
    >
      {/* Ambient rose glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 60%, oklch(0.65 0.26 12 / 0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-8 text-center max-w-[340px] w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div style={{ width: "40px", height: "40px" }}>
            <Image
              src="/yuni-logo.png"
              alt="Yuni"
              width={40}
              height={40}
              className="object-contain"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(44%) sepia(72%) saturate(600%) hue-rotate(310deg) brightness(105%)",
                opacity: 0.75,
              }}
            />
          </div>
          <span
            className="font-display font-light tracking-[0.30em]"
            style={{ fontSize: "1.05rem", color: "oklch(0.52 0.005 60)" }}
          >
            YUNI
          </span>
        </div>

        {/* Badge */}
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-1.5"
          style={{
            background: "oklch(0.65 0.26 12 / 0.09)",
            border: "1px solid oklch(0.65 0.26 12 / 0.20)",
          }}
        >
          <FlaskConical size={11} style={{ color: "oklch(0.65 0.26 12)" }} />
          <span
            className="font-sans font-medium tracking-[0.18em] uppercase"
            style={{ fontSize: "9px", color: "oklch(0.65 0.26 12)" }}
          >
            Preview mode
          </span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3">
          <h1
            className="font-display font-light tracking-[-0.02em]"
            style={{
              fontSize: "clamp(2.4rem, 8vw, 3rem)",
              lineHeight: 0.96,
              color: "oklch(0.90 0.005 60)",
            }}
          >
            Попробуй
            <br />
            <span style={{ color: "oklch(0.65 0.26 12)" }}>демо</span>
          </h1>
          <p
            className="font-sans leading-relaxed"
            style={{ fontSize: "13px", color: "oklch(0.36 0.008 15)" }}
          >
            Это превью интерфейса приложения.
            <br />
            Авторизация не требуется.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={enterDemo}
            className="w-full rounded-full py-4 font-sans font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              fontSize: "13.5px",
              letterSpacing: "0.02em",
              background: "oklch(0.65 0.26 12)",
              boxShadow:
                "0 0 28px oklch(0.65 0.26 12 / 0.28), inset 0 1px 0 oklch(1 0 0 / 0.10)",
            }}
          >
            Войти в демо
          </button>

          <div
            className="flex items-center gap-3"
            style={{ color: "oklch(0.20 0.008 15)" }}
          >
            <span className="flex-1 h-px" style={{ background: "oklch(0.16 0.008 15)" }} />
            <span className="font-sans" style={{ fontSize: "10px" }}>или</span>
            <span className="flex-1 h-px" style={{ background: "oklch(0.16 0.008 15)" }} />
          </div>

          <Link
            href="/signin"
            className="w-full rounded-full py-3.5 font-sans font-medium text-center transition-all hover:border-opacity-60"
            style={{
              fontSize: "13px",
              color: "oklch(0.50 0.008 15)",
              border: "1px solid oklch(0.18 0.010 15)",
              display: "block",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "oklch(0.68 0.005 60)"
              e.currentTarget.style.borderColor = "oklch(0.26 0.010 15)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "oklch(0.50 0.008 15)"
              e.currentTarget.style.borderColor = "oklch(0.18 0.010 15)"
            }}
          >
            Войти с аккаунтом
          </Link>
        </div>

        {/* Disclaimer */}
        <p
          className="font-sans text-center leading-relaxed"
          style={{ fontSize: "10px", color: "oklch(0.22 0.006 15)" }}
        >
          Демо-режим не хранит данные и предназначен только для просмотра UI.
        </p>
      </div>
    </div>
  )
}
