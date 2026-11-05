import { createRef, memo, useEffect, useRef, useState } from 'react'
import BlurHighlight from '../BlurHighlight.jsx'
import ArchMark from './ArchMark.jsx'
import TypingSubtitle from './TypingSubtitle.jsx'
import eye from '../../assets/hero/eye.webp'
import eye360 from '../../assets/hero/eye-360.webp'
import { experience } from '../../data/cv.js'
import { liveSites } from '../../data/liveSites.js'
import { wipProjects } from '../../data/wip.js'
import { signalLinuxDown, signalLinuxUp } from '../../utils/linuxUp.js'
import { usePauseHidden } from '../../utils/usePauseOffscreen.js'
import { Bolt, CpuFront, CpuLegs } from './HeroCpu.jsx'
import './Hero.css'

const SEEN_KEY = 'hero-booted'

// ---- The board: parts of systems I built, each with a number measured on
// its project (data/cv.js, data/projectImpact.js, the repos' load tests).
// `p99` is how long a signal stays inside, slowed down SLOW times; parts
// without a measured latency are crossed in PASS ms.
const NODES = [
  {
    id: 'api',
    name: 'apiweave',
    value: 'REST',
    sub: '6 protocols · 1 fn',
    p99: 0,
    source: 'Multi-Protocol API Framework',
    detail: 'one #[operation] handler served as REST, GraphQL, JSON-RPC, SOAP, WebSocket and SSE; 239 developers use it.',
  },
  {
    id: 'axum',
    name: 'axum',
    host: true,
    value: '47k rps',
    sub: 'p99 3 ms',
    p99: 3,
    source: 'TEK Electrical Marketplace',
    detail: 'product pages at ~47,000 requests a second, p99 3 ms (release build on Arch, 64 connections).',
  },
  {
    id: 'cache',
    name: 'moka',
    value: '30k rps',
    sub: 'p99 14 ms',
    p99: 14,
    source: 'TEK Electrical Marketplace',
    detail: 'catalogue listings through a moka response cache: ~30,000 requests a second, p99 14 ms.',
  },
  {
    id: 'ledger',
    name: 'ledger',
    value: '3.2k tx/s',
    sub: 'p99 95 ms',
    p99: 95,
    source: 'Payment System',
    detail: 'a double-entry Postgres ledger: ~3,200 transfers a second at p99 95 ms, with 0 errors under load.',
  },
  {
    id: 'stream',
    name: 'jetstream',
    value: 'listening',
    sub: 'via outbox',
    p99: 0,
    source: 'Payment System',
    detail: 'ledger events leave through a transactional outbox, relayed to NATS JetStream. The sequence counts the transfers on this page.',
  },
]
const BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]))
const ALL = NODES.map((n) => n.id)

const EDGES = [
  ['origin', 'api'],
  ['api', 'axum'],
  ['axum', 'cache'],
  ['axum', 'ledger'],
  ['ledger', 'stream'],
]

// Real endpoints of the two projects the numbers come from.
const JOURNEYS = {
  list: { label: 'GET /catalog/products', result: 'from cache', path: ['origin', 'api', 'axum', 'cache'] },
  item: { label: 'GET /catalog/products/{slug}', result: '200 OK', path: ['origin', 'api', 'axum'] },
  write: { label: 'POST /v1/transfers', result: 'posted, event out', path: ['origin', 'api', 'axum', 'ledger', 'stream'] },
}
// One loop of traffic: which journey, and how long after the previous packet it leaves.
const PLAN = [
  ['list', 0],
  ['write', 1300],
  ['item', 2700],
  ['list', 1000],
]

const SLOW = 8
const PASS = 60
const SPEED = 0.26 // px per ms
const CUT = 11 // the 45° chamfer at a trace's corners
// A signal is a short train of bits running along the copper, with a soft
// bloom under it: dash lengths in px, mark and space alternating.
const BITS = [9, 3, 3, 3, 6, 3, 2, 3, 5, 3, 3]
const BURST = BITS.reduce((a, b) => a + b)
const BLOOM = BURST + 16
// How long after the page loops round before traffic starts each cycle.
const DELAY = 300

// The parts with live readouts: they count up when powered, then refresh the
// way a dashboard does, a little under or around the measured figure.
const METERS = {
  axum: { rate: 47000, unit: 'rps', p99: 3 },
  cache: { rate: 30000, unit: 'rps', p99: 14 },
  ledger: { rate: 3200, unit: 'tx/s', p99: 95 },
}
const PROTOCOLS = ['REST', 'GraphQL', 'JSON-RPC', 'SOAP', 'WebSocket', 'SSE']
const fmtRate = (v, unit) => (unit === 'rps' ? `${(v / 1000).toFixed(1)}k rps` : `${Math.round(v).toLocaleString('en-US')} tx/s`)
const fmtP99 = (v) => `p99 ${v < 10 ? v.toFixed(1) : Math.round(v)} ms`

// The opening, in ms: the strike after mount, the boot after the strike, and
// the print once Linux is up.
const STRIKE_AT = 420
const BOOT_AFTER = 1000
const PRINT_AFTER = 900

// ---- The console: the services the boot brings up. `lights` are the parts
// of the board that power on when the line prints.
const SERVICES = [
  ['Mounted', '/skills', 'Rust, Linux, Go, Python, C, Zig', []],
  ['Started', 'apiweave.service', '239 developers, 6 protocols', ['api']],
  ['Started', 'tek.service', '1,000+ electricians, ~47k rps', ['axum', 'cache']],
  ['Started', 'payment-system.service', 'alpha, ~3,200 tx/s', ['ledger', 'stream']],
  ['Started', 'competency-matrix.service', '25+ companies', []],
  ['Started', 'screenx.service', '10+ companies, AI-written tests', []],
  ['Started', 'smart-city.service', '50–70× faster', []],
  ['Listening on', 'live-sites.socket', `${liveSites.length}+ sites in production`, []],
  ['Reached target', 'multi-user.target', '', []],
]

// Work in progress, from the Projects in Progress terminal (the love project
// is not a build).
const building = wipProjects.filter((p) => !p.special).length

// Experience starts with the earliest "Month YYYY" in cv.js.
const MONTHS = 'January February March April May June July August September October November December'.split(' ')
const firstJob = experience
  .map((e) => /^(\w+) (\d{4})/.exec(e.date))
  .filter((m) => m && MONTHS.includes(m[1]))
  .map((m) => ({ y: +m[2], m: MONTHS.indexOf(m[1]) }))
  .reduce((a, b) => (b.y * 12 + b.m < a.y * 12 + a.m ? b : a))

function uptime(now) {
  const months = (now.getFullYear() - firstJob.y) * 12 + now.getMonth() - firstJob.m
  const y = Math.floor(months / 12)
  const m = months % 12
  return [y && `${y} year${y > 1 ? 's' : ''}`, m && `${m} month${m > 1 ? 's' : ''}`].filter(Boolean).join(', ')
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const sign = Math.sign

// ---- Wiring ---------------------------------------------------------------

// An orthogonal route between two boxes, from the toe of the middle leg of one
// side to the toe of the middle leg of another: out of A's right side into
// B's left when B lies to the right, otherwise out of A's bottom into B's top.
// When a part sits in the way of a straight drop, the trace skirts round its
// right.
function route(a, b, others) {
  if (b.l >= a.r - 1) {
    const [x0, y0, x1, y1] = [a.r, a.cy, b.l, b.cy]
    if (Math.abs(y0 - y1) < 1.5) return [[x0, y0], [x1, y0]]
    const xm = a.point ? Math.max(x0 + 14, x1 - 30) : (x0 + x1) / 2
    return [[x0, y0], [xm, y0], [xm, y1], [x1, y1]]
  }
  const [x0, y0, x1, y1] = [a.cx, a.b, b.cx, b.t]
  const between = others.filter((o) => o.t >= y0 - 1 && o.b <= y1 + 1 && o.l < Math.max(x0, x1) && o.r > Math.min(x0, x1))
  if (between.length) {
    const x = Math.max(a.r, b.r, ...between.map((o) => o.r)) + 18
    return [[a.r, a.cy], [x, a.cy], [x, b.cy], [b.r, b.cy]]
  }
  if (Math.abs(x0 - x1) < 1.5) return [[x0, y0], [x0, y1]]
  const ym = a.point ? Math.max(y0 + 14, y1 - 26) : (y0 + y1) / 2
  return [[x0, y0], [x0, ym], [x1, ym], [x1, y1]]
}

// The route as a circuit-board trace, corners cut at 45°, both as an SVG path
// and as the points a packet follows.
function chamfer(pts) {
  const r = (n) => +n.toFixed(1)
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`
  const out = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const [[px, py], [x, y], [nx, ny]] = [pts[i - 1], pts[i], pts[i + 1]]
    const k = Math.min(CUT, Math.hypot(x - px, y - py) / 2, Math.hypot(nx - x, ny - y) / 2)
    const a = [x - sign(x - px) * k, y - sign(y - py) * k]
    const b = [x + sign(nx - x) * k, y + sign(ny - y) * k]
    d += ` L${r(a[0])} ${r(a[1])} L${r(b[0])} ${r(b[1])}`
    out.push(a, b)
  }
  const [lx, ly] = pts[pts.length - 1]
  out.push([lx, ly])
  return { d: `${d} L${r(lx)} ${r(ly)}`, pts: out }
}

// The line a signal follows through a journey: each trace in turn, joined by
// straight runs hidden under the parts it passes through, and a burst's
// length on into the last one. `parts` holds, for each part, the distance at
// which the signal's head reaches it and where its run inside ends.
function journey(path, edges) {
  const pts = []
  const parts = []
  let s = 0
  const push = ([x, y]) => {
    const last = pts[pts.length - 1]
    if (last) s += Math.hypot(x - last[0], y - last[1])
    pts.push([x, y])
  }
  for (let i = 0; i < path.length - 1; i++) {
    const e = edges.get(`${path[i]}>${path[i + 1]}`)
    if (i > 0) {
      const at = s
      push(e[0])
      parts.push([path[i], at, s])
    } else push(e[0])
    e.slice(1).forEach(push)
  }
  const [[ax, ay], [bx, by]] = pts.slice(-2)
  const len = Math.hypot(bx - ax, by - ay) || 1
  const at = s
  push([bx + ((bx - ax) / len) * BURST * 1.2, by + ((by - ay) / len) * BURST * 1.2])
  parts.push([path[path.length - 1], at, s])
  const r = (n) => n.toFixed(1)
  return { d: `M${pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L')}`, length: s, parts }
}

// On/off keyframes for an element that should be lit during each interval.
function pulses(intervals, period, fade) {
  const kf = [{ offset: 0, opacity: 0 }]
  let at = 0
  intervals
    .sort((x, y) => x[0] - y[0])
    .forEach(([on, off]) => {
      const a = Math.max(at, on / period)
      const b = Math.max(a, Math.min(1, off / period))
      const c = Math.max(b, Math.min(1, (off + fade) / period))
      kf.push({ offset: a, opacity: 0 }, { offset: a, opacity: 1 }, { offset: b, opacity: 1 }, { offset: c, opacity: 0 })
      at = c
    })
  kf.push({ offset: 1, opacity: 0 })
  return kf
}

// ---- The print ------------------------------------------------------------

// The photo is printed onto the chip the way a die's own pattern is: a
// stepper walks its reticle over the chip field by field, back and forth along
// the rows, and exposes each field with a flash of light. It starts carefully
// and speeds up, each step a little quicker than the last, down to STEP_MIN
// ms. Stripping the print runs the same walk backwards, with the light off.
const FIELDS = 6
const LEAD = 140
const STEP_FIRST = 74
const STEP_MIN = 22
const STEP_STRIP = 11
const GLOW = 460

// The i-th field of the walk, as [row, column].
function field(i) {
  const r = Math.floor(i / FIELDS)
  const c = i % FIELDS
  return [r, r % 2 ? FIELDS - 1 - c : c]
}

// What is printed once field i is done, as a clip path: the rows finished so
// far and the run along the current one (six corners, whatever the shape).
function printed(i) {
  const p = ([x, y]) => `${+x.toFixed(3)}% ${+y.toFixed(3)}%`
  if (i < 0) return `polygon(${Array(6).fill('0 0').join(', ')})`
  const f = 100 / FIELDS
  const [r, c] = field(i)
  const [top, bottom] = [r * f, (r + 1) * f]
  const corners =
    r % 2
      ? [[0, 0], [100, 0], [100, bottom], [c * f, bottom], [c * f, top], [0, top]]
      : [[0, 0], [100, 0], [100, top], [(c + 1) * f, top], [(c + 1) * f, bottom], [0, bottom]]
  return `polygon(${corners.map(p).join(', ')})`
}

/**
 * Prints the photo onto the chip, or with `strip` takes it off again. Returns
 * the animations and how long until the last of them is over.
 */
function print({ photo, litho, strip }) {
  const n = FIELDS * FIELDS
  const order = [...Array(n).keys()]
  if (strip) order.reverse()
  let t = strip ? 0 : LEAD
  const at = order.map((_, k) => {
    const now = t
    t += strip ? STEP_STRIP : Math.max(STEP_MIN, STEP_FIRST - k * 4)
    return now
  })
  const end = t
  const hold = { easing: 'steps(1, end)' }
  const clip = [{ offset: 0, clipPath: printed(strip ? n - 1 : -1), ...hold }]
  order.forEach((i, k) => clip.push({ offset: at[k] / end, clipPath: printed(strip ? i - 1 : i), ...hold }))
  clip.push({ offset: 1, clipPath: printed(strip ? -1 : n - 1) })
  const anims = [photo.animate(clip, { duration: end, fill: 'both' })]
  if (strip) return { anims, end }

  // Each exposure: the field flashes white and fades to the fresh print.
  const fields = litho.querySelectorAll('.hx-litho__field')
  order.forEach((i, k) => {
    const [r, c] = field(i)
    const flash = [{ opacity: 0.9 }, { opacity: 0.32, offset: 0.3 }, { opacity: 0 }]
    anims.push(fields[r * FIELDS + c].animate(flash, { duration: GLOW, delay: at[k], easing: 'ease-out' }))
  })
  // The reticle jumps to each field just before it is exposed.
  const reticle = litho.querySelector('.hx-litho__reticle')
  const span = end + 160
  const place = (i) => {
    const [r, c] = field(i)
    return `translate(${c * 100}%, ${r * 100}%)`
  }
  const moves = [{ offset: 0, transform: place(order[0]), ...hold }]
  order.forEach((i, k) => moves.push({ offset: Math.max(0, at[k] - 12) / span, transform: place(i), ...hold }))
  moves.push({ offset: 1, transform: place(order[n - 1]) })
  anims.push(
    reticle.animate(moves, { duration: span, fill: 'both' }),
    reticle.animate([{ opacity: 0 }, { opacity: 1, offset: LEAD / span }, { opacity: 1, offset: end / span }, { opacity: 0 }], {
      duration: span,
    }),
  )
  return { anims, end: end + GLOW }
}

// ---- Boot -----------------------------------------------------------------

// dmesg prints seconds since boot as [%5lu.%06lu].
const stamp = (ms) => `[${(ms / 1000).toFixed(6).padStart(12)}]`
const kB = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

// What this page's own load measured, read when each line prints. Lines whose
// numbers the browser does not expose are left out rather than guessed.
function kernelLines(img, tookOver) {
  const nav = performance.getEntriesByType?.('navigation')?.[0]
  const res = (re) => performance.getEntriesByType?.('resource')?.find((e) => re.test(e.name))
  const cpus = navigator.hardwareConcurrency
  return [
    () => 'lirust: pure-Rust kernel by Sharifzoda Bilol, #1 SMP PREEMPT',
    () => cpus && `smp: Brought up 1 node, ${cpus} CPU${cpus > 1 ? 's' : ''}`,
    () => `fb0: ${screen.width}×${screen.height} framebuffer, ${+devicePixelRatio.toFixed(2)}× scale`,
    () => nav && nav.responseStart > 0 && `net: index.html first byte at ${Math.round(nav.responseStart)} ms${nav.encodedBodySize ? `, ${kB(nav.encodedBodySize)}` : ''}`,
    () => {
      const e = img && performance.getEntriesByName?.(img.currentSrc)?.[0]
      // naturalWidth is scaled by the srcset density, so name the file's own size.
      const px = img?.currentSrc.endsWith(eye360) ? 360 : 640
      if (!img?.complete || !img.naturalWidth) return `eye0: ${px}×${px} webp, still streaming`
      return `eye0: ${px}×${px} webp${e?.encodedBodySize ? `, ${kB(e.encodedBodySize)}` : ''}, decoded`
    },
    () => {
      const f = res(/jetbrains-mono-latin-(?!ext)[^/]*\.woff2/)
      return f ? `fonts: JetBrains Mono in at ${Math.round(f.responseEnd)} ms` : 'fonts: JetBrains Mono ready'
    },
    () => `react: took over the pre-rendered #root at ${Math.round(tookOver)} ms`,
  ]
}

function kernelNode(text, at) {
  const p = el('p', 'hx-line')
  p.append(el('span', 'hx-ts', stamp(at)), ` ${text}`)
  return p
}

function serviceNode([verb, unit, note]) {
  const p = el('p', 'hx-line')
  const st = el('span', 'hx-st', '[')
  st.append(el('b', null, '  OK  '), ']')
  p.append(st, ` ${verb} `, el('b', 'hx-unit', unit), note ? `: ${note}.` : '.')
  return p
}

/**
 * Prints the boot log into both screens at once (the console and its mirror
 * in the lens), a frame at a time, powering parts of the board as their
 * services start. Returns a function that stops it and clears what it printed.
 */
function boot({ root, screens, img, tookOver, origin, onService, onDone }) {
  const kernel = kernelLines(img, tookOver)
  // [time from start, what]: a burst of kernel lines, then services coming up
  // at a steadier pace, as a real boot reads.
  const plan = [
    ...kernel.map((line, i) => [60 + i * 46, line]),
    ...SERVICES.map((s, i) => [60 + kernel.length * 46 + 160 + i * 136, s]),
  ]
  const first = screens[0].scroll.current
  const ROWS = Math.round(first.parentElement.clientHeight / parseFloat(getComputedStyle(first).lineHeight)) || 7
  const printed = []
  let next = 0
  let rows = 1
  let raf = 0
  let hold = 0
  const start = performance.now()

  const print = ([, what]) => {
    let node
    if (typeof what === 'function') {
      const text = what()
      if (!text) return
      node = kernelNode(text, performance.now() - origin)
    } else {
      node = serviceNode(what)
      if (what[3].length) onService(what[3])
    }
    screens.forEach(({ log }, k) => {
      const copy = k ? node.cloneNode(true) : node
      log.current.append(copy)
      printed.push(copy)
    })
    rows++
  }

  // Nobody is watching: skip to the end instead of printing to an empty room.
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) finish()
  })

  const finish = () => {
    io.disconnect()
    cancelAnimationFrame(raf)
    clearTimeout(hold)
    root.dataset.boot = 'done'
    onDone()
  }

  const tick = (now) => {
    const t = now - start
    while (next < plan.length && plan[next][0] <= t) print(plan[next++])
    const shift = Math.max(0, rows + 1 - ROWS)
    screens.forEach(({ scroll }) => scroll.current.style.setProperty('--shift', shift))
    if (next < plan.length) raf = requestAnimationFrame(tick)
    else hold = setTimeout(finish, 420)
  }

  root.dataset.boot = 'run'
  raf = requestAnimationFrame(tick)
  io.observe(root)

  return () => {
    io.disconnect()
    cancelAnimationFrame(raf)
    clearTimeout(hold)
    printed.forEach((n) => n.remove())
    screens.forEach(({ scroll }) => scroll.current?.style.removeProperty('--shift'))
  }
}

// The overview: neofetch. It also hangs, mirrored, in the lens of the photo.
const Fetch = memo(function Fetch({ upFor }) {
  return (
    <div className="hx-fetch">
      <ArchMark className="hx-fetch__logo" />
      <dl className="hx-fetch__info">
        {[
          ['OS', 'Arch Linux'],
          ['Kernel', 'lirust, pure Rust (WIP)'],
          ['Uptime', upFor],
          ['Running', '70+ projects'],
          ['Load', `${building} builds in progress`],
          ['Users', '30+ companies'],
          ['Packages', 'apiweave · 239 developers'],
        ].map(([k, v], i) => (
          <div key={k} style={{ '--i': i }}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
})

// The console: the log while booting, then the overview, in the same box.
function Screen({ logRef, scrollRef, upFor }) {
  return (
    <div className="hx-screen">
      <div className="hx-scroll" ref={scrollRef} aria-hidden="true">
        <p className="hx-line">
          <span className="hx-ts">{stamp(0)}</span> lirust: waiting for power…
        </p>
        <div ref={logRef} />
        <p className="hx-line">
          <span className="hx-cursor" />
        </p>
      </div>
      <Fetch upFor={upFor} />
    </div>
  )
}

/**
 * The opening. A processor sits dark on the board, soldered down by its legs,
 * until lightning strikes it; the current runs out through its legs, it boots
 * Linux (a dmesg of this very page load), and each project's parts light up
 * across the board as its service starts. Once Linux is up the page's ASCII
 * backdrop rises in, and my eye is printed onto the chip field by field, the
 * overview reflected in my glasses. From then on, signals leave through three
 * of its legs and run the traces through those parts, staying in each for its
 * measured p99, and the parts' readouts stay live. Rebooting strips the print,
 * takes the backdrop down with Linux and plays it all again.
 *
 * The name, the pitch, the processor and the overview are in the pre-rendered
 * HTML; the script only animates what is there. The opening plays once per
 * session and not at all for reduced motion. Everything that moves is opacity
 * or transform, apart from the signals' dash offsets; all of it pauses off
 * screen and in hidden tabs.
 */
// What brings the boot console back: a reboot clears data-boot.
const BOOT_STATE = ['data-boot']

export default function Hero({ contentRef, onContact }) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const portRef = useRef(null)
  const wiresRef = useRef(null)
  const imgRef = useRef(null)
  const photoRef = useRef(null)
  const lensRef = useRef(null)
  const lithoRef = useRef(null)
  const pathRefs = useRef([])
  const bedRef = useRef(null)
  const sigRefs = useRef([])
  const nodeRefs = useRef({})
  const flashRefs = useRef({})
  const valueRefs = useRef({})
  const subRefs = useRef({})
  const liveRefs = useRef([])
  const rebootRef = useRef(null)
  const [screens] = useState(() => [{ log: createRef(), scroll: createRef() }])
  const [inspect, setInspect] = useState(null)
  const [upFor, setUpFor] = useState(`since ${MONTHS[firstJob.m]} ${firstJob.y}`)
  // The boot console hides once the photo is up; its cursor stops blinking then.
  usePauseHidden(rootRef, '.hx-scroll', BOOT_STATE)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const svg = wiresRef.current
    if (!root || !stage || !svg) return undefined
    const tookOver = performance.now()
    const still = reducedMotion()
    if (still) root.dataset.still = ''
    let anims = []
    let timers = []
    let counting = []
    let frame = 0
    let restart = 0
    let visible = true
    let flowing = false
    let edges = null
    let stopBoot = null
    let tick = 0
    let ticks = 0
    let period = 1
    let events = []
    let lastLocal = -1
    let seq = 0
    let proto = 0
    let printing = []

    setUpFor(uptime(new Date()))

    const later = (fn, ms) => timers.push(setTimeout(fn, ms))
    const clearLater = () => {
      timers.forEach(clearTimeout)
      timers = []
    }
    const box = (node, base) => {
      const r = node.getBoundingClientRect()
      const b = { l: r.left - base.left, t: r.top - base.top, r: r.right - base.left, b: r.bottom - base.top }
      return { ...b, cx: (b.l + b.r) / 2, cy: (b.t + b.b) / 2 }
    }
    const playing = () => visible && !document.hidden

    // ---- Readouts
    const isOn = (id) => id === 'origin' || nodeRefs.current[id]?.hasAttribute('data-on')
    const write = (refs, id, text) => {
      if (refs.current[id]) refs.current[id].textContent = text
    }
    const countUp = (id) => {
      const m = METERS[id]
      const t0 = performance.now()
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 900)
        const e = 1 - (1 - p) ** 3
        write(valueRefs, id, fmtRate(m.rate * e, m.unit))
        write(subRefs, id, fmtP99(m.p99 * (0.4 + 0.6 * e)))
        if (p < 1) counting.push(requestAnimationFrame(step))
      }
      counting.push(requestAnimationFrame(step))
    }
    const refresh = () => {
      Object.entries(METERS).forEach(([id, m]) => {
        if (!isOn(id)) return
        write(valueRefs, id, fmtRate(m.rate * (0.955 + 0.045 * Math.random()), m.unit))
        write(subRefs, id, fmtP99(m.p99 * (0.86 + 0.18 * Math.random())))
      })
    }
    // Did the loop's clock pass `t` between two readings (it wraps at `period`)?
    const passed = (prev, now, t) => (now >= prev ? prev < t && t <= now : t > prev || t <= now)
    const onTick = () => {
      ticks++
      if (ticks % 3 === 0) refresh()
      if (ticks % 5 === 0 && isOn('api')) write(valueRefs, 'api', PROTOCOLS[(proto = (proto + 1) % PROTOCOLS.length)])
      const a = anims[0]
      const t = a?.currentTime
      if (t == null || t < DELAY) return
      const local = (t - DELAY) % period
      if (lastLocal >= 0) events.forEach((e) => passed(lastLocal, local, e) && write(valueRefs, 'stream', `seq ${++seq}`))
      lastLocal = local
    }
    const meters = () => {
      const run = playing() && ALL.some(isOn) && !still
      if (run && !tick) tick = setInterval(onTick, 300)
      if (!run && tick) {
        clearInterval(tick)
        tick = 0
        lastLocal = -1
      }
    }
    const sync = () => {
      anims.forEach((a) => (playing() ? a.play() : a.pause()))
      meters()
    }

    // A part is powered when its node carries data-on; a trace lights once
    // both of its ends are powered (the processor always is).
    const power = (ids, on) => {
      ids.forEach((id) => {
        const node = nodeRefs.current[id]
        if (!node || node.hasAttribute('data-on') === on) return
        node.toggleAttribute('data-on', on)
        if (!on) return
        if (METERS[id] && !still) countUp(id)
        if (id === 'stream') write(valueRefs, 'stream', seq ? `seq ${seq}` : 'listening')
      })
      EDGES.forEach(([a, b], i) => pathRefs.current[i]?.toggleAttribute('data-on', isOn(a) && isOn(b)))
      bedRef.current?.toggleAttribute('data-on', isOn('api'))
      meters()
    }

    // ---- Traffic
    const animate = () => {
      anims.forEach((a) => a.cancel())
      anims = []
      if (!edges) return
      let start = 0
      const packets = PLAN.map(([j, gap], k) => {
        start += gap
        const run = journey(JOURNEYS[j].path, edges)
        // [time, distance of the signal's head]; it stops inside each part
        // for that part's p99.
        const kf = [[0, 0]]
        const lit = []
        let t = 0
        let at = 0
        run.parts.forEach(([id, sIn, sOut]) => {
          t += (sIn - at) / SPEED
          kf.push([t, sIn])
          const on = t
          t += (sOut - sIn) / SPEED
          kf.push([t, sOut])
          const part = BY_ID[id]
          t += part.p99 ? part.p99 * SLOW : PASS
          kf.push([t, sOut])
          lit.push([id, on, t + BURST / SPEED])
          at = sOut
        })
        return { j, k, start, run, kf, lit, end: t }
      })
      period = Math.max(...packets.map((p) => p.start + p.end)) + 1100
      const opts = { duration: period, iterations: Infinity, delay: DELAY }
      const off = (t) => Math.min(1, Math.max(0, t / period))

      packets.forEach((p) => {
        ;[
          [sigRefs.current[p.k * 2], BURST, `${BITS.join(' ')}`],
          [sigRefs.current[p.k * 2 + 1], BLOOM, `${BLOOM}`],
        ].forEach(([path, len, marks]) => {
          if (!path) return
          path.setAttribute('d', p.run.d)
          path.style.strokeDasharray = `${marks} ${(p.run.length + len + 40).toFixed(0)}`
          const px = (s) => `${(len - s).toFixed(1)}px`
          const kf = [{ offset: 0, strokeDashoffset: px(0), opacity: 0 }]
          kf.push({ offset: off(p.start), strokeDashoffset: px(0), opacity: 0 })
          p.kf.forEach(([t, s]) => kf.push({ offset: off(p.start + t), strokeDashoffset: px(s), opacity: 1 }))
          kf.push({ offset: off(p.start + p.end + 60), strokeDashoffset: px(p.run.length), opacity: 0 })
          kf.push({ offset: 1, strokeDashoffset: px(p.run.length), opacity: 0 })
          anims.push(path.animate(kf, opts))
        })
        const label = liveRefs.current[p.k]
        const next = packets[p.k + 1]?.start ?? period
        if (label) anims.push(label.animate(pulses([[p.start, next - 160]], period, 160), opts))
      })

      const lights = {}
      packets.forEach((p) => p.lit.forEach(([id, on, out]) => (lights[id] ||= []).push([p.start + on, p.start + out])))
      Object.entries(lights).forEach(([id, intervals]) => {
        const node = flashRefs.current[id]
        if (node) anims.push(node.animate(pulses(intervals, period, 320), opts))
      })
      const led = portRef.current?.firstElementChild
      if (led) anims.push(led.animate(pulses(packets.map((p) => [p.start, p.start + 140]), period, 380), opts))
      events = packets.filter((p) => p.j === 'write').map((p) => p.start + p.lit.find(([id]) => id === 'stream')[1])
      lastLocal = -1
      sync()
    }

    const flow = () => {
      if (still) return
      flowing = true
      if (edges) animate()
    }
    const stopFlow = () => {
      flowing = false
      clearTimeout(restart)
      anims.forEach((a) => a.cancel())
      anims = []
    }

    const layout = () => {
      frame = 0
      const base = stage.getBoundingClientRect()
      const rects = { origin: { ...box(portRef.current, base), point: true } }
      // Traces end at the toes of the parts' legs, --leg out from the body.
      const leg = parseFloat(getComputedStyle(nodeRefs.current.api).getPropertyValue('--leg')) || 0
      NODES.forEach(({ id }) => {
        const b = box(nodeRefs.current[id], base)
        rects[id] = { ...b, l: b.l - leg, t: b.t - leg, r: b.r + leg, b: b.b + leg }
      })
      svg.setAttribute('viewBox', `0 0 ${base.width.toFixed(1)} ${base.height.toFixed(1)}`)
      edges = new Map()
      EDGES.forEach(([a, b], i) => {
        const others = NODES.filter((n) => n.id !== a && n.id !== b).map((n) => rects[n.id])
        const { d, pts } = chamfer(route(rects[a], rects[b], others))
        pathRefs.current[i]?.setAttribute('d', d)
        if (i === 0) bedRef.current?.setAttribute('d', d)
        edges.set(`${a}>${b}`, pts)
      })
      // Traces follow every frame of a resize; the traffic restarts once it settles.
      if (!flowing) return
      clearTimeout(restart)
      if (anims.length) restart = setTimeout(animate, 160)
      else animate()
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(layout)
    }

    // ---- The opening
    const cpu = (state) => {
      if (state) root.dataset.cpu = state
      else delete root.dataset.cpu
    }
    const seen = () => {
      try {
        sessionStorage.setItem(SEEN_KEY, '1')
      } catch {
        /* storage blocked: it just plays again next time */
      }
    }
    const stopPrint = () => {
      printing.forEach((a) => a.cancel())
      printing = []
    }
    const runPrint = (strip, done) => {
      stopPrint()
      if (still) return done()
      const { anims, end } = print({ photo: photoRef.current, litho: lithoRef.current, strip })
      printing = anims
      later(() => {
        done()
        stopPrint()
      }, end)
    }
    const open = (origin) => {
      later(() => cpu('on'), STRIKE_AT)
      later(() => {
        stopBoot = boot({
          root,
          screens,
          img: imgRef.current,
          tookOver,
          origin,
          onService: (ids) => power(ids, true),
          onDone: () => {
            power(ALL, true)
            signalLinuxUp()
            seen()
            later(() => {
              cpu('print')
              runPrint(false, () => {
                cpu('photo')
                flow()
              })
            }, PRINT_AFTER)
          },
        })
      }, STRIKE_AT + BOOT_AFTER)
    }
    // Rebooting strips the print, powers everything down (the backdrop goes
    // with Linux) and plays the opening again.
    rebootRef.current = () => {
      stopBoot?.()
      stopBoot = null
      stopFlow()
      stopPrint()
      clearLater()
      power(ALL, false)
      signalLinuxDown()
      delete root.dataset.boot
      const replay = () => {
        cpu(null)
        open(performance.now())
      }
      if (root.dataset.cpu !== 'photo') return replay()
      cpu('strip')
      runPrint(true, replay)
    }

    const ro = new ResizeObserver(schedule)
    ro.observe(stage)
    NODES.forEach(({ id }) => nodeRefs.current[id] && ro.observe(nodeRefs.current[id]))
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      sync()
    })
    io.observe(root)
    document.addEventListener('visibilitychange', sync)
    schedule()

    let wasSeen = false
    try {
      wasSeen = sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      /* storage blocked */
    }
    // Past 4 s the CSS fallback has already shown the photo; don't take it back.
    if (wasSeen || still || performance.now() > 4000) {
      root.dataset.boot = 'done'
      cpu('photo')
      signalLinuxUp()
      if (still) power(ALL, true)
      else ALL.forEach((id, i) => later(() => power([id], true), 160 + i * 120))
      later(flow, still ? 0 : 160 + ALL.length * 120)
    } else open(0)

    // The reflection in the glasses shifts a little as the mouse moves, the
    // way it would as you move your head. Set on the lens, the only part that
    // reads them, so a move restyles the lens and not the whole hero.
    let tilt = 0
    let pointer = [0, 0]
    const lens = lensRef.current
    const lean = () => {
      tilt = 0
      lens.style.setProperty('--hx-px', pointer[0].toFixed(3))
      lens.style.setProperty('--hx-py', pointer[1].toFixed(3))
    }
    const onPointer = (e) => {
      if (e.pointerType !== 'mouse' || still) return
      pointer = [(e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1]
      if (!tilt) tilt = requestAnimationFrame(lean)
    }
    root.addEventListener('pointermove', onPointer, { passive: true })

    return () => {
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', sync)
      root.removeEventListener('pointermove', onPointer)
      cancelAnimationFrame(frame)
      cancelAnimationFrame(tilt)
      counting.forEach(cancelAnimationFrame)
      clearTimeout(restart)
      clearInterval(tick)
      clearLater()
      stopBoot?.()
      stopPrint()
      anims.forEach((a) => a.cancel())
      power(ALL, false)
      delete root.dataset.boot
      delete root.dataset.cpu
      delete root.dataset.still
    }
  }, [screens])

  const shown = inspect && BY_ID[inspect]

  const seeWork = (e) => {
    const target = document.querySelector('#projects')
    const lenis = window.__appLenis
    if (!target || !lenis) return
    e.preventDefault()
    lenis.scrollTo(target, { offset: -90, duration: 1.2 })
  }

  return (
    <section id="home" className="hx" ref={rootRef}>
      <div className="hx__inner" ref={contentRef}>
        <header className="hx__head">
          <p className="hx__prompt" aria-hidden="true">
            <ArchMark className="hx__arch" />
            <span>qwantum@sudo</span> ~ $ whoami
          </p>
          <h1 className="hx__name">
            <span className="hx__first">Sharifzoda</span>{' '}
            <span className="hx__last">
              <span className="hx__hollow">Bilol</span>{' '}
              <span className="hx__role" aria-hidden="true">
                <i>~$</i> <TypingSubtitle />
              </span>
            </span>
            <span className="sr-only"> — Backend Architect, Founder of Mintaka</span>
          </h1>
        </header>

        <div className="hx-rig" ref={stageRef} data-inspect={inspect || undefined}>
          <figure className="hx-pkg">
            <CpuLegs />
            <CpuLegs lit />
            <div className="hx-cpu">
              <div className="hx-cpu__face hx-cpu__front">
                <CpuFront />
                <span className="hx-cpu__flash" aria-hidden="true" />
              </div>
              <div className="hx-cpu__face hx-cpu__photo" ref={photoRef}>
                <img
                  ref={imgRef}
                  className="hx-pkg__img"
                  src={eye}
                  srcSet={`${eye360} 360w, ${eye} 640w`}
                  sizes="(max-width: 860px) 86vw, 440px"
                  width="640"
                  height="640"
                  alt="Sharifzoda Bilol's eye behind glasses, a screen of code reflected in the lens"
                />
                <span className="hx-pkg__grid" aria-hidden="true" />
                <div className="hx-lens" ref={lensRef} aria-hidden="true">
                  <div className="hx-reflect hx-reflect--ghost">
                    <div className="hx-screen">
                      <Fetch upFor={upFor} />
                    </div>
                  </div>
                  <div className="hx-reflect">
                    <div className="hx-screen">
                      <Fetch upFor={upFor} />
                    </div>
                  </div>
                  <span className="hx-sheen" />
                  <span className="hx-glint" />
                </div>
              </div>
              <div className="hx-litho" ref={lithoRef} aria-hidden="true">
                {Array.from({ length: FIELDS * FIELDS }, (_, i) => (
                  <i key={i} className="hx-litho__field" />
                ))}
                <i className="hx-litho__reticle" />
              </div>
            </div>
            <span className="hx-port" ref={portRef} aria-hidden="true">
              <i />
            </span>
            <Bolt />
          </figure>

          <div className="hx-parts" role="group" aria-label="Signals traced through parts of systems I built">
            <p className="hx-parts__cap" aria-hidden="true">
              <span className="hx-rec" /> live trace
            </p>
            {NODES.map((n) => (
              <button
                key={n.id}
                type="button"
                className="hx-node cursor-target"
                style={{ gridArea: n.id }}
                ref={(node) => {
                  nodeRefs.current[n.id] = node
                }}
                data-active={inspect === n.id ? '' : undefined}
                aria-describedby={`hx-src-${n.id}`}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setInspect(n.id)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setInspect(null)}
                onFocus={() => setInspect(n.id)}
                onBlur={() => setInspect(null)}
                onClick={() => setInspect(n.id)}
              >
                <i
                  className="hx-node__flash"
                  aria-hidden="true"
                  ref={(node) => {
                    flashRefs.current[n.id] = node
                  }}
                />
                <span className="hx-node__name">
                  {n.name}
                  {n.host && (
                    <span className="hx-node__host">
                      <ArchMark />
                      <span className="sr-only"> (measured on Arch Linux)</span>
                    </span>
                  )}
                </span>
                <span
                  className="hx-node__value"
                  ref={(node) => {
                    valueRefs.current[n.id] = node
                  }}
                >
                  {n.value}
                </span>
                <span
                  className="hx-node__sub"
                  ref={(node) => {
                    subRefs.current[n.id] = node
                  }}
                >
                  {n.sub}
                </span>
                <span className="sr-only" id={`hx-src-${n.id}`}>
                  {n.source}: {n.detail}
                </span>
              </button>
            ))}
          </div>

          {/* The live line stays mounted under the source text: its labels are
              driven by the same animation loop as the signals. */}
          <div className="hx-status" aria-hidden="true">
            <div className="hx-status__idle">
              <p className="hx-live">
                <span className="hx-live__boot">sb-1 · signals start once Linux is up</span>
                {PLAN.map(([j], k) => (
                  <span
                    key={k}
                    ref={(node) => {
                      liveRefs.current[k] = node
                    }}
                  >
                    <b>{JOURNEYS[j].label}</b> → {JOURNEYS[j].result}
                  </span>
                ))}
              </p>
              <p className="hx-legend">
                each number measured on its project · time in a part = its p99, slowed {SLOW}×
              </p>
            </div>
            {shown && (
              <p className="hx-src">
                <strong>{shown.name}</strong> <span className="hx-src__from">from {shown.source}</span>
                <span className="hx-src__detail">{shown.detail}</span>
              </p>
            )}
          </div>

          <svg className="hx-wires" ref={wiresRef} aria-hidden="true" focusable="false">
            <path className="hx-wires__bed" ref={bedRef} />
            {EDGES.map(([a, b], i) => (
              <path
                key={`${a}-${b}`}
                ref={(node) => {
                  pathRefs.current[i] = node
                }}
              />
            ))}
            <g className="hx-sig">
              {PLAN.map((_, k) => [
                <path
                  key={`c${k}`}
                  className="hx-sig__bits"
                  ref={(node) => {
                    sigRefs.current[k * 2] = node
                  }}
                />,
                <path
                  key={`g${k}`}
                  className="hx-sig__bloom"
                  ref={(node) => {
                    sigRefs.current[k * 2 + 1] = node
                  }}
                />,
              ])}
            </g>
          </svg>
        </div>

        <div className="hx-tty">
          <div className="hx-tty__bar">
            <span className="hx-tty__label">
              <ArchMark className="hx-tty__arch" /> tty1
            </span>
            <button type="button" className="hx-tty__reboot cursor-target" onClick={() => rebootRef.current?.()}>
              <span aria-hidden="true">↻</span> reboot
            </button>
          </div>
          <Screen logRef={screens[0].log} scrollRef={screens[0].scroll} upFor={upFor} />
        </div>

        <p className="hx__pitch">
          <BlurHighlight text="I create [[high-performance, scalable and secure]] software solutions. Using modern technologies, optimized algorithms and structures in terms of [[system design]], parallelism and architecting down to the [[smallest details]]. And making sure that [[my team does the same]]." />
        </p>

        <div className="hx__actions">
          <button type="button" className="hx-btn hx-btn--solid cursor-target" onClick={onContact}>
            Contact Me
          </button>
          <a className="hx-btn cursor-target" href="#projects" onClick={seeWork}>
            See the work <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  )
}
