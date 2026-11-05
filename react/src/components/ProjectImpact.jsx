import { useEffect, useLayoutEffect, useRef } from 'react'
import Icon from './Icon.jsx'
import './ProjectImpact.css'

// Where the six cells go, in order (see data/projectImpact.js).
const SLOTS = ['hero', 'w1', 's1', 's2', 'w2', 'w3']
const COUNT_MS = 1300

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Counts a number up from zero when the view opens, writing the text directly
// so the count never re-renders React.
function CountUp({ value, start, delay }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const fmt = (n) => Math.round(n).toLocaleString('en-US')
    if (!start || reducedMotion()) {
      el.textContent = fmt(value)
      return undefined
    }
    el.textContent = '0'
    let raf = 0
    let t0 = 0
    const tick = (now) => {
      if (!t0) t0 = now + delay
      const p = Math.min(1, Math.max(0, (now - t0) / COUNT_MS))
      el.textContent = fmt(value * (p === 1 ? 1 : 1 - 2 ** (-10 * p)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, start, delay])
  return <span ref={ref}>{value.toLocaleString('en-US')}</span>
}

function Head({ label, icon }) {
  return (
    <>
      <span className="pimpact__label">{label}</span>
      {icon && (
        <span className="pimpact__icon" aria-hidden="true">
          <Icon name={icon} />
        </span>
      )}
    </>
  )
}

function Cell({ cell, project, open }) {
  switch (cell.kind) {
    case 'metric':
      return (
        <>
          <Head label={cell.label} icon={cell.icon} />
          <p className="pimpact__figure">
            {cell.prefix}
            <CountUp value={cell.value} start={open} delay={260} />
            {cell.suffix}
          </p>
          <span className="pimpact__note">{cell.note}</span>
        </>
      )
    case 'dots':
      return (
        <>
          <Head label={cell.label} icon={cell.icon} />
          <div className="pimpact__dots-row">
            <span className="pimpact__dots" style={{ '--cols': cell.count > 12 ? 10 : cell.count }} aria-hidden="true">
              {Array.from({ length: Math.min(cell.count, 30) }, (_, i) => (
                <i key={i} style={{ '--i': i }} />
              ))}
            </span>
            <span className="pimpact__dots-figure">
              <strong>{cell.figure}</strong> {cell.note}
            </span>
          </div>
        </>
      )
    case 'lock':
      return (
        <>
          <Head label={cell.label} icon={cell.icon} />
          <div className="pimpact__lock">
            <span className="pimpact__lock-icon" aria-hidden="true">
              <Icon name="lock" />
            </span>
            <span>
              <strong className="pimpact__title">{cell.title}</strong>
              <span className="pimpact__note">{cell.note}</span>
            </span>
          </div>
        </>
      )
    case 'potential':
      return (
        <>
          <Head label={cell.label} icon={cell.icon} />
          <span className="pimpact__status">
            <i aria-hidden="true" /> {cell.status}
          </span>
          {/* Not data: a line that rises and leaves the frame, as the owner put it. */}
          <svg className="pimpact__chart" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">
            <path className="pimpact__chart-grid" d="M0 25H200M0 50H200M0 75H200" />
            <path className="pimpact__chart-line" d="M0 94 C 70 92, 112 86, 140 68 S 186 22, 200 0" pathLength="1" />
          </svg>
          <p className="pimpact__title">{cell.title}</p>
          <span className="pimpact__note">{cell.note}</span>
        </>
      )
    case 'flow':
      return (
        <>
          <Head label={cell.label} icon={cell.icon} />
          <ol className="pimpact__flow" style={{ '--n': cell.steps.length }}>
            {cell.steps.map((step, i) => (
              <li key={step} style={{ '--i': i }}>
                <i aria-hidden="true" />
                {step}
              </li>
            ))}
          </ol>
        </>
      )
    case 'fanout':
      return (
        <>
          <Head label={cell.label} icon={cell.icon} />
          <div className="pimpact__fan">
            <code className="pimpact__fan-source">{cell.source}</code>
            <svg className="pimpact__fan-lines" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">
              {cell.targets.map((t, i) => {
                const y = 5 + (50 * i) / (cell.targets.length - 1)
                return <path key={t} d={`M0 30 C 50 30, 50 ${y}, 100 ${y}`} pathLength="1" style={{ '--i': i }} />
              })}
            </svg>
            <ul className="pimpact__fan-targets">
              {cell.targets.map((t, i) => (
                <li key={t} style={{ '--i': i }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </>
      )
    case 'stack':
      return (
        <>
          <Head label={cell.label} icon={cell.icon} />
          <ul className="pimpact__stack">
            {project.icons.map((t) => (
              <li key={t.title}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={t.path} />
                </svg>
                {t.title}
              </li>
            ))}
          </ul>
        </>
      )
    default:
      return (
        <>
          <Head label={cell.label} icon={cell.icon} />
          <p className="pimpact__title">{cell.title}</p>
          <span className="pimpact__note">{cell.note}</span>
        </>
      )
  }
}

/**
 * A project's impact as a bento grid, shown in place of the project inside
 * the same window. The cells rise in by their distance from the button that
 * opened them, a ring of light runs out from that point, and with a mouse a
 * spotlight and a lit border follow the cursor across the cells.
 *
 * Everything that moves is transform or opacity. The cursor light is two
 * custom properties per cell, written at most once a frame.
 */
export default function ProjectImpact({ project, cells, open, origin, onClose, backRef }) {
  const gridRef = useRef(null)
  const cellRefs = useRef([])

  // Stagger the cells by their distance from where the view was opened.
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid || !open) return
    const box = grid.getBoundingClientRect()
    const ox = origin.x - box.left
    const oy = origin.y - box.top
    grid.style.setProperty('--ox', `${ox.toFixed(0)}px`)
    grid.style.setProperty('--oy', `${oy.toFixed(0)}px`)
    cellRefs.current.forEach((el) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const d = Math.hypot(r.left + r.width / 2 - origin.x, r.top + r.height / 2 - origin.y)
      el.style.setProperty('--d', `${Math.round(Math.min(420, d * 0.55))}ms`)
    })
  }, [open, origin])

  useEffect(() => {
    if (open) backRef.current?.focus({ preventScroll: true })
  }, [open, backRef])

  // Cursor light: positions are relative to each cell.
  const frame = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const paint = () => {
    frame.current = 0
    const { x, y } = pointer.current
    // Every rect first, then every write: a read after a write would make the
    // browser restyle the cell before it could answer.
    const cells = cellRefs.current.filter(Boolean)
    const rects = cells.map((el) => el.getBoundingClientRect())
    cells.forEach((el, i) => {
      el.style.setProperty('--mx', `${(x - rects[i].left).toFixed(0)}px`)
      el.style.setProperty('--my', `${(y - rects[i].top).toFixed(0)}px`)
    })
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <div className="pimpact" data-open={open ? '' : undefined} inert={!open}>
      <div className="pimpact__bar">
        <p className="pimpact__heading">
          <Icon name="chart-line" /> Impact
        </p>
        <button ref={backRef} type="button" className="pimpact__back" onClick={onClose}>
          <Icon name="chevron-left" /> Back to project
        </button>
      </div>
      <div
        ref={gridRef}
        className="pimpact__grid"
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return
          pointer.current = { x: e.clientX, y: e.clientY }
          if (!frame.current) frame.current = requestAnimationFrame(paint)
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') gridRef.current.dataset.lit = ''
        }}
        onPointerLeave={() => {
          delete gridRef.current.dataset.lit
        }}
      >
        <span className="pimpact__wave" aria-hidden="true" />
        {cells.slice(0, SLOTS.length).map((cell, k) => (
          <div
            key={`${cell.kind}-${cell.label}`}
            ref={(el) => {
              cellRefs.current[k] = el
            }}
            className={`pimpact__cell pimpact__cell--${cell.kind}${cell.grid ? ' pimpact__cell--grid' : ''}`}
            style={{ gridArea: SLOTS[k] }}
          >
            <Cell cell={cell} project={project} open={open} />
          </div>
        ))}
      </div>
    </div>
  )
}
