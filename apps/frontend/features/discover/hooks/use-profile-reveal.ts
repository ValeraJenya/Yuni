"use client"

import { useState, useCallback, useMemo } from "react"
import type { RevealZoneId, RevealState } from "@/features/discover/types/reveal"

// ─── Segment distribution ───────────────────────────────────────────────────
// 60 segments interleaved across 4 zones in a repeating pattern so each zone
// reveals evenly spread fragments across the whole image surface.
// Pattern: identity=0, description=1, tags=2, details=3, repeat × 15

const ZONE_IDS: RevealZoneId[] = ["identity", "description", "tags", "details"]
const TOTAL_SEGMENTS = 60
const SEGMENTS_PER_ZONE = 15

function buildZoneSegmentMap(): Record<RevealZoneId, number[]> {
  const map: Record<RevealZoneId, number[]> = {
    identity: [],
    description: [],
    tags: [],
    details: [],
  }
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    const zoneIndex = i % 4
    map[ZONE_IDS[zoneIndex]].push(i)
  }
  return map
}

export const ZONE_SEGMENT_MAP = buildZoneSegmentMap()

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useProfileReveal(profileId: string) {
  const [unlockedZones, setUnlockedZones] = useState<Set<RevealZoneId>>(new Set())
  const [hoveredZone, setHoveredZone] = useState<RevealZoneId | null>(null)

  // Reset when profile changes
  const [lastProfileId, setLastProfileId] = useState(profileId)
  if (profileId !== lastProfileId) {
    setLastProfileId(profileId)
    setUnlockedZones(new Set())
    setHoveredZone(null)
  }

  const unlockZone = useCallback((zone: RevealZoneId) => {
    setUnlockedZones((prev) => {
      if (prev.has(zone)) return prev
      const next = new Set(prev)
      next.add(zone)
      return next
    })
  }, [])

  const hoverZone = useCallback((zone: RevealZoneId | null) => {
    setHoveredZone(zone)
  }, [])

  const state: RevealState = useMemo(() => {
    const progress = unlockedZones.size
    return {
      unlockedZones,
      hoveredZone,
      progress,
      isFullyRevealed: progress === 4,
    }
  }, [unlockedZones, hoveredZone])

  // Which segment indices are currently visible (veil removed)
  const visibleSegments = useMemo((): Set<number> => {
    const set = new Set<number>()
    for (const zone of unlockedZones) {
      for (const idx of ZONE_SEGMENT_MAP[zone]) {
        set.add(idx)
      }
    }
    return set
  }, [unlockedZones])

  // Which segment indices are highlighted (hovered zone preview)
  const highlightedSegments = useMemo((): Set<number> => {
    if (!hoveredZone || unlockedZones.has(hoveredZone)) return new Set()
    return new Set(ZONE_SEGMENT_MAP[hoveredZone])
  }, [hoveredZone, unlockedZones])

  return {
    state,
    visibleSegments,
    highlightedSegments,
    unlockZone,
    hoverZone,
    ZONE_IDS,
    SEGMENTS_PER_ZONE,
    TOTAL_SEGMENTS,
  }
}
