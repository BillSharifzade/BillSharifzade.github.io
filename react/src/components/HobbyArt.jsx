import { useEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import './HobbyArt.css'

// The animated figures on the "Beyond the Code" cards. Everything here moves
// by transform or opacity on the compositor, and pauses with its section when
// it scrolls away (usePauseOffscreen). The galaxy is the one piece of script:
// a canvas painted once, which CSS then turns.

// ---- Cosmos: a barred spiral painted from ~13k stars -----------------------

// A small seeded generator, so the galaxy is the same on every visit.
function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function paintGalaxy(ctx, size) {
  const rand = seeded(1915)
  const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand())
  const c = size / 2
  const R = size * 0.47
  const r0 = R * 0.07
  const unit = size / 400
  const TWIST = 2.7 // radians per e-fold of radius: how tightly the arms wind

  const armAngle = (arm, rad) => arm * Math.PI + TWIST * Math.log(rad / r0)
  const dot = (x, y, s, a) => {
    ctx.globalAlpha = a
    ctx.fillRect(x - s / 2, y - s / 2, s, s)
  }

  ctx.clearRect(0, 0, size, size)

  // The disc's diffuse light.
  let glow = ctx.createRadialGradient(c, c, 0, c, c, R)
  glow.addColorStop(0, 'rgba(255,255,255,0.20)')
  glow.addColorStop(0.3, 'rgba(255,255,255,0.06)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = '#ffffff'

  // Two arms on a logarithmic spiral, denser and brighter toward the middle.
  for (let i = 0; i < 7200; i++) {
    const t = rand() ** 0.75
    const rad = r0 + (R - r0) * t
    const theta = armAngle(i % 2, rad) + gauss() * (0.24 + 0.16 * t)
    const spread = rad + gauss() * R * 0.022 * (1 + t)
    dot(c + spread * Math.cos(theta), c + spread * Math.sin(theta), unit * (0.55 + rand() * 0.9), (0.1 + 0.5 * (1 - t)) * (0.35 + 0.65 * rand()))
  }
  // Old stars between the arms.
  for (let i = 0; i < 2600; i++) {
    const rad = R * rand() ** 0.8
    const theta = rand() * Math.PI * 2
    dot(c + rad * Math.cos(theta), c + rad * Math.sin(theta), unit * (0.5 + rand() * 0.6), (0.04 + 0.16 * (1 - rad / R)) * rand())
  }
  // The bulge.
  for (let i = 0; i < 2800; i++) {
    const rad = Math.abs(gauss()) * R * 0.1
    const theta = rand() * Math.PI * 2
    dot(c + rad * Math.cos(theta), c + rad * Math.sin(theta) * 0.85, unit * (0.6 + rand() * 0.8), 0.12 + 0.3 * rand())
  }
  // Bright young clusters strung along the arms.
  for (let i = 0; i < 80; i++) {
    const rad = r0 + (R - r0) * (0.2 + 0.7 * rand())
    const theta = armAngle(i % 2, rad) + gauss() * 0.1
    dot(c + rad * Math.cos(theta), c + rad * Math.sin(theta), unit * (1.3 + rand() * 1.5), 0.55 + 0.4 * rand())
  }
  // Dust lanes on the arms' inner edges, carved out of the light.
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 3000; i++) {
    const rad = r0 + (R - r0) * (0.1 + 0.75 * rand())
    const theta = armAngle(i % 2, rad) - 0.26 + gauss() * 0.06
    dot(c + rad * Math.cos(theta), c + rad * Math.sin(theta), unit * (1.2 + rand() * 2), 0.09)
  }
  // The core.
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = 1
  glow = ctx.createRadialGradient(c, c, 0, c, c, R * 0.17)
  glow.addColorStop(0, 'rgba(255,255,255,0.95)')
  glow.addColorStop(0.22, 'rgba(255,255,255,0.55)')
  glow.addColorStop(0.6, 'rgba(255,255,255,0.12)')
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.fillRect(c - R * 0.17, c - R * 0.17, R * 0.34, R * 0.34)
  ctx.globalCompositeOperation = 'source-over'
}

function Galaxy() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    let painted = 0
    const paint = () => {
      const css = canvas.clientWidth
      // Repaint only for a real change of size, not every pixel of a resize.
      if (!css || Math.abs(css - painted) < css * 0.15) return
      painted = css
      const size = Math.round(css * Math.min(window.devicePixelRatio || 1, 2))
      canvas.width = size
      canvas.height = size
      paintGalaxy(canvas.getContext('2d'), size)
    }
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 200))
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout
    const task = idle(paint, { timeout: 1500 })
    const resize = new ResizeObserver(() => paint())
    resize.observe(canvas)
    return () => {
      cancelIdle(task)
      resize.disconnect()
    }
  }, [])
  return <canvas ref={ref} className="cosmos-galaxy" />
}

// Fixed background stars: [x %, y %, size px, twinkle delay s].
const STARS = [
  [8, 18, 2, 0], [17, 72, 1.5, 1.4], [26, 34, 1, 2.2], [36, 84, 1.5, 0.6], [44, 12, 1, 3.1],
  [57, 88, 1, 1.8], [66, 22, 2, 2.7], [74, 70, 1, 0.3], [83, 40, 1.5, 3.6], [91, 14, 1, 1.1],
  [94, 78, 2, 2.4], [5, 52, 1, 3.3], [50, 6, 1.5, 0.9], [31, 58, 1, 2.9],
]

export function CosmosArt() {
  return (
    <div className="hobby-bg hobby-bg--cosmos" aria-hidden="true">
      {STARS.map(([x, y, s, d]) => (
        <i key={`${x}-${y}`} className="cosmos-star" style={{ left: `${x}%`, top: `${y}%`, '--s': `${s}px`, '--d': `${d}s` }} />
      ))}
      <span className="cosmos-meteor" />
      <div className="cosmos-disc">
        <Galaxy />
      </div>
      <span className="cosmos-core" />
      <p className="cosmos-formula">
        R<sub>μν</sub> − ½Rg<sub>μν</sub> + Λg<sub>μν</sub> = <span>8πG⁄c⁴</span>T<sub>μν</sub>
      </p>
    </div>
  )
}

// ---- Strategy: a knight's circuit on a board in perspective -----------------

// Counter-Strike's crosshair: four strokes around a gap, and a dot.
function Crosshair() {
  return (
    <svg className="chess-crosshair" viewBox="0 0 40 40">
      <path d="M20 4v10M20 26v10M4 20h10M26 20h10" />
      <circle cx="20" cy="20" r="1.6" />
    </svg>
  )
}

export function StrategyArt() {
  return (
    <div className="hobby-bg hobby-bg--strategy" aria-hidden="true">
      <div className="chess">
        <div className="chess-board">
          <span className="chess-surface" />
          <span className="chess-target">
            <span className="chess-lock">
              <Crosshair />
            </span>
          </span>
          <span className="chess-knight">
            <span className="chess-ring" />
            <span className="chess-shadow" />
            <span className="chess-hop">
              <span className="chess-piece">
                <Icon name="chess-knight" />
              </span>
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ---- Craft & Sound: a strum, and a scarf growing row by row -----------------

export function CraftArt() {
  return (
    <div className="hobby-bg hobby-bg--craft" aria-hidden="true">
      <div className="guitar">
        <span className="guitar-hole" />
        {[0, 1, 2, 3, 4, 5].map((s) => (
          <span key={s} className="guitar-string" style={{ '--s': s }}>
            <i />
          </span>
        ))}
        <span className="guitar-note" style={{ '--n': 0 }}>♪</span>
        <span className="guitar-note" style={{ '--n': 1 }}>♫</span>
        <span className="guitar-note" style={{ '--n': 2 }}>♩</span>
      </div>
      <div className="knit">
        <svg className="knit-yarn" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M62 8 C 96 30, 98 66, 74 88" />
        </svg>
        <span className="knit-ball" />
        <span className="knit-scarf">
          <span className="knit-fabric" />
        </span>
        <span className="knit-needle knit-needle--l" />
        <span className="knit-needle knit-needle--r" />
      </div>
    </div>
  )
}

// ---- Words & Thought: a book turning its pages, a line typing itself --------

const QUOTE = 'Love can save the universe'

export function WordsArt() {
  return (
    <div className="hobby-bg hobby-bg--words" aria-hidden="true">
      <p className="words-quote" style={{ '--chars': QUOTE.length }}>
        <span>{QUOTE}</span>
      </p>
      <div className="words-scene">
        <div className="book3d">
          <span className="book3d-page book3d-page--l" />
          <span className="book3d-page book3d-page--r" />
          {[0, 1, 2].map((k) => (
            <span key={k} className="book3d-leaf" style={{ '--k': k }}>
              <i className="book3d-face book3d-face--front" />
              <i className="book3d-face book3d-face--back" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
