"use client"

import type { RevealZoneId } from "@/features/discover/types/reveal"

// ─── Zone metadata ───────────────────────────────────────────────────────────

interface ZoneMeta {
  id: RevealZoneId
  label: { ru: string; en: string }
  hint: { ru: string; en: string }
}

const ZONES: ZoneMeta[] = [
  {
    id: "identity",
    label: { ru: "Личность", en: "Identity" },
    hint:  { ru: "Имя · возраст · город", en: "Name · age · city" },
  },
  {
    id: "description",
    label: { ru: "О себе", en: "About" },
    hint:  { ru: "Её история", en: "Her story" },
  },
  {
    id: "tags",
    label: { ru: "Интересы", en: "Interests" },
    hint:  { ru: "Увлечения · стиль", en: "Hobbies · vibe" },
  },
  {
    id: "details",
    label: { ru: "Детали", en: "Details" },
    hint:  { ru: "Работа · рост · языки", en: "Work · height · languages" },
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

interface RevealZoneControlsProps {
  unlockedZones: Set<RevealZoneId>
  hoveredZone: RevealZoneId | null
  onUnlock: (zone: RevealZoneId) => void
  onHover: (zone: RevealZoneId | null) => void
  lang: "ru" | "en"
}

export function RevealZoneControls({
  unlockedZones,
  hoveredZone,
  onUnlock,
  onHover,
  lang,
}: RevealZoneControlsProps) {
  return (
    <div
      className="flex items-center gap-2 flex-wrap justify-center"
      role="group"
      aria-label={lang === "ru" ? "Открыть зоны профиля" : "Reveal profile zones"}
    >
      {ZONES.map((zone) => {
        const isUnlocked = unlockedZones.has(zone.id)
        const isHovered  = hoveredZone === zone.id

        return (
          <button
            key={zone.id}
            onClick={() => { if (!isUnlocked) onUnlock(zone.id) }}
            onMouseEnter={() => { if (!isUnlocked) onHover(zone.id) }}
            onMouseLeave={() => onHover(null)}
            onFocus={() => { if (!isUnlocked) onHover(zone.id) }}
            onBlur={() => onHover(null)}
            aria-pressed={isUnlocked}
            aria-label={
              isUnlocked
                ? `${zone.label[lang]} — ${lang === "ru" ? "открыто" : "revealed"}`
                : `${lang === "ru" ? "Открыть" : "Reveal"} ${zone.label[lang]}`
            }
            className="relative flex items-center gap-2 rounded-full font-sans transition-all"
            style={{
              paddingLeft: "14px",
              paddingRight: "14px",
              paddingTop: "8px",
              paddingBottom: "8px",
              fontSize: "11px",
              letterSpacing: "0.03em",
              cursor: isUnlocked ? "default" : "pointer",
              // Unlocked state — rose-tinted, softly glowing
              color: isUnlocked
                ? "oklch(0.78 0.14 12)"
                : isHovered
                ? "oklch(0.74 0.08 60)"
                : "oklch(0.44 0.008 15)",
              background: isUnlocked
                ? "oklch(0.65 0.26 12 / 0.10)"
                : isHovered
                ? "oklch(0.65 0.26 12 / 0.07)"
                : "oklch(0.10 0.012 15 / 0.80)",
              border: isUnlocked
                ? "1px solid oklch(0.65 0.26 12 / 0.32)"
                : isHovered
                ? "1px solid oklch(0.65 0.26 12 / 0.22)"
                : "1px solid oklch(0.22 0.012 15 / 0.65)",
              boxShadow: isUnlocked
                ? "0 0 16px oklch(0.65 0.26 12 / 0.12)"
                : isHovered
                ? "0 0 10px oklch(0.65 0.26 12 / 0.08)"
                : "none",
              backdropFilter: "blur(12px)",
              transform: isHovered && !isUnlocked ? "translateY(-1px)" : "none",
            }}
          >
            {/* Unlock dot or checkmark */}
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                flexShrink: 0,
                background: isUnlocked
                  ? "oklch(0.72 0.22 12)"
                  : isHovered
                  ? "oklch(0.65 0.26 12 / 0.60)"
                  : "oklch(0.28 0.008 15)",
                boxShadow: isUnlocked ? "0 0 6px oklch(0.72 0.22 12 / 0.65)" : "none",
                transition: "background 0.2s, box-shadow 0.2s",
              }}
            />
            {zone.label[lang]}
            {/* Subtle hint text */}
            {!isUnlocked && (
              <span
                style={{
                  fontSize: "9.5px",
                  color: "oklch(0.28 0.008 15)",
                  paddingLeft: "2px",
                }}
              >
                {zone.hint[lang]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
