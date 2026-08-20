"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

/** Reduced motion is assumed on the server, so motion never starts before the preference is known. */
function getServerSnapshot() {
  return true
}

/**
 * Tracks the user's reduced-motion preference.
 *
 * CSS-driven effects gate themselves through the `@media (prefers-reduced-motion)`
 * block in `globals.css`. This hook exists for the JS-driven ones — parallax writes
 * inline transforms, which a media query cannot reliably override.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
