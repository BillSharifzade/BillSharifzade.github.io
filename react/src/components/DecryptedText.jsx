import { useEffect, useRef, useState } from 'react'

const RANDOM_CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[]<>?/\\|~'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function scramble(text, revealCount) {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    if (i < revealCount || text[i] === ' ') {
      result += text[i]
    } else {
      result += RANDOM_CHAR_SET[Math.floor(Math.random() * RANDOM_CHAR_SET.length)]
    }
  }
  return result
}

/**
 * Scrambled text that resolves itself.
 *
 * `trigger="scroll"` (the default) holds the copy scrambled until it reaches the
 * viewport, matching SectionTitle/StrokeText. Running on mount meant a reload
 * anywhere on the page burned the reveal off-screen, and every block below the
 * fold paid for its timers before anyone could see them.
 *
 * The placeholder is scrambled at the full length of the text, so nothing
 * reflows when the reveal starts. It is also gibberish for as long as it sits
 * unread, so the real string is carried alongside it for screen readers and the
 * visible run is marked decorative.
 *
 * Frames are driven by rAF against elapsed time rather than by a setTimeout per
 * character: at the intervalMs=8 the About copy uses, a timer chain re-rendered
 * roughly twice per painted frame for nothing.
 */
export default function DecryptedText({
  text,
  play = true,
  trigger = 'scroll',
  intervalMs = 12,
  step = 2,
  className,
  ...rest
}) {
  const hostRef = useRef(null)
  const outRef = useRef(null)
  // State only covers the first paint; the reveal itself writes to the DOM.
  const [initial] = useState(() => (play && !prefersReducedMotion() ? scramble(text, 0) : text))

  useEffect(() => {
    const out = outRef.current
    const host = hostRef.current
    if (!out || !host) return

    if (!play || prefersReducedMotion()) {
      out.textContent = text
      return
    }

    let raf = null
    let startedAt = 0
    // Same pacing as the old timer chain: one character every intervalMs * step.
    const msPerChar = Math.max(1, intervalMs * step)

    const frame = (now) => {
      if (!startedAt) startedAt = now
      const revealCount = Math.min(text.length, Math.floor((now - startedAt) / msPerChar))
      out.textContent = scramble(text, revealCount)
      raf = revealCount < text.length ? requestAnimationFrame(frame) : null
    }

    const start = () => {
      if (raf === null && startedAt === 0) raf = requestAnimationFrame(frame)
    }

    if (trigger !== 'scroll' || typeof IntersectionObserver === 'undefined') {
      start()
      return () => {
        if (raf !== null) cancelAnimationFrame(raf)
      }
    }

    // The bottom inset puts the start line at 82% of the viewport, where
    // StrokeText's ScrollTrigger fires, so a heading and the copy under it come
    // in together.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        start()
      },
      { threshold: 0, rootMargin: '0px 0px -18% 0px' }
    )
    io.observe(host)

    return () => {
      io.disconnect()
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [text, play, trigger, intervalMs, step])

  return (
    <span ref={hostRef} className={className} {...rest}>
      <span className="sr-only">{text}</span>
      <span ref={outRef} aria-hidden="true">
        {initial}
      </span>
    </span>
  )
}
