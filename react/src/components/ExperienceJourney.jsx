import { useLayoutEffect, useRef, useState } from 'react'
import { experience } from '../data/cv.js'
import azalLogo from '../assets/azal_telecom.png'
import kitLogo from '../assets/kit.webp'
import milliLogo from '../assets/milli.png'
import technohubLogo from '../assets/technohub.png'
import tagLogo from '../assets/tag.png'
import foundersLogo from '../assets/founder_school.png'
import Icon from './Icon.jsx'
import './ExperienceJourney.css'

const COMPANY_LOGOS = {
  'Azal Telecommunications': azalLogo,
  'Koinoti Nav': kitLogo,
  'Milli Eats': milliLogo,
  TechnoHub: technohubLogo,
  'TAG Marketeer Agency': tagLogo,
  'Founders School Bootcamp': foundersLogo,
}

// An icon for each highlight, by its label in cv.js. The labels are shared
// with the CV exports, whose bullets are plain [label, text] pairs, so the
// icons live here, on the site's side.
const BULLET_ICONS = {
  'Corporate training': 'chalkboard-user',
  Architecture: 'sitemap',
  'International reach': 'globe',
  'Performance engineering': 'gauge-high',
  'Constrained environments': 'mobile-screen-button',
  'Product breadth': 'layer-group',
  Leadership: 'users',
  'Leadership growth': 'arrow-trend-up',
  'Business automation': 'gears',
  'HR automation': 'user-gear',
  'Secure platforms': 'shield-alt',
  'High-load design': 'server',
  'Realtime stack': 'bolt',
  'Throughput gains': 'gauge-high',
  Resilience: 'life-ring',
  'Regulatory reporting': 'scale-balanced',
  'Scoring models': 'chart-line',
  'Data intelligence': 'database',
  'Pattern discovery': 'magnifying-glass-chart',
  'Blockchain insight': 'cubes',
  'Enterprise enablement': 'building',
  'Curriculum leadership': 'graduation-cap',
  'Community impact': 'people-group',
}

const plain = (label) => label.replace(/:\s*$/, '')

function Block({ icon, label, children, className = '', order, as: Tag = 'div' }) {
  return (
    <Tag className={`journey-block${className ? ` ${className}` : ''}`} style={{ '--k': order }}>
      <span className="journey-block__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <div className="journey-block__body">
        <span className="journey-block__label">{label}</span>
        <p>{children}</p>
      </div>
    </Tag>
  )
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

// The curve through the timeline's nodes. Its size is state of its own: while a
// card opens, the observer resizes it every frame, and that should re-render
// the curve, not the six cards.
function JourneyCurve({ pathRef, sizeRef }) {
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    sizeRef.current = setSvgSize
    return () => {
      sizeRef.current = null
    }
  }, [sizeRef])
  return (
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
  )
}

function ExperienceJourney() {
  const wrapperRef = useRef(null)
  const pathRef = useRef(null)
  const nodeRefs = useRef([])
  const [expanded, setExpanded] = useState(() => new Set())
  const sizeRef = useRef(null)

  function toggle(index) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

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
      // A fresh object every ResizeObserver tick re-renders the whole timeline
      // even when nothing moved, and the render can feed the observer again.
      const next = { w: Math.round(rect.width), h: Math.round(rect.height) }
      sizeRef.current?.((prev) => (prev.w === next.w && prev.h === next.h ? prev : next))
    }

    redraw()
    const observer = new ResizeObserver(redraw)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [expanded])

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
      <JourneyCurve pathRef={pathRef} sizeRef={sizeRef} />

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
                  <Icon name="chevron-down" />
                </button>
              </div>
              <div className="journey-card-body">
                <div className="journey-card-body-inner">
                  <Block icon="briefcase" label="The role" className="journey-block--overview" order={0}>
                    {exp.desc}
                  </Block>
                  <ul className="journey-achievements">
                    {exp.bullets.map(([label, text], k) => (
                      <Block
                        key={label}
                        as="li"
                        icon={BULLET_ICONS[plain(label)] ?? 'circle-check'}
                        label={plain(label)}
                        order={k + 1}
                      >
                        {text}
                      </Block>
                    ))}
                  </ul>
                  {exp.summary && (
                    <Block
                      icon="seedling"
                      label="What it gave me"
                      className="journey-block--summary"
                      order={exp.bullets.length + 1}
                    >
                      {exp.summary}
                    </Block>
                  )}
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
