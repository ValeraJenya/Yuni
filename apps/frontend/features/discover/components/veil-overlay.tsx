"use client"

import { useMemo } from "react"

// ─── Geometry helpers ────────────────────────────────────────────────────────

const W = 1000
const H = 1333 // 3:4 viewBox

/**
 * Build a single satin-stripe segment path at ~45°.
 * Each stripe is a soft parallelogram with gently curved edges —
 * the curvature comes from quadratic bezier control points displaced
 * perpendicular to the diagonal, alternating sign so adjacent bands
 * interlock like fabric weave.
 */
function buildSegmentPath(index: number, total: number): string {
  const diagonal = W + H
  const segW = diagonal / total

  const d0 = index * segW
  const d1 = d0 + segW

  // For angle 45°, stripe edges are lines where x − y = const
  function linePoints(c: number): [number, number][] {
    const pts: [number, number][] = []
    if (c >= 0 && c <= W) pts.push([c, 0])
    const yr = W - c
    if (yr >= 0 && yr <= H) pts.push([W, yr])
    const xb = c + H
    if (xb >= 0 && xb <= W) pts.push([xb, H])
    const yl = -c
    if (yl >= 0 && yl <= H) pts.push([0, yl])
    return pts
  }

  const edge0 = linePoints(d0 - H)
  const edge1 = linePoints(d1 - H)

  if (edge0.length < 2 || edge1.length < 2) return ""

  const [a0, a1] = edge0
  const [b0, b1] = edge1

  // Very gentle organic curve — perpendicular to diagonal (1,1)/√2
  const amp = segW * 0.15
  const sign = index % 2 === 0 ? 1 : -1

  const mx0 = (a0[0] + a1[0]) / 2 + sign * amp * 0.707
  const my0 = (a0[1] + a1[1]) / 2 + sign * amp * 0.707
  const mx1 = (b0[0] + b1[0]) / 2 - sign * amp * 0.707
  const my1 = (b0[1] + b1[1]) / 2 - sign * amp * 0.707

  return [
    `M ${a0[0].toFixed(1)} ${a0[1].toFixed(1)}`,
    `Q ${mx0.toFixed(1)} ${my0.toFixed(1)} ${a1[0].toFixed(1)} ${a1[1].toFixed(1)}`,
    `L ${b1[0].toFixed(1)} ${b1[1].toFixed(1)}`,
    `Q ${mx1.toFixed(1)} ${my1.toFixed(1)} ${b0[0].toFixed(1)} ${b0[1].toFixed(1)}`,
    "Z",
  ].join(" ")
}

// ─── Component ───────────────────────────────────────────────────────────────

interface VeilOverlayProps {
  totalSegments: number
  visibleSegments: Set<number>
  /** Not used for hover preview anymore — kept for API compatibility */
  highlightedSegments: Set<number>
}

export function VeilOverlay({
  totalSegments,
  visibleSegments,
}: VeilOverlayProps) {
  const paths = useMemo(
    () => Array.from({ length: totalSegments }, (_, i) => buildSegmentPath(i, totalSegments)),
    [totalSegments]
  )

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ zIndex: 10 }}
    >
      <defs>
        {/*
          Primary veil fill — deep smoked pearl / champagne-tinted translucent.
          Intentionally near-opaque so the image beneath is only a silhouette.
          No red; very restrained warm-neutral with the faintest rose in
          highlights only.
        */}
        <linearGradient id="veil-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          {/* top-left: cool smoke */}
          <stop offset="0%"   stopColor="oklch(0.14 0.008 230)" stopOpacity="0.94" />
          {/* mid: deep warm charcoal */}
          <stop offset="30%"  stopColor="oklch(0.12 0.006 30)"  stopOpacity="0.96" />
          {/* highlight band: faint pearl champagne — the only warmth */}
          <stop offset="52%"  stopColor="oklch(0.22 0.018 55)"  stopOpacity="0.88" />
          {/* mid-low: cool smoke again */}
          <stop offset="72%"  stopColor="oklch(0.11 0.007 220)"  stopOpacity="0.95" />
          {/* bottom-right: very deep */}
          <stop offset="100%" stopColor="oklch(0.10 0.006 15)"  stopOpacity="0.97" />
        </linearGradient>

        {/*
          Secondary stripe fill — slightly lighter so the weave has
          very subtle tonal variation, not flat.
        */}
        <linearGradient id="veil-fill-alt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="oklch(0.16 0.010 210)" stopOpacity="0.92" />
          <stop offset="40%"  stopColor="oklch(0.14 0.008 30)"  stopOpacity="0.94" />
          <stop offset="58%"  stopColor="oklch(0.24 0.020 52)"  stopOpacity="0.86" />
          <stop offset="100%" stopColor="oklch(0.12 0.007 10)"  stopOpacity="0.96" />
        </linearGradient>

        {/*
          Dissolve filter — feathers the edge of each segment as it
          transitions from visible to hidden, giving the "fabric lifting"
          feel rather than a hard cut.
        */}
        <filter id="veil-edge" x="-4%" y="-4%" width="108%" height="108%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {paths.map((d, i) => {
        if (!d) return null
        if (visibleSegments.has(i)) return null

        // Alternate between two near-identical fills for the weave depth
        const fill = i % 2 === 0 ? "url(#veil-fill)" : "url(#veil-fill-alt)"

        return (
          <path
            key={i}
            d={d}
            fill={fill}
            filter="url(#veil-edge)"
            style={{
              transition: "opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
              opacity: 1,
            }}
          />
        )
      })}

      {/*
        Pearl sheen lines — extremely subtle diagonal highlights across
        the whole veil surface. Give the fabric/satin texture without
        looking like a filter. Kept at very low opacity.
      */}
      <g opacity="0.035" strokeWidth="1.2" stroke="oklch(0.90 0.025 55)">
        {Array.from({ length: 18 }, (_, i) => {
          const offset = (i * (W + H)) / 18
          const c = offset - H
          const x0 = Math.max(0, Math.min(W, c))
          const y0 = Math.max(0, -c)
          const x1 = Math.min(W, c + H)
          const y1 = Math.min(H, W - c)
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} />
        })}
      </g>
    </svg>
  )
}
