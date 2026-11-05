import { memo } from 'react'
import { siArchlinux } from 'simple-icons'

// The front of the board's processor: a flip-chip package seen from above,
// bare silicon in the middle. Everything is generated here, once, from a fixed
// seed, so the server and the browser draw the same chip.

const ARCH = siArchlinux.path.slice(0, siArchlinux.path.indexOf('M', 1))

function seeded(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = seeded(0x5b1)
const r1 = (n) => Math.round(n * 10) / 10

// The die, in its own coordinates (DIE_W × DIE_H), placed at DIE_X, DIE_Y.
const DIE_X = 78
const DIE_Y = 86
const DIE_W = 244
const DIE_H = 224
const ROWS = 4
const CORE = { w: 84, h: 41, gap: 3, top: 22 }
const COL_X = [9, DIE_W - 9 - CORE.w]

// Eight cores, two columns of four either side of the shared cache. Each core
// has its L2 (the bright array on the cache side), split L1 arrays, a vector
// unit, and the rest in rows of standard cells.
const CORES = []
COL_X.forEach((x, side) => {
  for (let r = 0; r < ROWS; r++) {
    const y = CORE.top + r * (CORE.h + CORE.gap)
    const l2w = 28
    const l2x = side ? x + 1.5 : x + CORE.w - l2w - 1.5
    const lx = side ? x + l2w + 4 : x + 1.5
    const lw = CORE.w - l2w - 5.5
    const logic = []
    let yy = y + 2
    while (yy < y + CORE.h - 3) {
      const h = Math.min(5 + Math.floor(rnd() * 7), y + CORE.h - 2 - yy)
      let xx = lx
      while (xx < lx + lw - 3) {
        const w = Math.min(6 + Math.floor(rnd() * 14), lx + lw - xx)
        if (w > 2.5 && h > 2) logic.push([r1(xx), r1(yy), r1(w - 0.9), r1(h - 0.9), Math.floor(rnd() * 4)])
        xx += w
      }
      yy += h
    }
    const l1x = side ? x + l2w + 4 : x + CORE.w - l2w - 10
    CORES.push({
      k: side * ROWS + r,
      d: Math.abs(r - 1.5),
      x,
      y,
      l2: [l2x, y + 1.5, l2w, CORE.h - 3],
      l1: [
        [l1x, y + 3, 5, CORE.h / 2 - 4.5],
        [l1x, y + CORE.h / 2 + 1.5, 5, CORE.h / 2 - 4.5],
      ],
      vec: [side ? x + CORE.w - 22 : x + 3, y + CORE.h - 15, 19, 12],
      logic,
    })
  }
})

// The shared cache down the middle, in slices with their tag arrays.
const L3 = { x: COL_X[0] + CORE.w + 5, y: CORE.top, h: ROWS * (CORE.h + CORE.gap) - CORE.gap }
L3.w = COL_X[1] - 5 - L3.x
const SLICES = Array.from({ length: 8 }, (_, i) => L3.y + (i * L3.h) / 8)

// Repeated parts are drawn as dashed strokes (a row of identical pads is
// one line with a dash per pad) and merged paths, so the whole chip stays a
// few dozen elements in the page's HTML.
const rect = ([x, y, w, h]) => `M${r1(x)} ${r1(y)}h${r1(w)}v${r1(h)}h${r1(-w)}z`

// Solder bumps' landing ring just inside the die edge.
const BUMP = 1.6
const BUMPS_X = { d: `M5 3.4H${DIE_W - 5}M5 ${DIE_H - 3.4}H${DIE_W - 5}`, pitch: (DIE_W - 10) / 45 }
const BUMPS_Y = { d: `M3.4 7V${DIE_H - 7}M${DIE_W - 3.4} 7V${DIE_H - 7}`, pitch: (DIE_H - 14) / 41 }

// Decoupling capacitors on the substrate: double rows along each side of the
// die, and clusters in the corners. Each kind: the rows' path, the cap's
// length, width and pitch.
const CAP_ROWS = [
  { d: [52, 62, 330, 340].map((y) => `M86 ${y + 2.75}h${15 * 15.6 - 5.6}`).join(''), len: 10, wide: 5.5, pitch: 15.6 },
  { d: [52, 62, 330, 340].map((x) => `M${x + 2.75} 94v${14 * 15.6 - 5.6}`).join(''), len: 10, wide: 5.5, pitch: 15.6 },
  {
    d: [[22, 22], [352, 22], [352, 352]]
      .flatMap(([cx, cy]) => [0, 1, 2].map((b) => `M${cx} ${cy + b * 9 + 1.8}h24`))
      .join(''),
    len: 6,
    wide: 3.6,
    pitch: 9,
  },
]

// A 2D data-matrix code, as laser-marked on real packages: a solid L finder,
// a dotted clock edge, and seeded data inside.
let DM = ''
const DM_N = 14
for (let y = 0; y < DM_N; y++) {
  for (let x = 0; x < DM_N; x++) {
    const finder = x === 0 || y === DM_N - 1
    const clock = (y === 0 && x % 2 === 0) || (x === DM_N - 1 && y % 2 === 1)
    if (finder || clock || (x > 0 && y > 0 && x < DM_N - 1 && y < DM_N - 1 && rnd() < 0.48)) DM += `M${x} ${y}h1v1h-1z`
  }
}

const TONES = ['url(#hx-cells)', 'url(#hx-cells-b)', '#1b1b1e']
const LOGIC = TONES.map((_, tone) =>
  CORES.flatMap((c) => c.logic.filter((l) => l[4] % TONES.length === tone).map(rect)).join(''),
)
const CORE_BOXES = CORES.map((c) => rect([c.x, c.y, CORE.w, CORE.h])).join('')
const ARRAYS = CORES.flatMap((c) => [c.l2, ...c.l1].map(rect)).join('')
const VECTOR = CORES.map((c) => rect(c.vec)).join('')

/** The processor's top side, drawn into a 400 × 400 box. */
function CpuFrontArt() {
  return (
    <svg className="hx-cpu__art" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <defs>
        {/* SRAM: bright, regular arrays, the most reflective thing on a die. */}
        <pattern id="hx-sram" width="2.2" height="2.2" patternUnits="userSpaceOnUse">
          <rect width="2.2" height="2.2" fill="#2b2b30" />
          <rect width="1.5" height="1.5" fill="#46464c" />
        </pattern>
        {/* Standard cells: fine horizontal rows. */}
        <pattern id="hx-cells" width="4" height="1.6" patternUnits="userSpaceOnUse">
          <rect width="4" height="1.6" fill="#18181b" />
          <rect width="4" height="0.7" fill="#232327" />
        </pattern>
        <pattern id="hx-cells-b" width="3" height="1.3" patternUnits="userSpaceOnUse">
          <rect width="3" height="1.3" fill="#1d1d21" />
          <rect width="1.8" height="0.6" fill="#2a2a2f" />
        </pattern>
        <pattern id="hx-phy" width="3.2" height="12" patternUnits="userSpaceOnUse">
          <rect width="3.2" height="12" fill="#1a1a1d" />
          <rect width="1.5" height="12" fill="#3a3a40" />
        </pattern>
        <pattern id="hx-vias" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="0.6" fill="#1c1c1e" />
        </pattern>
        <linearGradient id="hx-silicon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e1e22" />
          <stop offset="0.5" stopColor="#141417" />
          <stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        {/* Polished silicon catches the light in broad diagonal bands. */}
        <linearGradient id="hx-glare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.34" stopColor="#fff" stopOpacity="0.13" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.03" />
          <stop offset="0.56" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="0.74" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hx-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a5a60" />
          <stop offset="1" stopColor="#1a1a1c" />
        </linearGradient>
        <radialGradient id="hx-lit" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Substrate: laminate with its via field, fiducials, and the capacitors. */}
      <rect width="400" height="400" rx="8" fill="#0c0c0d" />
      <rect width="400" height="400" rx="8" fill="url(#hx-vias)" />
      <rect x="0.5" y="0.5" width="399" height="399" rx="7.5" fill="none" stroke="#2a2a2c" />
      <circle cx="12" cy="12" r="2.4" fill="none" stroke="#4a4a4e" strokeWidth="0.8" />
      <circle cx="388" cy="388" r="2.4" fill="none" stroke="#4a4a4e" strokeWidth="0.8" />
      <g fill="none">
        {CAP_ROWS.map(({ d, len, wide, pitch }) => {
          const end = Math.min(2.2, len * 0.24)
          return (
            <g key={d} strokeWidth={wide}>
              <path d={d} stroke="#7b7b80" strokeDasharray={`${len} ${r1(pitch - len)}`} />
              <path d={d} stroke="#242426" strokeDasharray={`${r1(len - 2 * end)} ${r1(pitch - len + 2 * end)}`} strokeDashoffset={-end} />
            </g>
          )
        })}
      </g>

      {/* Markings: pin 1, the part number, the matrix code. */}
      <path d="M12 388 L12 374 L26 388 Z" fill="#3e3e42" />
      <g fill="#707074" fontSize="8.4" letterSpacing="0.6">
        <text x="34" y="376">QWANTUM SB-1</text>
        <text x="34" y="387" fontSize="6.2" fill="#505054">x86_64 · RUST · DUSHANBE 2026</text>
      </g>
      <g transform="translate(318 362) scale(1.9)" fill="#505054">
        <path d={DM} />
      </g>

      {/* Underfill fillet, then the die. */}
      <rect x={DIE_X - 5} y={DIE_Y - 5} width={DIE_W + 10} height={DIE_H + 10} rx="4" fill="#161618" />
      <g transform={`translate(${DIE_X} ${DIE_Y})`}>
        <rect width={DIE_W} height={DIE_H} fill="url(#hx-silicon)" />
        <rect x="0.4" y="0.4" width={DIE_W - 0.8} height={DIE_H - 0.8} fill="none" stroke="url(#hx-edge)" strokeWidth="0.8" />
        <g fill="none" stroke="#3a3a40" strokeWidth={BUMP}>
          {[BUMPS_X, BUMPS_Y].map(({ d, pitch }) => (
            <path key={d} d={d} strokeDasharray={`${BUMP} ${r1(pitch - BUMP)}`} strokeDashoffset={BUMP / 2} />
          ))}
        </g>
        {/* Memory PHYs along the top, PCIe and I/O along the bottom. */}
        <rect x="9" y="7.5" width={DIE_W / 2 - 13} height="11" fill="url(#hx-phy)" />
        <rect x={DIE_W / 2 + 4} y="7.5" width={DIE_W / 2 - 13} height="11" fill="url(#hx-phy)" />
        <rect x="9" y={DIE_H - 18.5} width={DIE_W - 18} height="11" fill="url(#hx-phy)" />
        {/* The shared cache, in slices, each with its tag array. */}
        <rect x={L3.x} y={L3.y} width={L3.w} height={L3.h} fill="url(#hx-sram)" />
        {SLICES.map((y, i) => (
          <g key={y}>
            {i > 0 && <rect x={L3.x} y={r1(y - 0.8)} width={L3.w} height="1.6" fill="#101012" />}
            <rect x={r1(L3.x + L3.w / 2 - 2)} y={r1(y + 1.5)} width="4" height={r1(L3.h / 8 - 3)} fill="url(#hx-cells-b)" />
          </g>
        ))}
        {/* The cores: background, logic in three textures, their arrays, the
            vector units, and the gaps between them. */}
        <path d={CORE_BOXES} fill="#141417" />
        {LOGIC.map((d, tone) => (
          <path key={tone} d={d} fill={TONES[tone]} />
        ))}
        <path d={ARRAYS} fill="url(#hx-sram)" />
        <path d={VECTOR} fill="#232328" />
        <path d={CORE_BOXES} fill="none" stroke="#0e0e10" strokeWidth="1" />
        {/* Die art, as engineers hide on real chips. */}
        <g transform={`translate(${DIE_W - 20} ${DIE_H - 17.6}) scale(0.42)`} opacity="0.55">
          <path d={ARCH} fill="#56565c" />
        </g>
        {/* Powered: the arrays and cores light from the strike outward. */}
        <g className="hx-cpu__lit">
          <rect width={DIE_W} height={DIE_H} fill="url(#hx-lit)" />
          <rect x={L3.x} y={L3.y} width={L3.w} height={L3.h} fill="#fff" fillOpacity="0.08" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.7" />
          <rect x="9" y="7.5" width={DIE_W - 18} height="11" fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="0.5" />
          <rect x="9" y={DIE_H - 18.5} width={DIE_W - 18} height="11" fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="0.5" />
          {CORES.map((c) => (
            <g key={c.k} className="hx-core" style={{ '--k': c.k, '--d': c.d }}>
              <rect x={c.x} y={c.y} width={CORE.w} height={CORE.h} fill="#fff" fillOpacity="0.05" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.6" />
              <rect x={c.l2[0]} y={c.l2[1]} width={c.l2[2]} height={c.l2[3]} fill="#fff" fillOpacity="0.1" />
            </g>
          ))}
        </g>
        <rect width={DIE_W} height={DIE_H} fill="url(#hx-glare)" />
      </g>
    </svg>
  )
}

// The package's legs: gull-wing leads down all four sides, each soldered to
// its pad on the board with a trace running off into it. Drawn for the bottom
// side and turned for the other three, in the package's units (480 across,
// the body's edge at 480). The signals' channel is legs 13–15 of the right
// side (Hero.css places .hx-port over their pads).
const LEG = { n: 24, pitch: 16, w: 6.4, reach: 15, pad: [5, 18], padW: 9, trace: [18, 38], traceW: 1.6 }
const LEG_FIRST = 240 - ((LEG.n - 1) * LEG.pitch) / 2
const legRow = (w, [from, to]) => ({
  d: `M${r1(LEG_FIRST - w / 2)} ${r1(480 + (from + to) / 2)}H${r1(LEG_FIRST + (LEG.n - 1) * LEG.pitch + w / 2)}`,
  strokeWidth: to - from,
  strokeDasharray: `${w} ${r1(LEG.pitch - w)}`,
})

/** The legs round the package; `lit` draws them carrying current, in white. */
function CpuLegsArt({ lit = false }) {
  const id = lit ? 'hx-legs-lit' : 'hx-legs'
  return (
    <svg className={lit ? 'hx-legs hx-legs--lit' : 'hx-legs'} viewBox="-40 -40 560 560" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-trace`} gradientUnits="userSpaceOnUse" x1="0" y1={480 + LEG.trace[0]} x2="0" y2={480 + LEG.trace[1]}>
          <stop offset="0" stopColor="#fff" stopOpacity={lit ? 0.85 : 0.2} />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {!lit && (
          <>
            {/* Out of the body's shadow, over the shoulder, down the bend, and
                flat on the pad in a bright fillet of solder. */}
            <linearGradient id="hx-legs-metal" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2={480 + LEG.reach}>
              <stop offset="0" stopColor="#18181a" />
              <stop offset="0.16" stopColor="#4a4a4f" />
              <stop offset="0.3" stopColor="#1d1d20" />
              <stop offset="0.44" stopColor="#2e2e32" />
              <stop offset="0.52" stopColor="#87878d" />
              <stop offset="0.8" stopColor="#c8c8cc" />
              <stop offset="1" stopColor="#6a6a70" />
            </linearGradient>
            <linearGradient id="hx-legs-shade" gradientUnits="userSpaceOnUse" x1="0" y1="480" x2="0" y2="489">
              <stop offset="0" stopColor="#000" stopOpacity="0.7" />
              <stop offset="1" stopColor="#000" stopOpacity="0" />
            </linearGradient>
          </>
        )}
      </defs>
      <g id={`${id}-side`} fill="none">
        <path {...legRow(LEG.traceW, LEG.trace)} stroke={`url(#${id}-trace)`} />
        <path {...legRow(LEG.padW, LEG.pad)} stroke={lit ? '#fff' : '#29292c'} strokeOpacity={lit ? 0.4 : undefined} />
        <path {...legRow(LEG.w, [0, LEG.reach])} stroke={lit ? '#fff' : 'url(#hx-legs-metal)'} />
        {!lit && <rect x="44" y="480" width="392" height="9" fill="url(#hx-legs-shade)" />}
      </g>
      {[90, 180, 270].map((a) => (
        <use key={a} href={`#${id}-side`} transform={`rotate(${a} 240 240)`} />
      ))}
    </svg>
  )
}

// The lightning: a stepped leader from far above to the die, by midpoint
// displacement, with a few forks that die out on the way down.
const bolt = (() => {
  const r = seeded(0x2a7)
  const split = (a, b, spread, depth, out) => {
    if (depth === 0) {
      out.push(b)
      return
    }
    const m = [(a[0] + b[0]) / 2 + (r() - 0.5) * spread, (a[1] + b[1]) / 2 + (r() - 0.5) * spread * 0.25]
    split(a, m, spread / 2, depth - 1, out)
    split(m, b, spread / 2, depth - 1, out)
  }
  const line = (a, b, spread, depth) => {
    const out = [a]
    split(a, b, spread, depth, out)
    return out
  }
  const main = line([-60, -1000], [0, 0], 260, 7)
  const forks = [0.22, 0.41, 0.63].map((at, i) => {
    const p = main[Math.floor(at * main.length)]
    const dir = i % 2 ? 1 : -1
    return line(p, [p[0] + dir * (90 + r() * 70), p[1] + 150 + r() * 120], 90, 5)
  })
  const d = (pts) => `M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join('L')}`
  return { main: d(main), forks: forks.map(d) }
})()

/** The strike, drawn from far above the processor down to its centre. */
function BoltArt() {
  return (
    <svg className="hx-bolt" viewBox="-200 -1000 400 1000" aria-hidden="true" focusable="false">
      <g className="hx-bolt__glow">
        <path d={bolt.main} />
        {bolt.forks.map((f) => (
          <path key={f} d={f} />
        ))}
      </g>
      <g className="hx-bolt__core">
        <path d={bolt.main} />
        {bolt.forks.map((f) => (
          <path key={f} d={f} className="hx-bolt__fork" />
        ))}
      </g>
    </svg>
  )
}

// Drawn once: none of them changes with the hero's state, so they skip the
// re-render a hovered part sets off.
export const CpuFront = memo(CpuFrontArt)
export const CpuLegs = memo(CpuLegsArt)
export const Bolt = memo(BoltArt)
