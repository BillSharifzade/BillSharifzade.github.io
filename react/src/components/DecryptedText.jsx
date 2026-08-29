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
