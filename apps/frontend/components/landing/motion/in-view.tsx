"use client"

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react"

interface InViewProps {
  children: ReactNode
  className?: string
  /** Milliseconds to hold before this block reveals — used to stagger siblings. */
  delay?: number
  /** How much of the block must be on screen before it reveals. */
  threshold?: number
  /** Element to render. Defaults to a plain div. */
  as?: ElementType
  /** Merged ahead of the reveal delay, so callers keep their own styling. */
  style?: CSSProperties
}

/**
 * Reveals its children (fade + slide up) the first time they scroll into view.
 *
 * The hidden state and the transition are both CSS (`[data-reveal]` in
 * `globals.css`); this component only flips `data-visible`. Reduced motion is
 * handled there too, which forces the resting state and skips the transition.
 */
export function InView({
  children,
  className,
  delay = 0,
  threshold = 0.15,
  as: Tag = "div",
  style,
}: InViewProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Older engines without IntersectionObserver get the content immediately
    // rather than a block that never reveals.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal=""
      data-visible={visible ? "true" : "false"}
      style={
        delay ? ({ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties) : style
      }
    >
      {children}
    </Tag>
  )
}
