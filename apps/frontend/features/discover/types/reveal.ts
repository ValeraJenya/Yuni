// ─── Yuni Veil Reveal — types ────────────────────────────────────────────────

export type RevealZoneId = "identity" | "description" | "tags" | "details"

export interface RevealZone {
  id: RevealZoneId
  /** Indices into the 60-segment array that belong to this zone */
  segmentIndices: number[]
}

export interface RevealState {
  /** Which zones have been unlocked by the user */
  unlockedZones: Set<RevealZoneId>
  /** Zone currently being hovered/focused (for segment highlight preview) */
  hoveredZone: RevealZoneId | null
  /** Progress 0–4 */
  progress: number
  /** All 4 zones unlocked */
  isFullyRevealed: boolean
}
