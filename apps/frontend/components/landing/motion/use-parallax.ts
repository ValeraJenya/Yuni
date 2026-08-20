"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "./use-reduced-motion"

interface ParallaxOptions {
  /** Peak offset in px at the top and bottom of the travel. */
  strength?: number
  /** Below this viewport width the effect stays off. */
  minWidth?: number
}

/**
 * Drifts an element against the scroll direction by a few pixels.
 *
 * The element is expected to be overscaled by its caller (taller than its frame),
 * so the drift never exposes an edge. Writes are batched into a single rAF and the
 * listener is skipped entirely for reduced motion or narrow viewports.
 */
export function useParallax<T extends HTMLElement>({
  strength = 28,
  minWidth = 1024,
}: ParallaxOptions = {}) {
  const ref = useRef<T | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (reduced || window.innerWidth < minWidth) {
      node.style.transform = ""
      return
    }

    let frame = 0

    const update = () => {
      frame = 0
      const rect = node.getBoundingClientRect()
      const viewport = window.innerHeight

      // -1 when the element sits below the fold, +1 once it has scrolled past the top.
      const progress = (viewport / 2 - (rect.top + rect.height / 2)) / (viewport / 2 + rect.height / 2)
      const clamped = Math.max(-1, Math.min(1, progress))

      node.style.transform = `translate3d(0, ${(clamped * strength).toFixed(2)}px, 0)`
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      node.style.transform = ""
    }
  }, [reduced, strength, minWidth])

  return ref
}
