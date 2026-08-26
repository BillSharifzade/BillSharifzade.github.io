import { useId, useMemo } from 'react'
import { splitSubpaths } from '../utils/svgSubpaths.js'
import './AnimatedTechIcon.css'

// Part-level hover animations for the Current Stack logos. Each builder
// decides how far a glyph can be taken apart: subpaths that act as winding
// holes (Rust's R, the Next.js leg, React's orbit rings) must stay inside one
// <path> element or the holes fill in, so those icons animate via whole-glyph
// motion or same-fill overlays instead of naive splitting. Parts are
// classified by geometry (area / position), not by subpath index, so a
// simple-icons update reshuffling subpath order won't silently break this.

const CENTER = 12

const r2 = (n) => Math.round(n * 100) / 100
const distToCenter = (b) => Math.hypot(b.cx - CENTER, b.cy - CENTER)
const byAreaDesc = (subs) => [...subs].sort((a, b) => b.bbox.area - a.bbox.area)

function buildReact(path) {
  const subs = splitSubpaths(path)
  // The nucleus is the simplest centered subpath; it sits in a zero-winding
  // gap, so it can pulse as its own element. The orbit fragments keep their
  // shared winding by being re-joined into a single path.
  const centered = subs.filter((sp) => distToCenter(sp.bbox) < 2)
  const nucleus = centered.length
    ? centered.reduce((a, b) => (a.d.length <= b.d.length ? a : b))
    : null
  if (!nucleus) return <path d={path} />
  const orbits = subs.filter((sp) => sp !== nucleus).map((sp) => sp.d).join('')
  return (
    <>
      <path className="ati-react-orbits" d={orbits} />
      <path className="ati-react-nucleus" d={nucleus.d} />
    </>
  )
}

function buildNext(path, uid) {
  // The bigger right leg of the N is a winding hole (it renders dark), so it
  // can't move on its own. Instead a gradient copy fades in over it — the
  // same white-to-transparent fade the real Next.js logo gives that stroke.
  const subs = splitSubpaths(path)
  if (subs.length < 2) return <path d={path} />
  const accent = byAreaDesc(subs)[subs.length - 1]
  const gid = `${uid}-nextgrad`
  return (
    <>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path} />
      <path className="ati-next-accent" d={accent.d} fill={`url(#${gid})`} />
    </>
  )
}

function buildDocker(path) {
  const subs = splitSubpaths(path)
  const hull = byAreaDesc(subs)[0]
  const boxes = subs.filter((sp) => sp !== hull)
  return (
    <>
      <path className="ati-docker-whale" d={hull.d} />
      {boxes.map((sp, i) => (
        <path key={sp.d} className="ati-docker-box" style={{ '--ati-i': i }} d={sp.d} />
      ))}
    </>
  )
}

function buildKafka(path) {
  // The node circles are hollow rings tangled into the connector web's
  // winding, so the glyph stays intact and two "data" dots travel the links:
  // top → middle → lower-right and bottom → middle → upper-right.
  const subs = splitSubpaths(path)
  if (subs.length < 6) return <path d={path} />
  const nodes = byAreaDesc(subs).slice(1)
  const byCy = [...nodes].sort((a, b) => a.bbox.cy - b.bbox.cy)
  const top = byCy[0]
  const bottom = byCy[byCy.length - 1]
  const middle = byCy.slice(1, -1)
  const right = middle.filter((sp) => sp.bbox.cx > CENTER).sort((a, b) => a.bbox.cy - b.bbox.cy)
  const mid = middle.find((sp) => !right.includes(sp))
  if (right.length < 2 || !mid) return <path d={path} />
  const [rUp, rLow] = [right[0], right[right.length - 1]]
  const hop = (from, to) => `${r2(to.bbox.cx - from.bbox.cx)}px, ${r2(to.bbox.cy - from.bbox.cy)}px`
  const dot = (variant, start, viaEnd) => (
    <circle
      key={variant}
      className={`ati-kafka-dot ati-kafka-dot--${variant}`}
      cx={r2(start.bbox.cx)}
      cy={r2(start.bbox.cy)}
      r="0.85"
      style={{ '--ati-w1': hop(start, mid), '--ati-w2': hop(start, viaEnd) }}
    />
  )
  return (
    <>
      <path d={path} />
      {dot('a', top, rLow)}
      {dot('b', bottom, rUp)}
    </>
  )
}

// Ear overlays sit fully inside the tanuki silhouette at rest (verified
// against the traced outline: tips ~(5.3,1.0)/(18.7,1.0), head line y≈7.82),
// share its solid fill, and twitch around their base.
const GITLAB_EARS = [
  { variant: 'left', d: 'M1.35 7.75L3.9 1.15L5.15 1.25L7.3 7.75Z', origin: '4.32px 7.6px' },
  { variant: 'right', d: 'M22.65 7.75L20.1 1.15L18.85 1.25L16.7 7.75Z', origin: '19.68px 7.6px' },
]

function buildGitlab(path) {
  return (
    <>
      <path d={path} />
      {GITLAB_EARS.map((ear) => (
        <path
          key={ear.variant}
          className={`ati-ear ati-ear--${ear.variant}`}
          d={ear.d}
          style={{ transformOrigin: ear.origin }}
        />
      ))}
    </>
  )
}

function build(slug, path, uid) {
  switch (slug) {
    case 'rust':
      // The R is carved out of the cog by winding holes — inseparable — so
      // the whole gear meshes back and forth instead of free-spinning.
      return <path className="ati-rust-glyph" d={path} />
    case 'react':
      return buildReact(path)
    case 'nextdotjs':
      return buildNext(path, uid)
    case 'docker':
      return buildDocker(path)
    case 'linux':
      return <path className="ati-linux-body" d={path} />
    case 'postgresql':
      return <path className="ati-pg-body" d={path} />
    case 'apachekafka':
      return buildKafka(path)
    case 'gitlab':
      return buildGitlab(path)
    default:
      return <path d={path} />
  }
}

export default function AnimatedTechIcon({ title, slug, path }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const content = useMemo(() => build(slug, path, uid), [slug, path, uid])
  return (
    <svg
      className={`tech-icon ati ati--${slug}`}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      fill="#ffffff"
    >
      {content}
    </svg>
  )
}
