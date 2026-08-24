"use client"

import { Fragment } from "react"

interface RevealTextProps {
  text: string
  className?: string
  /** Seconds before the first word starts. */
  delay?: number
  /** Seconds between consecutive words. */
  stagger?: number
}

/**
 * Splits `text` into words that fade and lift into place one after another.
 *
 * Words are rendered as inline-block spans separated by real text nodes, so the
 * spacing collapses normally and screen readers still read the line as one phrase.
 * The animation itself lives in `globals.css` (`.motion-reveal-word`) and is
 * disabled wholesale under `prefers-reduced-motion`.
 */
export function RevealText({ text, className, delay = 0, stagger = 0.07 }: RevealTextProps) {
  const words = text.split(" ")

  return (
    // Keyed on the text so switching language replays the reveal instead of
    // swapping the words in mid-animation.
    <span key={text} className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span
            className="motion-reveal-word"
            style={{ animationDelay: `${(delay + i * stagger).toFixed(3)}s` }}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  )
}
