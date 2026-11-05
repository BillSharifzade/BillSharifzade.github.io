import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'
import { CV_BASENAME, CV_FORMATS, downloadCv } from '../data/cvFormats.js'
import { CHARACTERS as RAMP, hash12 } from '../utils/asciiGrid.js'
import './CvFormatDialog.css'

// The preview is a sheet of COLS × ROWS characters, like a terminal screen.
const COLS = 64
const ROWS = 40
// Printing: each changed character climbs the ramp in CLIMB steps of STEP ms,
// a row starts ROW_GAP ms after the one above, and JITTER spreads a row out.
const TOP = RAMP.length
const STEP = 32
const CLIMB = 4
const ROW_GAP = 7
const JITTER = 90
// How long the dialog stays after a pick, so the row can say so.
const LINGER = 700

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// What each preview is drawn from. The binary files say what the plain ones
// say: the PDF and DOCX are the TXT's terminal session set as a page, and the
// XLSX holds the CSV's rows.
const PREVIEW = { pdf: 'page', docx: 'page', xlsx: 'sheet', csv: 'csv', md: 'md', txt: 'txt' }
const SOURCES = ['txt', 'md', 'csv']

// Fetched once, the first time the dialog opens; a failure is tried again
// next time.
let sources = null
const loadSources = () =>
  (sources ??= Promise.all(
    SOURCES.map((id) =>
      fetch(CV_FORMATS.find((f) => f.id === id).href).then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
    )
  ).then(
    (texts) => Object.fromEntries(SOURCES.map((id, i) => [id, texts[i].replace(/^\uFEFF/, '')])),
    (err) => {
      sources = null
      throw err
    }
  ))

// Text as the backdrop would print it: each letter becomes a ramp character
// as tall as the letter, so the words keep their shapes.
const greek = (line, lift = 0) =>
  line.replace(/[^\s›·]/g, (ch) => {
    const tall = /[A-Z0-9]/.test(ch) ? 5 : /[bdfhkltgjpqy]/.test(ch) ? 4 : /[a-z]/.test(ch) ? 3 : 2
    return RAMP[Math.min(TOP - 1, tall + lift)]
  })

const PROMPT = /^\S+@\S+\$ /

// The page: prompts and section rules as they are, the name and the role
// legible, the rest printed as texture, inside a margin like paper's. A line
// with an indented one under it is a heading (a job, a project) and prints
// bolder.
function page(txt) {
  const src = txt.split('\n')
  let prompted = false
  let ruled = false
  let named = false
  const out = src.map((line, i) => {
    const answer = prompted
    prompted = PROMPT.test(line)
    if (prompted) return ['lo', line]
    if (line.startsWith('──')) {
      ruled = true
      return ['hi', line]
    }
    const indent = /^\s/.test(line)
    if (answer && !indent) {
      const tone = named ? 'hi' : 'name'
      named = true
      return [tone, line]
    }
    // Contacts before the first rule, and dates pushed to the right.
    if (!ruled || /^ {8}/.test(line)) return ['lo', greek(line)]
    return ['', greek(line, !indent && /^\s/.test(src[i + 1] ?? '') ? 2 : 0)]
  })
  return {
    lines: ['', ...out.map(([, l]) => `   ${l.slice(0, COLS - 6)}`)],
    tones: ['', ...out.map(([t]) => t)],
  }
}

const plain = (text) => ({ lines: text.split('\n').map((l) => ` ${l}`), tones: [] })

// Enough CSV for cvgen's: quoted fields may hold commas and doubled quotes.
const parseCsv = (text) =>
  text
    .trim()
    .split(/\r?\n/)
    .map((line) =>
      [...line.matchAll(/("(?:[^"]|"")*"|[^,]*)(?:,|$)/g)].map((m) => m[1].replace(/^"|"$/g, '').replace(/""/g, '"'))
    )

// cvgen's first sheet, Profile, also holds the contacts and the interests
// (cvgen/src/xlsx.rs); every other section is a sheet of its own.
const FOLDED = ['Contact', 'Extras']

function sheet(csv) {
  const rows = parseCsv(csv).slice(1)
  const names = [...new Set(rows.map((r) => r[0]))].filter((s) => !FOLDED.includes(s))
  const cells = [['Field', 'Value'], ...rows.filter((r) => r[0] === names[0] || FOLDED.includes(r[0])).map((r) => r.slice(1))]
  const A = 11
  const lines = [`    │ ${'A'.padEnd(A)}│ B`, `────┼${'─'.repeat(A + 1)}┼${'─'.repeat(COLS)}`]
  const tones = ['lo', 'lo']
  for (let n = 1; lines.length < ROWS - 2; n++) {
    const [a = '', b = ''] = cells[n - 1] ?? []
    lines.push(`${String(n).padStart(3)} │ ${a.slice(0, A).padEnd(A)}│ ${b}`)
    tones.push(n === 1 ? 'hi' : '')
  }
  lines.push('─'.repeat(COLS), ` ${names.map((s, i) => (i ? s : `[${s}]`)).join('  ')}`)
  tones.push('lo', 'hi')
  return { lines, tones }
}

const BUILD = {
  page: (src) => page(src.txt),
  sheet: (src) => sheet(src.csv),
  csv: (src) => plain(src.csv),
  md: (src) => plain(src.md),
  txt: (src) => plain(src.txt),
}

/**
 * Prints `lines` into `els`, one element per line and `width` characters
 * each. A character that changes climbs the backdrop's ramp into its new self
 * and one that goes away steps back down it, row by row from the top. Picks
 * up from whatever the elements show, so a print can cut into another.
 * Returns a stop.
 */
function print(els, { lines, tones }, width) {
  const from = els.map((el) => el.textContent.padEnd(width))
  const to = els.map((_, r) => (lines[r] ?? '').slice(0, width).padEnd(width))
  if (reduced()) {
    els.forEach((el, r) => {
      el.textContent = to[r]
      el.dataset.tone = tones[r] ?? ''
    })
    return () => {}
  }
  const t0 = performance.now()
  let raf = 0
  const frame = (now) => {
    let busy = false
    els.forEach((el, r) => {
      const t = now - t0 - r * ROW_GAP
      if (t < 0) return (busy = true)
      el.dataset.tone = tones[r] ?? ''
      if (from[r] === to[r]) return
      let line = ''
      for (let c = 0; c < width; c++) {
        const a = from[r][c]
        const b = to[r][c]
        const k = a === b ? CLIMB : Math.floor((t - hash12(c, r) * JITTER) / STEP)
        const steps = b === ' ' ? 2 : CLIMB
        if (k < 0) line += a
        else if (k >= steps) line += b
        else line += b === ' ' ? RAMP[2 - k] : RAMP[1 + Math.round((k * (TOP - 2)) / (CLIMB - 1))]
        if (k < steps) busy = true
      }
      el.textContent = line
    })
    raf = busy ? requestAnimationFrame(frame) : 0
  }
  raf = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(raf)
}

/**
 * The CV download, as one of the site's windows. The list on the left is the
 * choice, a terminal picker whose bar follows the pointer and the keys, and a
 * pick downloads at once. The sheet on the right shows what the file under the
 * bar holds, printed in the ASCII backdrop's characters: the PDF and DOCX as a
 * page, the XLSX as its first sheet, and the plain files as they are.
 */
function CvWindow({ closing, onClose, onDownloaded, onGone }) {
  const panelRef = useRef(null)
  const linksRef = useRef([])
  const rowsRef = useRef([])
  const extRef = useRef(null)
  const [active, setActive] = useState(0)
  const [picked, setPicked] = useState(null)
  const [src, setSrc] = useState(null)
  const format = CV_FORMATS[active]
  // The callbacks are made anew on every render of the button's owner (the
  // contact section re-renders with its clock), so effects read them from here.
  const calls = useRef({ onClose, onDownloaded, onGone })
  useEffect(() => {
    calls.current = { onClose, onDownloaded, onGone }
  })

  // While open, the window holds the keys, the focus and the page's scroll.
  // It lets them go as soon as it starts closing, not once it has faded.
  useEffect(() => {
    if (closing) return undefined
    const prevFocus = document.activeElement
    linksRef.current[0]?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') calls.current.onClose()
      const links = linksRef.current
      const at = links.indexOf(document.activeElement)
      const move = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: links.length - 1 }[e.key]
      if (move !== undefined && at !== -1) {
        e.preventDefault()
        links[(move + links.length) % links.length].focus()
      }
      if (e.key === 'Tab') {
        const items = panelRef.current?.querySelectorAll('button, a[href]')
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        const inside = panelRef.current.contains(document.activeElement)
        if (!inside) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const lenis = window.__appLenis
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      lenis?.start()
      document.body.style.overflow = ''
      prevFocus?.focus?.()
    }
  }, [closing])

  // Closing plays the opening backwards (CvFormatDialog.css), then the window
  // goes. With reduced motion there is nothing to wait for; the timer covers an
  // animation that never ends (a stylesheet that didn't load).
  useEffect(() => {
    if (!closing) return undefined
    if (reduced()) {
      calls.current.onGone()
      return undefined
    }
    const t = setTimeout(() => calls.current.onGone(), 1000)
    return () => clearTimeout(t)
  }, [closing])

  useEffect(() => {
    let live = true
    loadSources().then(
      (texts) => live && setSrc(texts),
      () => live && setSrc(false)
    )
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (!src) return undefined
    return print(rowsRef.current, BUILD[PREVIEW[format.id]](src), COLS)
  }, [src, format.id])

  useEffect(() => print([extRef.current], { lines: [format.id], tones: [] }, 4), [format.id])

  useEffect(() => {
    if (!picked) return undefined
    const t = setTimeout(() => {
      calls.current.onDownloaded?.()
      calls.current.onClose()
    }, LINGER)
    return () => clearTimeout(t)
  }, [picked])

  // Each format is a file cvgen built ahead of time, so the links work as
  // plain links (open in a tab, copy the address). A click starts the download
  // from a detached link instead, because closing the dialog removes this one
  // before the browser would follow it.
  function handlePick(e, f, i) {
    e.preventDefault()
    if (picked) return
    downloadCv(f)
    setActive(i)
    setPicked(f.id)
  }

  const point = (i) => !picked && setActive(i)

  return (
    <div
      className="cv-dialog-overlay"
      data-closing={closing || undefined}
      inert={closing}
      onMouseDown={(e) => {
        if (panelRef.current?.contains(e.target)) return
        // Focus goes back to the button that opened the window, as it does
        // for Escape, rather than to the fading backdrop that was clicked.
        e.preventDefault()
        onClose()
      }}
      onAnimationEnd={(e) => {
        if (closing && e.target === e.currentTarget && e.animationName === 'cv-fade-out') onGone()
      }}
    >
      <div className="cv-dialog" role="dialog" aria-modal="true" aria-labelledby="cv-dialog-title" ref={panelRef}>
        <div className="cv-dialog__chrome">
          <button type="button" className="cv-dialog__close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2.8 2.8l4.4 4.4M7.2 2.8L2.8 7.2" />
            </svg>
          </button>
          <span className="cv-dialog__path" aria-hidden="true">
            ~/cv/<b>{CV_BASENAME}</b>.<span ref={extRef} />
          </span>
        </div>

        <div className="cv-dialog__body">
          <div className="cv-dialog__pick">
            <h2 id="cv-dialog-title" className="cv-dialog__title">
              Download CV
            </h2>
            <p className="cv-dialog__lead">Pick one and it downloads straight away.</p>
            <ul className="cv-list" style={{ '--i': active }}>
              {CV_FORMATS.map((f, i) => (
                <li key={f.id}>
                  <a
                    ref={(el) => (linksRef.current[i] = el)}
                    className="cv-row"
                    href={f.href}
                    download={f.file}
                    data-active={i === active || undefined}
                    onClick={(e) => handlePick(e, f, i)}
                    onPointerEnter={() => point(i)}
                    onFocus={() => point(i)}
                  >
                    <span className="cv-row__ext">{f.label}</span>
                    <span className="cv-row__hint">{picked === f.id ? 'Download started' : f.hint}</span>
                    <span className="cv-row__go" aria-hidden="true">
                      {picked === f.id ? <Icon name="check" /> : '↓'}
                    </span>
                  </a>
                </li>
              ))}
              <li className="cv-list__bar" aria-hidden="true" />
            </ul>
            <p className="cv-dialog__keys" aria-hidden="true">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> choose
              </span>
              <span>
                <kbd>↵</kbd> download
              </span>
              <span>
                <kbd>esc</kbd> close
              </span>
            </p>
            <p className="sr-only" aria-live="polite">
              {picked && `Downloading ${CV_BASENAME}.${picked}`}
            </p>
          </div>

          <div className="cv-dialog__view" data-state={src === false ? 'failed' : undefined} aria-hidden="true">
            <div className="cv-sheet" data-kind={PREVIEW[format.id]}>
              <div className="cv-sheet__text">
                {Array.from({ length: ROWS }, (_, r) => (
                  <div key={r} ref={(el) => (rowsRef.current[r] = el)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Stays on screen after `open` turns false, long enough to close the way it
 * opened. Opened again while it is still closing, it starts over as a new
 * window rather than bringing the old one back.
 */
export default function CvFormatDialog({ open, onClose, onDownloaded }) {
  const [wasOpen, setWasOpen] = useState(open)
  const [shown, setShown] = useState(open)
  const [run, setRun] = useState(0)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setShown(true)
      setRun((n) => n + 1)
    }
  }
  if (!shown) return null
  return createPortal(
    <CvWindow
      key={run}
      closing={!open}
      onClose={onClose}
      onDownloaded={onDownloaded}
      onGone={() => setShown(false)}
    />,
    document.body
  )
}
