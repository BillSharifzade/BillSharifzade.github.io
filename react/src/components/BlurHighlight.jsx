import { memo, useEffect, useMemo, useRef } from 'react'
import './BlurHighlight.css'

// Delay between words as they blur in, and how long each takes (BlurHighlight.css).
const WORD_STAGGER = 16
const WORD_IN = 650

// "plain [[marked phrase]] plain" → [{ text, mark }]
function parse(text) {
  return text
    .split(/(\[\[.*?\]\])/)
    .filter(Boolean)
    .map((part) => (part.startsWith('[[') ? { text: part.slice(2, -2), mark: true } : { text: part, mark: false }))
}

/**
 * A paragraph that blurs in word by word as it scrolls into view, then lights
 * up its key phrases, written as `[[phrase]]` in `text`.
 *
 * The pre-rendered HTML, reduced motion and a missing IntersectionObserver all
 * get the finished state: every word in place and the phrases highlighted.
 * The effect only arms itself once React runs, so the text never depends on it.
 */
function BlurHighlight({ text, className = '', ...rest }) {
  const rootRef = useRef(null)
  const segments = useMemo(() => parse(text), [text])

  let word = 0
  let mark = 0
  const nodes = segments.map((seg, s) => {
    const words = seg.text.split(/(\s+)/).map((piece, k) =>
      /^\s+$/.test(piece) || !piece ? (
        piece
      ) : (
        <span key={k} className="bh-word" style={{ '--w': word++ }}>
          {piece}
        </span>
      )
    )
    return seg.mark ? (
      <mark key={s} className="bh-mark" style={{ '--m': mark++ }}>
        {words}
      </mark>
    ) : (
      <span key={s}>{words}</span>
    )
  })
  const done = word * WORD_STAGGER + WORD_IN * 0.6

  useEffect(() => {
    const el = rootRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    el.dataset.state = 'armed'
    let first = true
    const io = new IntersectionObserver(
      (entries) => {
        const { boundingClientRect: r, intersectionRatio } = entries[entries.length - 1]
        // Text already on screen when the page loads plays straight away, rather
        // than sit blank at the fold until the first scroll; the rest waits for
        // a quarter of itself to come into view.
        const go = first ? r.top < window.innerHeight && r.bottom > 0 : intersectionRatio >= 0.25
        first = false
        if (!go) return
        io.disconnect()
        el.dataset.state = 'in'
      },
      { threshold: [0, 0.25], rootMargin: '0px 0px -12% 0px' }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      delete el.dataset.state
    }
  }, [text])

  return (
    <span
      ref={rootRef}
      className={`blur-highlight${className ? ` ${className}` : ''}`}
      style={{ '--bh-done': `${Math.round(done)}ms`, '--bh-stagger': `${WORD_STAGGER}ms`, '--bh-in': `${WORD_IN}ms` }}
      {...rest}
    >
      {nodes}
    </span>
  )
}

export default memo(BlurHighlight)
