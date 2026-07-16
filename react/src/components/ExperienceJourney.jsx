import { useLayoutEffect, useRef, useState } from 'react'
import { experience } from '../data/cv.js'
import azalLogo from '../assets/azal_telecom.png'
import kitLogo from '../assets/kit.webp'
import milliLogo from '../assets/milli.png'
import technohubLogo from '../assets/technohub.png'
import tagLogo from '../assets/tag.png'
import foundersLogo from '../assets/founder_school.png'
import './ExperienceJourney.css'

// Companies without a real logo asset fall back to a monogram badge.
const COMPANY_LOGOS = {
  'Azal Telecommunications': azalLogo,
  'Koinoti Nav': kitLogo,
  'Milli Eats': milliLogo,
  TechnoHub: technohubLogo,
  'TAG Marketeer Agency': tagLogo,
  'Founders School Bootcamp': foundersLogo,
}

function monogram(company) {
  const words = company.split(/[\s-]+/).filter(Boolean)
  const letters = words.length > 1 ? words.slice(0, 2).map((w) => w[0]) : words[0].slice(0, 2)
  return (Array.isArray(letters) ? letters.join('') : letters).toUpperCase()
}

function JourneyLogo({ company }) {
  const src = COMPANY_LOGOS[company]
  if (src) {
    return (
      <span className="journey-logo">
        <img src={src} alt={`${company} logo`} loading="lazy" />
      </span>
    )
  }
  return (
    <span className="journey-logo journey-logo--monogram" aria-hidden="true">
      {monogram(company)}
    </span>
  )
}

function ExperienceJourney() {
  const wrapperRef = useRef(null)
  const pathRef = useRef(null)
  const nodeRefs = useRef([])
  const [expanded, setExpanded] = useState(() => new Set())
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })

  function toggle(index) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // Draw a smooth vertical bezier through every node dot. Re-measured on any
  // wrapper resize (viewport changes, card expand/collapse) so the curve
  // always hugs the cards.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    const path = pathRef.current
    if (!wrapper || !path) return

    function redraw() {
      const rect = wrapper.getBoundingClientRect()
      const points = nodeRefs.current
        .filter(Boolean)
        .map((node) => {
          const r = node.getBoundingClientRect()
          return {
            x: r.left + r.width / 2 - rect.left,
            y: r.top + r.height / 2 - rect.top,
          }
        })
      if (points.length < 2) return

      let d = `M ${points[0].x} 0 L ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]
        const b = points[i]
        const midY = (a.y + b.y) / 2
        d += ` C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`
      }
      const last = points[points.length - 1]
      d += ` L ${last.x} ${rect.height}`

      path.setAttribute('d', d)
      setSvgSize({ w: Math.round(rect.width), h: Math.round(rect.height) })
    }

    redraw()
    const observer = new ResizeObserver(redraw)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [expanded])

  // Reveal cards as they scroll into view.
  useLayoutEffect(() => {
    const items = wrapperRef.current?.querySelectorAll('.journey-item')
    if (!items) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05 }
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="journey" ref={wrapperRef}>
      <svg
        className="journey-curve"
        width={svgSize.w}
        height={svgSize.h}
        viewBox={`0 0 ${svgSize.w || 1} ${svgSize.h || 1}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="journeyStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
        </defs>
        <path ref={pathRef} fill="none" stroke="url(#journeyStroke)" strokeWidth="2" />
      </svg>

      {experience.map((exp, i) => {
        const isOpen = expanded.has(i)
        const side = i % 2 === 0 ? 'left' : 'right'
        return (
          <div className={`journey-item journey-item--${side}`} key={exp.company + exp.date}>
            <span
              className="journey-node"
              ref={(el) => {
                nodeRefs.current[i] = el
              }}
            />
            <div className={`journey-card${isOpen ? ' is-open' : ''}`}>
              <div className="journey-card-head">
                <JourneyLogo company={exp.company} />
                <div className="journey-card-meta">
                  <span className="journey-date">{exp.date}</span>
                  <h3 className="journey-title">{exp.title}</h3>
                  <span className="journey-company">{exp.company}</span>
                </div>
                <button
                  type="button"
                  className="journey-expand"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? `Collapse ${exp.company} details` : `Expand ${exp.company} details`}
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
              </div>
              <div className="journey-card-body">
                <div className="journey-card-body-inner">
                  <p className="journey-desc">{exp.desc}</p>
                  <ul className="journey-achievements">
                    {exp.bullets.map(([label, text]) => (
                      <li key={label}>
                        <span className="achievement-label">{label}</span> {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ExperienceJourney
