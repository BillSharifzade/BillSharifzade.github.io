import { useRef, useEffect, useState, useCallback, useId } from 'react'
import { gsap } from 'gsap'

import './AccordionGallery.css'

// Adapted from React Bits' AccordionGallery. Two changes beyond styling:
//
//  1. `--ag-dim` is set on the panel, not on `.ag-panel__media`. Upstream declares
//     it on the media element while the overlay that consumes it is a *sibling*,
//     so the custom property never inherits and the dimming tween is inert.
//  2. The panel is a <div> with an inset <a> hit area instead of being an <a>
//     itself. Each caption carries a title, stack and description; making the
//     whole thing one link would fold all of that into the link's accessible
//     name. The anchor is labelled by the heading and the copy stays readable.
//
// Narrow viewports flip to a vertical accordion in JS rather than in a media
// query, so the media-size measurement stays on the same axis as the layout.

const AccordionGallery = ({
  items = [],
  defaultIndex = 0,
  accentColor = '#818cf8',
  overlayColor = '#05050a',
  textColor = '#e3d3d3',
  height = 520,
  mobileHeight = 800,
  gap = 12,
  radius = 18,
  expandRatio = 0.5,
  orientation = 'horizontal',
  duration = 0.6,
  ease = 'power3.out',
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  breakpoint = 860,
  className = ''
}) => {
  const rootRef = useRef(null)
  const panelRefs = useRef([])
  const mediaRefs = useRef([])
  const barRefs = useRef([])
  const titleRefs = useRef([])
  const metaRefs = useRef([])
  const spineRefs = useRef([])
  const hitRefs = useRef([])
  const tlRef = useRef(null)
  const firstRunRef = useRef(true)
  const mediaSizeRef = useRef(320)
  const uid = useId()

  const count = items.length
  const [active, setActive] = useState(Math.min(Math.max(defaultIndex, 0), Math.max(count - 1, 0)))
  const [narrow, setNarrow] = useState(false)
  const [reduced, setReduced] = useState(false)

  const vertical = orientation === 'vertical' || narrow
  const effTilt = narrow ? 0 : tilt

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mqNarrow = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncNarrow = () => setNarrow(mqNarrow.matches)
    const syncMotion = () => setReduced(mqMotion.matches)
    syncNarrow()
    syncMotion()
    mqNarrow.addEventListener('change', syncNarrow)
    mqMotion.addEventListener('change', syncMotion)
    return () => {
      mqNarrow.removeEventListener('change', syncNarrow)
      mqMotion.removeEventListener('change', syncMotion)
    }
  }, [breakpoint])

  const applyLayout = useCallback(
    (animate) => {
      const panels = panelRefs.current
      if (!panels.length) return

      const r = Math.min(Math.max(expandRatio, 0.2), 0.9)
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1
      const mediaSize = mediaSizeRef.current

      tlRef.current?.kill()
      const dur = animate && !reduced ? duration : 0
      const tl = gsap.timeline()

      panels.forEach((panel, i) => {
        if (!panel) return
        const isActive = i === active
        const media = mediaRefs.current[i]
        const bar = barRefs.current[i]
        const title = titleRefs.current[i]
        const meta = metaRefs.current[i]
        const spine = spineRefs.current[i]

        const rot = isActive ? 0 : i < active ? effTilt : -effTilt
        const rotProp = vertical ? { rotateX: -rot } : { rotateY: rot }

        tl.to(
          panel,
          { flexGrow: isActive ? grow : 1, ...rotProp, '--ag-dim': isActive ? 0 : 0.72, duration: dur, ease },
          0
        )

        if (media) {
          const drift = Math.max(-1.5, Math.min(1.5, active - i))
          const shift = drift * parallax * mediaSize * 0.06
          tl.to(
            media,
            {
              xPercent: -50,
              yPercent: -50,
              x: vertical ? 0 : isActive ? 0 : shift,
              y: vertical ? (isActive ? 0 : shift) : 0,
              '--ag-gray': grayscale ? (isActive ? 0 : 1) : 0,
              duration: dur,
              ease
            },
            0
          )
        }

        if (spine) {
          tl.to(spine, { opacity: isActive ? 0 : 1, duration: dur * 0.5, ease }, 0)
        }

        if (showLabels && bar && title && meta) {
          if (isActive) {
            tl.to(
              [bar, title, meta],
              { opacity: 1, x: 0, duration: dur, ease, stagger: reduced ? 0 : stagger },
              0
            )
          } else {
            tl.to([bar, title, meta], { opacity: 0, x: -14, duration: dur * 0.6, ease }, 0)
          }
        }
      })

      tlRef.current = tl
    },
    [
      active,
      count,
      expandRatio,
      duration,
      ease,
      vertical,
      effTilt,
      parallax,
      grayscale,
      showLabels,
      stagger,
      reduced
    ]
  )

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      const total = vertical ? rect.height : rect.width
      const usable = Math.max(total - gap * (count - 1), 120)
      const size = Math.max(140, usable * Math.min(Math.max(expandRatio, 0.2), 0.9) * 1.22)
      mediaSizeRef.current = size
      el.style.setProperty('--ag-media-size', `${size}px`)
      // Captions are laid out at the *expanded* width for the whole tween, so
      // the copy does not reflow line-by-line while the panel is still opening.
      el.style.setProperty('--ag-open-size', `${usable * Math.min(Math.max(expandRatio, 0.2), 0.9)}px`)
      applyLayout(!firstRunRef.current)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [applyLayout, gap, count, expandRatio, vertical])

  useEffect(() => {
    applyLayout(!firstRunRef.current)
    firstRunRef.current = false
  }, [applyLayout])

  useEffect(
    () => () => {
      tlRef.current?.kill()
    },
    []
  )

  const handleEnter = (i) => {
    if (trigger === 'hover' && !narrow) setActive(i)
  }

  // First interaction with a collapsed panel opens it; the second follows the
  // link. Without this a tap on a sliver would navigate before it was readable.
  const handleClick = (i, e) => {
    if (i !== active) {
      e.preventDefault()
      setActive(i)
    }
  }

  // Step from the panel that is *open*, not the one holding focus, and take
  // focus with it. Deriving the step from the focused index means a second
  // arrow press recomputes the same neighbour and the gallery stops moving.
  const step = (delta) => {
    const idx = (active + delta + count) % count
    setActive(idx)
    hitRefs.current[idx]?.focus()
  }

  const handleKeyDown = (e) => {
    const next = vertical ? 'ArrowDown' : 'ArrowRight'
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft'
    if (e.key === next) {
      e.preventDefault()
      step(1)
    } else if (e.key === prev) {
      e.preventDefault()
      step(-1)
    }
  }

  if (!count) return null

  return (
    <div
      ref={rootRef}
      className={`accordion-gallery${vertical ? ' accordion-gallery--vertical' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--ag-accent': accentColor,
        '--ag-overlay': overlayColor,
        '--ag-text': textColor,
        '--ag-gap': `${gap}px`,
        '--ag-radius': `${radius}px`,
        height: vertical ? `${narrow ? mobileHeight : Math.round(height * 1.6)}px` : `${height}px`
      }}
      role="list"
    >
      {items.map((item, i) => {
        const isActive = i === active
        const titleId = `${uid}-ag-${i}`
        return (
          <div
            key={item.repo || item.label || i}
            ref={(el) => (panelRefs.current[i] = el)}
            className={`ag-panel${isActive ? ' ag-panel--active' : ''}`}
            style={item.accent ? { '--ag-accent': item.accent } : undefined}
            role="listitem"
          >
            <span className="ag-panel__frame">
              <span className="ag-panel__media" ref={(el) => (mediaRefs.current[i] = el)}>
                <img src={item.image} alt={item.alt || ''} loading="lazy" draggable="false" />
              </span>
              <span className="ag-panel__overlay" aria-hidden="true" />
            </span>

            <span className="ag-panel__spine" ref={(el) => (spineRefs.current[i] = el)} aria-hidden="true">
              {item.label}
            </span>

            {showLabels && (
              <div className="ag-panel__label">
                <span className="ag-panel__bar" ref={(el) => (barRefs.current[i] = el)} />
                <div className="ag-panel__copy">
                  <h3 className="ag-panel__title" id={titleId} ref={(el) => (titleRefs.current[i] = el)}>
                    {item.label}
                  </h3>
                  <div className="ag-panel__meta" ref={(el) => (metaRefs.current[i] = el)}>
                    {item.stack && <p className="ag-panel__stack">{item.stack}</p>}
                    {item.blurb && <p className="ag-panel__blurb">{item.blurb}</p>}
                    {item.repo && (
                      <span className="ag-panel__repo">
                        <i className="fab fa-github" aria-hidden="true"></i> {item.repo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <a
              className="ag-panel__hit"
              ref={(el) => (hitRefs.current[i] = el)}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-labelledby={titleId}
              aria-current={isActive ? 'true' : undefined}
              onClick={(e) => handleClick(i, e)}
              onMouseEnter={() => handleEnter(i)}
              onFocus={() => setActive(i)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )
      })}
    </div>
  )
}

export default AccordionGallery
