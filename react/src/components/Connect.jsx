import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import DownloadCvButton from './DownloadCvButton.jsx'
import MintakaMark from './MintakaMark.jsx'
import { MINTAKA, MINTAKA_MARK, circlePath } from '../data/mintaka.js'
import { channels } from '../data/contacts.js'
import { SIGNAL_LOGO } from '../data/signalLogo.js'
import { ICON_PATHS } from '../data/icons.js'
import { CHARACTERS as RAMP } from '../utils/asciiGrid.js'
import './Connect.css'

const EMAIL = channels.find((c) => c.label === 'Email')
const OTHERS = channels.filter((c) => c !== EMAIL)

// What a press on each card does, said plainly.
const VERB = { Signal: 'Message me', Telegram: 'Message me', LinkedIn: 'Connect', GitHub: 'See my code' }

// Each card's brand mark as vector paths in its own box, for the ASCII drawing.
const shape = (name) => {
  const [w, h, d] = ICON_PATHS[name]
  return { w, h, paths: [d] }
}
const SHAPES = {
  Email: shape('envelope'),
  Signal: { w: SIGNAL_LOGO.viewBox[2], h: SIGNAL_LOGO.viewBox[3], paths: SIGNAL_LOGO.paths },
  Telegram: shape('telegram'),
  LinkedIn: shape('linkedin'),
  GitHub: shape('github'),
  // The viewBox doesn't start at 0 0: x and y move it there.
  Mintaka: (() => {
    const [x, y, w, h] = MINTAKA_MARK.viewBox.split(' ').map(Number)
    const { body, betelgeuse, mintaka, belt } = MINTAKA_MARK
    return { x, y, w, h, paths: [body, ...[betelgeuse, mintaka, ...belt].map(circlePath)] }
  })(),
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ---- The backdrop's ramp, as text ----------------------------------------- */

const TOP = RAMP.length // past the ramp: the real character
const STEP = 36

/**
 * Runs every span's character up the ramp (= + x X 0 S 8 # @) into its own
 * character, left to right. From blank, the text condenses out of nothing.
 * Returns a function that stops it and puts the text back.
 */
function condense(spans, text, { blank = false, stagger = 22 } = {}) {
  let raf = 0
  const t0 = performance.now()
  const show = (el, i, pos) => {
    const ch = pos <= 0 ? ' ' : pos >= TOP ? text[i] : RAMP[pos]
    if (el.textContent !== ch) el.textContent = ch
    el.toggleAttribute('data-noise', pos > 0 && pos < TOP)
  }
  const frame = (now) => {
    let busy = false
    spans.forEach((el, i) => {
      const k = Math.floor((now - t0 - i * stagger) / STEP)
      if (k < 0) {
        busy = true
        return show(el, i, blank ? 0 : TOP)
      }
      if (k < TOP - 1) busy = true
      show(el, i, k + 1)
    })
    raf = busy ? requestAnimationFrame(frame) : 0
  }
  spans.forEach((el, i) => show(el, i, blank ? 0 : TOP))
  raf = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(raf)
    spans.forEach((el, i) => show(el, i, TOP))
  }
}

/* ---- Brand marks drawn in the backdrop's characters ----------------------- */

/** How dense each cell of a mark is, as a step of the ramp (0 = empty). */
function rasterise({ x = 0, y = 0, w, h, paths }, cols, rows) {
  // Six by ten pixels a cell: the shape of a JetBrains Mono character.
  const cw = 6
  const ch = 10
  const canvas = document.createElement('canvas')
  canvas.width = cols * cw
  canvas.height = rows * ch
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  const s = Math.min(canvas.width / w, canvas.height / h) * 0.96
  ctx.translate((canvas.width - w * s) / 2, (canvas.height - h * s) / 2)
  ctx.scale(s, s)
  ctx.translate(-x, -y)
  ctx.fillStyle = '#fff'
  paths.forEach((d) => ctx.fill(new Path2D(d)))
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const levels = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sum = 0
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) sum += data[((r * ch + y) * canvas.width + c * cw + x) * 4 + 3]
      }
      const cover = sum / (cw * ch * 255)
      levels.push(cover < 0.06 ? 0 : Math.min(TOP - 1, 1 + Math.round(cover * (TOP - 2))))
    }
  }
  return levels
}

// `at(c, r, v)` may swap a cell's step for another while the light passes.
const asText = (levels, cols, at = (c, r, v) => v) =>
  Array.from({ length: levels.length / cols }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const v = levels[r * cols + c]
      return v ? RAMP[at(c, r, v)] : ' '
    }).join('')
  ).join('\n')

/**
 * A brand mark drawn in the ramp's characters into the returned ref's <pre>
 * once mounted, and `shine()`, which sends a band across it that scrambles
 * whatever it passes, the way the backdrop does under the pointer.
 */
function useAsciiMark(label, cols, rows) {
  const ref = useRef(null)
  const levels = useRef(null)
  const sweep = useRef(0)

  useEffect(() => {
    levels.current = rasterise(SHAPES[label], cols, rows)
    if (levels.current && ref.current) ref.current.textContent = asText(levels.current, cols)
    return () => {
      cancelAnimationFrame(sweep.current)
      sweep.current = 0
    }
  }, [label, cols, rows])

  const shine = useCallback(() => {
    const base = levels.current
    const el = ref.current
    if (!base || !el || sweep.current || reduced()) return
    const t0 = performance.now()
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / 650)
      const x = -6 + (cols + rows + 12) * t
      el.textContent = asText(base, cols, (c, r, v) =>
        Math.abs(c + r * 0.6 - x) < 2.4 ? 1 + Math.floor(Math.random() * (TOP - 1)) : v
      )
      if (t < 1) sweep.current = requestAnimationFrame(frame)
      else {
        sweep.current = 0
        el.textContent = asText(base, cols)
      }
    }
    sweep.current = requestAnimationFrame(frame)
  }, [cols, rows])

  return [ref, shine]
}

/** A channel's card: its mark in ASCII, scrambled by a passing band on hover. */
function Channel({ channel }) {
  const [artRef, shine] = useAsciiMark(channel.label, 22, 11)

  return (
    <li className="chan" data-channel={channel.label.toLowerCase()}>
      <a
        className="chan__link"
        href={channel.href}
        {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        onPointerEnter={shine}
        onFocus={shine}
      >
        <pre className="chan__art" ref={artRef} aria-hidden="true" />
        <span className="chan__mark" aria-hidden="true">
          {channel.logo === 'signal' ? (
            <svg viewBox={`0 0 ${SHAPES.Signal.w} ${SHAPES.Signal.h}`} focusable="false">
              {SIGNAL_LOGO.paths.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
          ) : (
            <Icon name={channel.icon} />
          )}
        </span>
        <span className="chan__name">{channel.label}</span>
        <span className="chan__handle">{channel.handle}</span>
        <span className="chan__verb">
          {VERB[channel.label]} <span aria-hidden="true">↗</span>
        </span>
        {channel.external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    </li>
  )
}

/**
 * For work that needs a team: Mintaka, the studio, and its brief form. Drawn
 * like the channel cards, a full row under them.
 */
function Studio() {
  const [artRef, shine] = useAsciiMark('Mintaka', 15, 12)

  return (
    <a
      className="studio"
      href={MINTAKA.brief}
      target="_blank"
      rel="noopener noreferrer"
      onPointerEnter={shine}
      onFocus={shine}
    >
      <pre className="studio__art" ref={artRef} aria-hidden="true" />
      <span className="studio__mark" aria-hidden="true">
        <MintakaMark />
      </span>
      <span className="studio__text">
        <span className="studio__name">
          Mintaka <em>my studio</em>
        </span>
        <span className="studio__line">
          Need a whole team? We build high-load Rust backends and the fast interfaces on top of them.
        </span>
        <span className="studio__verb">
          Start a project <span aria-hidden="true">↗</span>
        </span>
      </span>
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/* ---- Dushanbe's clock ----------------------------------------------------- */

const DUSHANBE = 'Asia/Dushanbe'

/** Dushanbe's time, ticking while `live`, and whether it is day there. */
function useDushanbeClock(live) {
  const [now, setNow] = useState(null)
  useEffect(() => {
    if (!live) return undefined
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: DUSHANBE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    const tick = () => setNow(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [live])
  const hour = now ? Number(now.slice(0, 2)) : null
  return { now, day: hour === null ? null : hour >= 8 && hour < 23 }
}

/** The clock line. Its own component, so the tick re-renders it alone. */
function DushanbeClock({ live, ahead }) {
  const { now, day } = useDushanbeClock(live)
  return (
    <p className="connect__clock" data-day={day === null ? undefined : day ? 'day' : 'night'}>
      <i aria-hidden="true" />
      <time className="connect__time">{now ?? '--:--:--'}</time>
      <span>
        in Dushanbe{day !== null && <span className="connect__daypart"> · {day ? 'daytime' : 'night'}</span>}
        {ahead && ` · ${ahead}`}
      </span>
    </p>
  )
}

function aheadOf(offsetMinutes) {
  // Dushanbe is UTC+5 all year; getTimezoneOffset() is minutes *behind* UTC.
  const diff = 300 + offsetMinutes
  if (diff === 0) return 'same time as you'
  const h = Math.abs(diff) / 60
  const span = `${Number.isInteger(h) ? h : h.toFixed(1)} h`
  return diff > 0 ? `${span} ahead of you` : `${span} behind you`
}

/**
 * Let's Connect: email first, as large as the page allows, with the two
 * things people do with an address (copy it, write to it), then one card per
 * other channel. Every card is a plain link.
 *
 * It speaks the backdrop's language: the address condenses out of the ASCII
 * ramp when the section comes into view (and again when it is copied), and
 * each card's brand mark is drawn in the ramp's characters, crossed by a band
 * of light on hover. A live clock says what time it is in Dushanbe.
 *
 * The pre-rendered page and reduced motion show the address as plain text.
 */
export default function Connect() {
  const rootRef = useRef(null)
  const addrRef = useRef(null)
  const stop = useRef(null)
  const copyTimer = useRef(0)
  const [live, setLive] = useState(false) // on screen, tab visible
  const [copied, setCopied] = useState(false)
  const [ahead, setAhead] = useState('')
  const [envelopeRef, shineEnvelope] = useAsciiMark('Email', 34, 14)

  useEffect(() => {
    const el = rootRef.current
    const spans = [...addrRef.current.children]
    const still = reduced()
    setAhead(aheadOf(new Date().getTimezoneOffset()))
    // Out of sight the address waits blank, to condense when it is reached.
    let fresh = !still
    if (fresh) spans.forEach((s) => (s.textContent = ' '))
    let seen = false
    const update = () => setLive(seen && !document.hidden)
    const io = new IntersectionObserver(
      ([e]) => {
        seen = e.isIntersecting
        if (seen && fresh) {
          fresh = false
          stop.current = condense(spans, EMAIL.handle, { blank: true })
          shineEnvelope()
        }
        update()
      },
      { threshold: 0.35 }
    )
    io.observe(el)
    document.addEventListener('visibilitychange', update)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', update)
      clearTimeout(copyTimer.current)
      stop.current?.()
      spans.forEach((s, i) => (s.textContent = EMAIL.handle[i]))
    }
  }, [shineEnvelope])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL.handle)
    } catch {
      // Older browsers and insecure contexts: copy through a selection.
      const area = document.createElement('textarea')
      area.value = EMAIL.handle
      area.setAttribute('readonly', '')
      area.style.cssText = 'position:fixed;opacity:0'
      document.body.append(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 2000)
    if (!reduced()) {
      stop.current?.()
      stop.current = condense([...addrRef.current.children], EMAIL.handle, { stagger: 12 })
      shineEnvelope()
    }
  }

  return (
    <div className="connect" ref={rootRef}>
      <div className="connect__status">
        <DushanbeClock live={live} ahead={ahead} />
        <DownloadCvButton className="download-cv-btn--connect" />
      </div>

      <div className="connect__mail" onPointerEnter={shineEnvelope}>
        <pre className="connect__art" ref={envelopeRef} aria-hidden="true" />
        <p className="connect__lead">
          Hiring, building something, or want to talk systems? Every channel here reaches me directly.
        </p>
        <p className="connect__kicker">
          <Icon name="envelope" /> Email
        </p>
        <button type="button" className="connect__addr" onClick={copy} aria-label={`Copy ${EMAIL.handle}`}>
          <span ref={addrRef} aria-hidden="true">
            {[...EMAIL.handle].map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </span>
        </button>
        <div className="connect__actions">
          <button type="button" className="connect__btn connect__btn--solid" onClick={copy} data-done={copied ? '' : undefined}>
            <Icon name={copied ? 'check' : 'copy'} />
            {copied ? 'Copied' : 'Copy address'}
          </button>
          <a className="connect__btn" href={EMAIL.href}>
            <Icon name="paper-plane" /> Write an email
          </a>
        </div>
        <p className="sr-only" aria-live="polite">
          {copied ? 'Email address copied to the clipboard.' : ''}
        </p>
      </div>

      <ul className="connect__chans" aria-label="Other ways to reach me">
        {OTHERS.map((c) => (
          <Channel key={c.label} channel={c} />
        ))}
      </ul>

      <Studio />
    </div>
  )
}
