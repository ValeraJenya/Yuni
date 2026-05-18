"use client"

import Image from "next/image"
import { MapPin, ShieldCheck, Star } from "lucide-react"
import { VeilOverlay } from "@/features/discover/components/veil-overlay"
import { useProfileReveal } from "@/features/discover/hooks/use-profile-reveal"
import type { RevealZoneId } from "@/features/discover/types/reveal"
import type { UserProfile } from "@/types/app"

interface RevealProfileCardProps {
  profile: UserProfile
  distance?: number
  lang: "ru" | "en"
  style?: React.CSSProperties
  className?: string
  /** Optional externally-managed reveal state — if provided the card uses these instead of internal hook */
  externalReveal?: {
    unlockedZones: Set<RevealZoneId>
    visibleSegments: Set<number>
    totalSegments: number
    unlockZone: (zone: RevealZoneId) => void
  }
}

// ─── Fade-in wrapper ─────────────────────────────────────────────────────────

function Revealed({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(5px)",
        transition: "opacity 0.50s cubic-bezier(0.22,1,0.36,1), transform 0.50s cubic-bezier(0.22,1,0.36,1)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  )
}

// ─── Tap hint overlay (shown before identity is unlocked) ────────────────────

function TapHint({ lang }: { lang: "ru" | "en" }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 15 }}
    >
      <div
        className="flex flex-col items-center gap-2"
        style={{
          opacity: 0.72,
          // Pulse animation via inline keyframe class below
        }}
      >
        {/* Ripple ring */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            border: "1.5px solid oklch(0.80 0.010 55 / 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "1.5px solid oklch(0.80 0.012 55 / 0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "oklch(0.80 0.012 55 / 0.70)",
              }}
            />
          </div>
        </div>
        <span
          className="font-sans"
          style={{
            fontSize: "10px",
            letterSpacing: "0.08em",
            color: "oklch(0.70 0.010 55 / 0.70)",
            textTransform: "uppercase",
          }}
        >
          {lang === "ru" ? "Нажмите, чтобы открыть" : "Tap to unveil"}
        </span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RevealProfileCard({
  profile,
  distance,
  lang,
  style,
  className = "",
  externalReveal,
}: RevealProfileCardProps) {
  const internal = useProfileReveal(externalReveal ? "" : profile.id)

  // Use external state when provided, otherwise fall back to internal hook
  const unlockedZones = externalReveal?.unlockedZones ?? internal.state.unlockedZones
  const visibleSegments = externalReveal?.visibleSegments ?? internal.visibleSegments
  const TOTAL_SEGMENTS = externalReveal?.totalSegments ?? internal.TOTAL_SEGMENTS
  const unlockZone = externalReveal?.unlockZone ?? internal.unlockZone
  const highlightedSegments = internal.highlightedSegments

  const showIdentity = unlockedZones.has("identity")
  const revealRatio = visibleSegments.size / TOTAL_SEGMENTS

  return (
    <div
      className={`flex flex-col ${className}`}
      style={style}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* ── Photo card ──────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={
          showIdentity
            ? `${profile.name}, ${profile.age}`
            : lang === "ru"
            ? "Нажмите, чтобы открыть профиль"
            : "Tap to unveil profile"
        }
        onClick={() => unlockZone("identity")}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") unlockZone("identity") }}
        onDragStart={(e) => e.preventDefault()}
        className="relative overflow-hidden select-none"
        style={{
          borderRadius: "26px",
          background: "oklch(0.10 0.012 15)",
          border: "1px solid oklch(0.22 0.014 15 / 0.55)",
          boxShadow: [
            "0 40px 100px oklch(0.03 0.005 15 / 0.95)",
            "0 0 0 1px oklch(0.65 0.26 12 / 0.06)",
            "inset 0 1px 0 oklch(0.40 0.012 15 / 0.18)",
          ].join(", "),
          aspectRatio: "3/4",
          width: "100%",
          cursor: showIdentity ? "default" : "pointer",
          // Prevent any selection highlight that could appear on long-press / drag
          userSelect: "none",
          WebkitUserSelect: "none",
          // Suppress the native drag ghost image on the container itself
          WebkitUserDrag: "none",
        } as React.CSSProperties}
      >
        {/* Photo */}
        <div
          className="absolute inset-0"
          onDragStart={(e) => e.preventDefault()}
          onMouseDown={(e) => {
            // Prevent mouse-drag from triggering native image/element drag
            // while still allowing the click event to fire normally.
            if (e.button === 0) e.preventDefault()
          }}
        >
          <Image
            src={profile.photos[0]}
            alt={showIdentity ? `${profile.name}, ${profile.age}` : ""}
            fill
            draggable={false}
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 360px"
          />
        </div>

        {/*
          Base blur layer — sits between photo and veil SVG.
          Provides the strong "only a silhouette" obscurity before reveal.
          Fades out as segments are removed.
        */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 8,
            backdropFilter: `blur(${Math.round((1 - revealRatio) * 22)}px) brightness(${0.38 + revealRatio * 0.52})`,
            WebkitBackdropFilter: `blur(${Math.round((1 - revealRatio) * 22)}px) brightness(${0.38 + revealRatio * 0.52})`,
            transition: "backdrop-filter 0.6s ease, -webkit-backdrop-filter 0.6s ease",
            // Also layer a dark translucent skin that dissolves
            background: `oklch(0.06 0.008 15 / ${(1 - revealRatio) * 0.55})`,
          }}
        />

        {/* Bottom vignette — always */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 9,
            background: [
              "linear-gradient(to top, oklch(0.05 0.010 15 / 0.98) 0%",
              "oklch(0.07 0.008 15 / 0.80) 20%",
              "oklch(0.06 0.008 15 / 0.40) 38%",
              "transparent 58%)",
            ].join(", "),
          }}
        />

        {/* Top gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 9,
            background: "linear-gradient(to bottom, oklch(0.05 0.008 15 / 0.45) 0%, transparent 26%)",
          }}
        />

        {/* Rose rim glow */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            zIndex: 9,
            height: "45%",
            background: "radial-gradient(ellipse at 50% 110%, oklch(0.65 0.26 12 / 0.10) 0%, transparent 65%)",
          }}
        />

        {/* Veil SVG — z 10, above blur base */}
        <VeilOverlay
          totalSegments={TOTAL_SEGMENTS}
          visibleSegments={visibleSegments}
          highlightedSegments={highlightedSegments}
        />

        {/* Tap hint — shown before identity is revealed */}
        {!showIdentity && <TapHint lang={lang} />}

        {/* Photo dots */}
        {profile.photos.length > 1 && (
          <div
            className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none"
            style={{ zIndex: 20 }}
          >
            {profile.photos.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 0 ? "18px" : "6px",
                  height: "3px",
                  borderRadius: "2px",
                  background: i === 0 ? "oklch(0.98 0 0 / 0.90)" : "oklch(0.98 0 0 / 0.28)",
                }}
              />
            ))}
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between" style={{ zIndex: 20 }}>
          <div className="flex items-center gap-2">
            {profile.isVerified && (
              <span
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans font-medium"
                style={{
                  fontSize: "10px",
                  color: "oklch(0.75 0.18 220)",
                  background: "oklch(0.08 0.012 15 / 0.72)",
                  border: "1px solid oklch(0.72 0.18 220 / 0.28)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <ShieldCheck size={10} />
              </span>
            )}
            {profile.isPremium && (
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-1 font-sans font-medium"
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.10em",
                  color: "oklch(0.84 0.12 72)",
                  background: "oklch(0.08 0.012 15 / 0.72)",
                  border: "1px solid oklch(0.82 0.12 72 / 0.22)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Star size={9} strokeWidth={1.5} />
                PREMIUM
              </span>
            )}
          </div>
          {profile.isOnline && (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans font-medium"
              style={{
                fontSize: "9.5px",
                letterSpacing: "0.06em",
                color: "oklch(0.80 0.18 145)",
                background: "oklch(0.08 0.012 15 / 0.72)",
                border: "1px solid oklch(0.78 0.20 145 / 0.26)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "oklch(0.78 0.20 145)",
                  display: "inline-block",
                  flexShrink: 0,
                  boxShadow: "0 0 6px oklch(0.78 0.20 145 / 0.70)",
                }}
              />
              {lang === "ru" ? "В сети" : "Online"}
            </span>
          )}
        </div>

        {/* Bottom identity info — revealed when photo is tapped */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6" style={{ zIndex: 20 }}>
          <Revealed visible={showIdentity}>
            <div className="flex items-end justify-between mb-1">
              <div>
                <h2
                  className="font-display font-light tracking-[-0.01em]"
                  style={{
                    fontSize: "clamp(1.9rem, 5.5vw, 2.5rem)",
                    color: "oklch(0.97 0.004 60)",
                    lineHeight: 1.0,
                    textShadow: "0 2px 20px oklch(0.04 0.005 15 / 0.80)",
                  }}
                >
                  {profile.name}
                  <span
                    className="font-sans font-light ml-3"
                    style={{ fontSize: "clamp(1.1rem, 3.5vw, 1.4rem)", color: "oklch(0.55 0.006 60)" }}
                  >
                    {profile.age}
                  </span>
                </h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin size={11} style={{ color: "oklch(0.65 0.26 12 / 0.75)", flexShrink: 0 }} />
                  <span className="font-sans" style={{ fontSize: "12px", color: "oklch(0.50 0.008 15)" }}>
                    {profile.city}
                    {distance !== undefined && (
                      <span style={{ color: "oklch(0.36 0.008 15)" }}>
                        {" "}· {distance} {lang === "ru" ? "км" : "km"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Revealed>
        </div>
      </div>
    </div>
  )
}
