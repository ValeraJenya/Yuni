"use client"

interface RevealProgressProps {
  progress: number  // 0–4
  total?: number    // default 4
  lang: "ru" | "en"
}

export function RevealProgress({ progress, total = 4, lang }: RevealProgressProps) {
  const label =
    progress === 0
      ? lang === "ru" ? "Изучите профиль" : "Explore the profile"
      : progress === total
      ? lang === "ru" ? "Профиль раскрыт" : "Fully revealed"
      : lang === "ru"
      ? `Открыто ${progress} из ${total}`
      : `${progress} of ${total} revealed`

  return (
    <div className="flex items-center gap-3">
      {/* Segment pips */}
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              width: i < progress ? "18px" : "6px",
              height: "3px",
              borderRadius: "2px",
              background:
                i < progress
                  ? "oklch(0.65 0.26 12)"
                  : "oklch(0.65 0.26 12 / 0.16)",
              transition: "width 0.32s cubic-bezier(0.22, 1, 0.36, 1), background 0.22s",
              boxShadow: i < progress ? "0 0 6px oklch(0.65 0.26 12 / 0.35)" : "none",
            }}
          />
        ))}
      </div>

      {/* Text label */}
      <span
        className="font-sans"
        style={{
          fontSize: "10px",
          letterSpacing: "0.04em",
          color:
            progress === total
              ? "oklch(0.70 0.18 12)"
              : "oklch(0.34 0.008 15)",
          transition: "color 0.22s",
        }}
      >
        {label}
      </span>
    </div>
  )
}
