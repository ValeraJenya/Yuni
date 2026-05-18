"use client"

import { X, Heart, Star } from "lucide-react"
import type { SwipeAction } from "@/types/app"

interface SwipeActionsProps {
  onAction: (action: SwipeAction) => void
  disabled?: boolean
}

export function SwipeActions({ onAction, disabled }: SwipeActionsProps) {
  return (
    <div
      className="flex items-center justify-center gap-4"
      role="group"
      aria-label="Действия"
    >
      {/* Pass */}
      <button
        onClick={() => onAction("pass")}
        disabled={disabled}
        aria-label="Пропустить"
        className="flex items-center justify-center rounded-full transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          width: "58px",
          height: "58px",
          background: "oklch(0.11 0.012 15 / 0.88)",
          border: "1px solid oklch(0.26 0.012 15 / 0.70)",
          boxShadow: [
            "0 8px 32px oklch(0.04 0.005 15 / 0.70)",
            "inset 0 1px 0 oklch(0.30 0.010 15 / 0.25)",
          ].join(", "),
          backdropFilter: "blur(14px)",
          color: "oklch(0.48 0.010 15)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "oklch(0.42 0.012 15 / 0.80)"
          e.currentTarget.style.color = "oklch(0.68 0.008 15)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "oklch(0.26 0.012 15 / 0.70)"
          e.currentTarget.style.color = "oklch(0.48 0.010 15)"
        }}
      >
        <X size={22} strokeWidth={2} />
      </button>

      {/* Like — the centrepiece */}
      <button
        onClick={() => onAction("like")}
        disabled={disabled}
        aria-label="Лайк"
        className="flex items-center justify-center rounded-full transition-all duration-150 hover:scale-105 active:scale-95 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          width: "70px",
          height: "70px",
          background: "oklch(0.65 0.26 12)",
          border: "1px solid oklch(0.75 0.22 12 / 0.40)",
          boxShadow: [
            "0 0 32px oklch(0.65 0.26 12 / 0.50)",
            "0 0 80px oklch(0.65 0.26 12 / 0.20)",
            "0 8px 24px oklch(0.04 0.005 15 / 0.60)",
            "inset 0 1px 0 oklch(0.90 0.10 12 / 0.25)",
          ].join(", "),
          color: "white",
        }}
      >
        <Heart size={28} strokeWidth={2} />
      </button>

      {/* Super like */}
      <button
        onClick={() => onAction("superlike")}
        disabled={disabled}
        aria-label="Суперлайк"
        className="flex items-center justify-center rounded-full transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          width: "48px",
          height: "48px",
          background: "oklch(0.11 0.012 15 / 0.88)",
          border: "1px solid oklch(0.65 0.20 220 / 0.38)",
          boxShadow: [
            "0 0 18px oklch(0.65 0.20 220 / 0.20)",
            "0 8px 24px oklch(0.04 0.005 15 / 0.60)",
            "inset 0 1px 0 oklch(0.65 0.20 220 / 0.15)",
          ].join(", "),
          backdropFilter: "blur(14px)",
          color: "oklch(0.72 0.20 220)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "oklch(0.65 0.20 220 / 0.55)"
          e.currentTarget.style.color = "oklch(0.82 0.18 220)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "oklch(0.65 0.20 220 / 0.38)"
          e.currentTarget.style.color = "oklch(0.72 0.20 220)"
        }}
      >
        <Star size={19} strokeWidth={1.8} />
      </button>
    </div>
  )
}
