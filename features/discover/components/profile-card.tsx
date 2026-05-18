"use client"

import Image from "next/image"
import { MapPin, ShieldCheck, Star } from "lucide-react"
import type { UserProfile } from "@/types/app"

interface ProfileCardProps {
  profile: UserProfile
  distance?: number
  style?: React.CSSProperties
  className?: string
}

export function ProfileCard({ profile, distance, style, className = "" }: ProfileCardProps) {
  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
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
        maxWidth: "360px",
        ...style,
      }}
    >
      {/* Photo */}
      <div className="absolute inset-0">
        <Image
          src={profile.photos[0]}
          alt={`${profile.name}, ${profile.age}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 360px"
        />
      </div>

      {/* Deep bottom vignette — 3-stop for cinematic depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "linear-gradient(to top, oklch(0.05 0.010 15 / 0.98) 0%",
            "oklch(0.07 0.008 15 / 0.88) 22%",
            "oklch(0.06 0.008 15 / 0.50) 40%",
            "transparent 62%)",
          ].join(", "),
        }}
      />

      {/* Top shadow — eases top badges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.05 0.008 15 / 0.50) 0%, transparent 28%)",
        }}
      />

      {/* Rose edge-light — bottom rim glow, suggests warmth behind the subject */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "45%",
          background:
            "radial-gradient(ellipse at 50% 110%, oklch(0.65 0.26 12 / 0.12) 0%, transparent 65%)",
        }}
      />

      {/* Photo dot indicators */}
      {profile.photos.length > 1 && (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {profile.photos.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === 0 ? "18px" : "6px",
                height: "3px",
                borderRadius: "2px",
                background:
                  i === 0
                    ? "oklch(0.98 0 0 / 0.90)"
                    : "oklch(0.98 0 0 / 0.28)",
                transition: "width 0.2s",
              }}
            />
          ))}
        </div>
      )}

      {/* Top badges */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between">
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
            В сети
          </span>
        )}
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
        {/* Name + age */}
        <div className="flex items-end justify-between mb-2.5">
          <div>
            <h2
              className="font-display font-light tracking-[-0.01em]"
              style={{
                fontSize: "clamp(2rem, 5.5vw, 2.6rem)",
                color: "oklch(0.97 0.004 60)",
                lineHeight: 1.0,
                textShadow: "0 2px 20px oklch(0.04 0.005 15 / 0.80)",
              }}
            >
              {profile.name}
              <span
                className="font-sans font-light ml-3"
                style={{
                  fontSize: "clamp(1.2rem, 3.5vw, 1.6rem)",
                  color: "oklch(0.60 0.006 60)",
                }}
              >
                {profile.age}
              </span>
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin size={11} style={{ color: "oklch(0.65 0.26 12 / 0.80)", flexShrink: 0 }} />
              <span
                className="font-sans"
                style={{ fontSize: "12px", color: "oklch(0.52 0.008 15)" }}
              >
                {profile.city}
                {distance !== undefined && (
                  <span style={{ color: "oklch(0.38 0.008 15)" }}> · {distance} км</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p
            className="font-sans leading-relaxed mb-3.5 line-clamp-2"
            style={{
              fontSize: "13px",
              color: "oklch(0.58 0.006 15)",
              textShadow: "0 1px 8px oklch(0.04 0.005 15 / 0.60)",
            }}
          >
            {profile.bio}
          </p>
        )}

        {/* Interest tags */}
        {profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-sans rounded-full px-3 py-1"
                style={{
                  fontSize: "10.5px",
                  color: "oklch(0.65 0.008 15)",
                  background: "oklch(0.10 0.012 15 / 0.85)",
                  border: "1px solid oklch(0.30 0.012 15 / 0.50)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {tag}
              </span>
            ))}
            {profile.interests.length > 3 && (
              <span
                className="font-sans rounded-full px-3 py-1"
                style={{
                  fontSize: "10.5px",
                  color: "oklch(0.40 0.008 15)",
                  background: "oklch(0.10 0.010 15 / 0.75)",
                  border: "1px solid oklch(0.24 0.010 15 / 0.45)",
                }}
              >
                +{profile.interests.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
