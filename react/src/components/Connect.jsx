import { useEffect, useRef, useState } from 'react'
import { siArchlinux } from 'simple-icons'
import Icon from './Icon.jsx'
import DownloadCvButton from './DownloadCvButton.jsx'
import { channels } from '../data/contacts.js'
import { SIGNAL_LOGO } from '../data/signalLogo.js'
import './Connect.css'

// The Arch mark without the trademark glyph that rides along in its path.
const ARCH = siArchlinux.path.slice(0, siArchlinux.path.indexOf('M', 1))
const [, , SW, SH] = SIGNAL_LOGO.viewBox

// What each channel speaks and the port it listens on, as `ss -tln` lists it.
const SOCKETS = {
  Email: { proto: 'smtp', port: 587 },
  Signal: { proto: 'signal', port: 443 },
  Telegram: { proto: 'mtproto', port: 443 },
  LinkedIn: { proto: 'https', port: 443 },
  GitHub: { proto: 'ssh', port: 22 },
}

// A stable ephemeral port per channel for "you", so the first frame renders
// the same on the server and in the browser.
const ephemeral = (i) => 49152 + ((i * 7919 + 1543) % 16383)

// The ladder, in the figure's own 400 × 300 units. Time runs down the page:
// each segment leaves one lifeline and lands lower on the other.
const W = 400
const H = 300
const CX = 64
const SX = 336
const LIFE_TOP = 64
const PIPE_Y = 272
const ARROWS = [
  { flag: 'SYN', note: 'Seq=0', x0: CX, y0: 88, x1: SX, y1: 132 },
  { flag: 'SYN, ACK', note: 'Seq=0 Ack=1', x0: SX, y0: 146, x1: CX, y1: 190 },
  { flag: 'ACK', note: 'Seq=1 Ack=1', x0: CX, y0: 204, x1: SX, y1: 248 },
].map((a, i) => {
  const dx = a.x1 - a.x0
  const dy = a.y1 - a.y0
  return { ...a, len: Math.hypot(dx, dy), angle: (Math.atan2(dy, dx) * 180) / Math.PI, delay: i * 0.62 }
})
// The handshake lasts ~1.9 s; the connection then stays up a while before
// the next channel gets its turn.
const CYCLE_MS = 5200

const pct = (v, of) => `${((v / of) * 100).toFixed(3)}%`

function ChannelMark({ channel }) {
  if (channel.logo === 'signal') {
    return (
      <svg className="sock__logo" viewBox={`0 0 ${SW} ${SH}`} aria-hidden="true" focusable="false">
        {SIGNAL_LOGO.paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    )
  }
  return <Icon name={channel.icon} />
}

/** Dushanbe's time, and how far that is from the visitor's own clock. */
function useDushanbeClock(live) {
  const [now, setNow] = useState(null)
  useEffect(() => {
    if (!live) return undefined
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dushanbe',
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
  return now
}

function aheadOf(offsetMinutes) {
  // Dushanbe is UTC+5 all year; getTimezoneOffset() is minutes *behind* UTC.
  const diff = 300 + offsetMinutes
  if (diff === 0) return 'same time as you'
  const h = Math.abs(diff) / 60
  const span = `${Number.isInteger(h) ? h : h.toFixed(1)} h`
  return diff > 0 ? `${span} ahead of you` : `${span} behind you`
}

/** The handshake for one channel, drawn as the classic TCP ladder. */
function Ladder({ channel, index }) {
  const sock = SOCKETS[channel.label]
  return (
    <figure className="hs" aria-hidden="true">
      <div className="hs__draw">
      <svg className="hs__svg" viewBox={`0 0 ${W} ${H}`} focusable="false">
        <path className="hs__life" d={`M${CX} ${LIFE_TOP}V${PIPE_Y + 18}M${SX} ${LIFE_TOP}V${PIPE_Y + 18}`} />
        {ARROWS.map((a) => (
          <g
            key={a.flag}
            className="hs__arrow"
            transform={`translate(${a.x0} ${a.y0}) rotate(${a.angle.toFixed(3)})`}
            style={{ '--d': `${a.delay}s`, '--len': `${a.len.toFixed(2)}px` }}
          >
            <path className="hs__line" d={`M0 0H${(a.len - 1).toFixed(2)}`} />
            <path className="hs__head" d={`M${a.len.toFixed(2)} 0l-8 -4v8z`} />
            <circle className="hs__dot" r="3.2" />
          </g>
        ))}
        <g className="hs__pipe">
          <path className="hs__pipe-line" d={`M${CX} ${PIPE_Y}H${SX}`} />
          <circle className="hs__bit hs__bit--out" cx={CX} cy={PIPE_Y} r="2.2" style={{ '--len': `${SX - CX}px` }} />
          <circle className="hs__bit hs__bit--in" cx={SX} cy={PIPE_Y} r="2.2" style={{ '--len': `${CX - SX}px` }} />
        </g>
      </svg>

      {/* Labels are HTML over the drawing, so they stay readable at any width. */}
      <div className="hs__end hs__end--you" style={{ left: pct(CX, W) }}>
        <span className="hs__chip">
          <b>you</b>
          <span>:{ephemeral(index)}</span>
          <i className="hs__ping" style={{ '--d': `${ARROWS[1].delay + 0.5}s` }} />
        </span>
      </div>
      <div className="hs__end hs__end--me" style={{ left: pct(SX, W) }}>
        <span className="hs__chip">
          <b>
            <svg className="hs__arch" viewBox="0 0 24 24" focusable="false">
              <path d={ARCH} />
            </svg>
            qwantum@sudo
          </b>
          <span>:{sock.port}</span>
          <i className="hs__ping" style={{ '--d': `${ARROWS[0].delay + 0.5}s` }} />
          <i className="hs__ping" style={{ '--d': `${ARROWS[2].delay + 0.5}s` }} />
        </span>
      </div>

      {ARROWS.map((a) => (
        <p
          key={a.flag}
          className="hs__label"
          style={{
            left: pct((a.x0 + a.x1) / 2, W),
            top: pct((a.y0 + a.y1) / 2, H),
            '--d': `${a.delay + 0.08}s`,
          }}
        >
          <b>{a.flag}</b> <span>{a.note}</span>
        </p>
      ))}

      <p className="hs__state" style={{ top: pct(PIPE_Y, H) }}>
        <i /> ESTABLISHED
      </p>
      </div>
      <figcaption className="hs__cap">
        <span>
          you:{ephemeral(index)} ⇄ qwantum@sudo:{sock.port}
        </span>
        <span>
          {sock.proto} · <b>{channel.handle}</b>
        </span>
      </figcaption>
    </figure>
  )
}

/**
 * Let's Connect: the ways to reach me, listed the way `ss -tln` lists
 * listening sockets, beside a TCP three-way handshake. Hover or focus a line
 * and the handshake runs for that channel (SYN, SYN-ACK, ACK, then
 * ESTABLISHED); left alone, it walks through them on its own while the
 * section is on screen. Every line is a plain link, so one click opens it.
 *
 * The first frame is the finished handshake for the first channel, so the
 * pre-rendered page and reduced motion both show a complete diagram.
 */
export default function Connect() {
  const rootRef = useRef(null)
  const copyTimer = useRef(0)
  const [active, setActive] = useState(0)
  const [run, setRun] = useState(false) // animated from the first time it is seen
  const [live, setLive] = useState(false) // on screen, tab visible
  const [held, setHeld] = useState(false) // someone is pointing at or tabbing through the list
  const [still, setStill] = useState(false)
  const [copied, setCopied] = useState(false)
  const [ahead, setAhead] = useState('')
  const now = useDushanbeClock(live)

  useEffect(() => {
    const el = rootRef.current
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    setStill(reduced)
    setAhead(aheadOf(new Date().getTimezoneOffset()))
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    let seen = false
    const update = () => setLive(seen && !document.hidden)
    const io = new IntersectionObserver(
      ([e]) => {
        seen = e.isIntersecting
        if (seen && !reduced) setRun(true)
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
    }
  }, [])

  // Left alone, the handshake moves on to the next channel.
  useEffect(() => {
    if (!run || !live || held || still) return undefined
    const id = setTimeout(() => setActive((a) => (a + 1) % channels.length), CYCLE_MS)
    return () => clearTimeout(id)
  }, [run, live, held, still, active])

  const copyEmail = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Older browsers and insecure contexts: copy through a selection.
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.cssText = 'position:fixed;opacity:0'
      document.body.append(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(true)
    clearTimeout(copyTimer.current)
    copyTimer.current = setTimeout(() => setCopied(false), 1800)
  }

  const channel = channels[active]

  return (
    <div className="connect" ref={rootRef} data-run={run ? '' : undefined}>
      <div className="connect__bar">
        <p className="connect__prompt" aria-hidden="true">
          <span>qwantum@sudo</span>:~$ ss -tln
        </p>
        <p className="connect__clock">
          <span className="connect__city">Dushanbe</span>{' '}
          <time className="connect__time">{now ?? '--:--:--'}</time>{' '}
          <span className="connect__tz">UTC+5{ahead && ` · ${ahead}`}</span>
        </p>
      </div>

      <div className="connect__body">
        <div className="connect__table">
          <p className="connect__head" aria-hidden="true">
            <span>State</span>
            <span>Port</span>
            <span>Service</span>
            <span>Handle</span>
          </p>
          <ul
            className="connect__socks"
            aria-label="Ways to reach me"
            onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setHeld(false)}
            onFocus={() => setHeld(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false)
            }}
          >
            {channels.map((c, i) => {
              const sock = SOCKETS[c.label]
              const on = i === active
              return (
                <li
                  key={c.label}
                  className={`sock${c.label === 'Email' ? ' sock--copy' : ''}`}
                  data-on={on ? '' : undefined}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                >
                  <a
                    className="sock__link cursor-target"
                    href={c.href}
                    {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    onFocus={() => setActive(i)}
                  >
                    <span className="sock__state" aria-hidden="true">
                      <i />
                      <span className="sock__listen">LISTEN</span>
                      <span className="sock__recv">SYN-RECV</span>
                      <span className="sock__estab">ESTAB</span>
                    </span>
                    <span className="sock__port" aria-hidden="true">
                      *:{sock.port}
                    </span>
                    <span className="sock__service">
                      <span className="sock__mark" aria-hidden="true">
                        <ChannelMark channel={c} />
                      </span>
                      {c.label}
                    </span>
                    <span className="sock__handle">{c.handle}</span>
                    <span className="sock__go" aria-hidden="true">
                      ↗
                    </span>
                    {c.external && <span className="sr-only"> (opens in a new tab)</span>}
                  </a>
                  {c.label === 'Email' && (
                    <button
                      type="button"
                      className="sock__copy cursor-target"
                      onClick={() => copyEmail(c.handle)}
                      onFocus={() => setActive(i)}
                      aria-label={copied ? 'Email address copied' : 'Copy email address'}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="sr-only" aria-live="polite">
            {copied ? 'Email address copied to the clipboard.' : ''}
          </p>
        </div>

        <Ladder key={active} channel={channel} index={active} />
      </div>

      <div className="connect__foot">
        <p>Each line opens its channel straight away.</p>
        <DownloadCvButton className="download-cv-btn--connect" />
      </div>
    </div>
  )
}
