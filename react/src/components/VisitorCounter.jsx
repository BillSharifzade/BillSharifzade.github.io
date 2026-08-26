import { useEffect, useRef, useState } from 'react'
import './VisitorCounter.css'

// Unique-visitor counter backed by Abacus (https://abacus.jasoncameron.dev):
// GET /hit/{ns}/{key} increments and returns {"value":N}; /get reads without
// incrementing. A localStorage flag decides which one this browser calls, so
// each visitor is counted once. If storage is unavailable (private mode) we
// only ever read — never double-count. If the API is unreachable after one
// retry, the component renders nothing rather than a broken pill.
const API = 'https://abacus.jasoncameron.dev'
const NAMESPACE = 'billsharifzade-github-io'
// Dev builds hit a separate key so local testing never inflates the real count.
const COUNTER_KEY = import.meta.env.DEV ? 'unique-visitors-dev' : 'unique-visitors'
const VISITED_FLAG = 'bs_uv_counted_v1'

const formatter = new Intl.NumberFormat('en-US')

function readVisitedFlag() {
  try {
    return localStorage.getItem(VISITED_FLAG) === '1'
  } catch {
    return null
  }
}

function markVisited() {
  try {
    localStorage.setItem(VISITED_FLAG, '1')
  } catch {
    // Private mode — this visit may count again next time; acceptable.
  }
}

async function fetchValue(action, signal) {
  const res = await fetch(`${API}/${action}/${NAMESPACE}/${COUNTER_KEY}`, { signal })
  if (!res.ok) throw new Error(`abacus ${action}: ${res.status}`)
  const value = Number((await res.json())?.value)
  if (!Number.isFinite(value)) throw new Error('abacus: bad payload')
  return value
}

export default function VisitorCounter() {
  const [count, setCount] = useState(null)
  const [display, setDisplay] = useState(0)
  const rootRef = useRef(null)

  useEffect(() => {
    const action = readVisitedFlag() === false ? 'hit' : 'get'
    let cancelled = false
    let active = null

    ;(async () => {
      for (let i = 0; i < 2; i++) {
        const controller = new AbortController()
        active = controller
        const timer = setTimeout(() => controller.abort(), 5000)
        try {
          const value = await fetchValue(action, controller.signal)
          clearTimeout(timer)
          // Flag before the cancelled check: the server already counted this
          // hit, and skipping the flag (unmount, StrictMode re-run) would
          // count the same visitor again next time.
          if (action === 'hit') markVisited()
          if (cancelled) return
          setCount(value)
          return
        } catch {
          clearTimeout(timer)
          if (cancelled) return
          await new Promise((r) => setTimeout(r, 700))
          if (cancelled) return
        }
      }
      // Both attempts failed — stay hidden.
    })()

    return () => {
      cancelled = true
      active?.abort()
    }
  }, [])

  // Count up from zero once the pill scrolls into view.
  useEffect(() => {
    if (count === null) return
    const el = rootRef.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(count)
      return
    }
    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        const duration = 1100
        const start = performance.now()
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(1 - t, 3)
          setDisplay(Math.round(count * eased))
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [count])

  if (count === null) return null

  return (
    <div
      className="visitor-counter"
      ref={rootRef}
      role="status"
      aria-label={`${formatter.format(count)} unique visitors`}
    >
      <span className="vc-dot" aria-hidden="true" />
      <i className="fas fa-eye" aria-hidden="true" />
      <span className="vc-count" aria-hidden="true">{formatter.format(display)}</span>
      <span className="vc-label" aria-hidden="true">unique visitors</span>
    </div>
  )
}
