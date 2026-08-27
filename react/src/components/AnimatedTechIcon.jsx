import { useId, useMemo } from 'react'
import { splitSubpaths } from '../utils/svgSubpaths.js'
import './AnimatedTechIcon.css'

// Part-level animations for the Current Stack logos. Each builder decides how
// far a glyph can be taken apart: subpaths that act as winding holes (Rust's
// R, the Next.js N, React's orbit rings) must stay inside one <path> element
// or the holes fill in. Where a part can't be split, it is separated
// geometrically instead — two copies of the whole glyph cut apart with a
// clipPath/mask pair that overlaps inside solid fill, so the seam never
// shows (Rust's spinning rim, the Postgres trunk, the GitLab ears). Parts are
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

function buildRust(path, uid) {
  // The R is carved out of the cog by winding holes, but the glyph has a
  // fully solid annulus at r 10.0–10.8 (measured against the raster), so the
  // toothed rim can be cut off along it and spun while the R and its bolt
  // holes hold still. Both copies overlap inside the band, hiding the seam.
  const maskId = `${uid}-rustrim`
  const clipId = `${uid}-rustcore`
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="10.55" />
        </clipPath>
        <mask id={maskId}>
          <rect x="-2" y="-2" width="28" height="28" fill="#fff" />
          <circle cx="12" cy="12" r="10.45" fill="#000" />
        </mask>
      </defs>
      <g className="ati-rust-gear">
        <path mask={`url(#${maskId})`} d={path} />
      </g>
      <path clipPath={`url(#${clipId})`} d={path} />
    </>
  )
}

function buildNext(path, uid) {
  // The N is carved out of the solid disc, so a sheen swept BEHIND the disc
  // shows only through the letterforms — light travelling along the N — while
  // a comet with a fading tail orbits the rim outside.
  const gid = `${uid}-nextsheen`
  const clipId = `${uid}-nextdisc`
  return (
    <>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="11.8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {/* Rotated to run along the N's diagonal; the inner group translates. */}
        <g transform="rotate(35 12 12)">
          <g className="ati-next-sheen">
            <rect x="6" y="-8" width="12" height="40" fill={`url(#${gid})`} />
          </g>
        </g>
      </g>
      <path d={path} />
      <g className="ati-next-orbit">
        <circle className="ati-next-comet" cx="12" cy="-1.1" r="0.8" />
        <circle className="ati-next-comet ati-next-comet--t1" cx="9.28" cy="-0.81" r="0.55" />
        <circle className="ati-next-comet ati-next-comet--t2" cx="7.1" cy="-0.15" r="0.35" />
      </g>
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

// The tanuki's ears are the two spikes above the head line (y≈7.8182, traced
// from the path: inner bases at x 7.5375/16.4686, tip arcs verbatim from the
// original, outer edges cut where they cross the head line). The base glyph is
// masked to below that line and these replacement ears — extended by a small
// root skirt that hides inside the solid head — wiggle on top. Without the
// mask the original ears stay painted and any overlay motion is invisible,
// which is why the previous version read as "no animation".
const GITLAB_HEADLINE = 7.8182
const GITLAB_EARS = [
  {
    variant: 'left',
    d: 'M7.5375 7.8182L5.3318 1.0702a.8748.8748 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.851.851 0 0 0-.3362.4049L1.083 7.8182 0.95 8.55h6.5875Z',
    origin: '4.31px 7.82px',
  },
  {
    variant: 'right',
    d: 'M16.4686 7.8182L18.6741 1.0702a.8748.8748 0 0 1 .29-.4399.8748.8748 0 0 1 .9997-.0539.851.851 0 0 1 .3362.405L22.92 7.8182 23.05 8.55h-6.5814Z',
    origin: '19.7px 7.82px',
  },
]

function buildGitlab(path, uid) {
  const maskId = `${uid}-glhead`
  return (
    <>
      <defs>
        <mask id={maskId}>
          <rect x="-2" y="-2" width="28" height="28" fill="#fff" />
          <rect x="-2" y="-2" width="28" height={GITLAB_HEADLINE + 2} fill="#000" />
        </mask>
      </defs>
      <path mask={`url(#${maskId})`} d={path} />
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

function buildPg(path, uid) {
  // Outline-style glyph: the eye highlights are two small independent white
  // dots (safe to split — verified pixel-identical), and the trunk below
  // y=18 is only the two converging outline strokes. The trunk copy skews
  // about the y=18 line, which keeps every point ON the cut line fixed, so
  // the joint is seamless while the tip sweeps.
  const subs = splitSubpaths(path)
  const dots = subs.filter((sp) => sp.bbox.area < 2.5 && sp.bbox.cy < 9)
  if (dots.length !== 2) return <path className="ati-pg-body" d={path} />
  const rest = subs.filter((sp) => !dots.includes(sp)).map((sp) => sp.d).join('')
  const clipId = `${uid}-pgtrunk`
  const maskId = `${uid}-pghead`
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x="11.2" y="17.98" width="7.6" height="6.7" />
        </clipPath>
        <mask id={maskId}>
          <rect x="-1" y="-1" width="26" height="26" fill="#fff" />
          <rect x="11.2" y="18.02" width="7.6" height="6.7" fill="#000" />
        </mask>
      </defs>
      <g className="ati-pg-body">
        <path mask={`url(#${maskId})`} d={rest} />
        <path className="ati-pg-trunk" clipPath={`url(#${clipId})`} d={rest} />
        {dots.map((sp) => (
          <path
            key={sp.d}
            className="ati-pg-eye"
            d={sp.d}
            style={{ transformOrigin: `${r2(sp.bbox.cx)}px ${r2(sp.bbox.cy)}px` }}
          />
        ))}
      </g>
    </>
  )
}

function build(slug, path, uid) {
  switch (slug) {
    case 'rust':
      return buildRust(path, uid)
    case 'react':
      return buildReact(path)
    case 'nextdotjs':
      return buildNext(path, uid)
    case 'docker':
      return buildDocker(path)
    case 'linux':
      return <path className="ati-linux-body" d={path} />
    case 'postgresql':
      return buildPg(path, uid)
    case 'apachekafka':
      return buildKafka(path)
    case 'gitlab':
      return buildGitlab(path, uid)
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
