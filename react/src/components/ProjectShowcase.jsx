import { useId, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import './ProjectShowcase.css'

const GITHUB = 'github.com/BillSharifzade/'

/**
 * Selected projects as a repository browser: an index of repos on the left,
 * and on the right a window with the chosen one's screenshots, stack, summary
 * and link. Picking a repo (hover, focus, click or the arrow keys) crossfades
 * the window while a scan line sweeps it.
 *
 * Switching only changes opacity and transforms, so it never lays the page
 * out again. Every panel stays rendered: the window keeps the height of the
 * tallest one, and screenshots are already decoded when their turn comes.
 * Inactive panels are `visibility: hidden`, which also takes them out of the
 * tab order and the accessibility tree. On phones the index goes away and
 * every project is its own card.
 */
export default function ProjectShowcase({ projects }) {
  const [active, setActive] = useState(0)
  const tabRefs = useRef([])
  const uid = useId()

  const select = (i, focus) => {
    setActive(i)
    if (focus) tabRefs.current[i]?.focus()
  }

  const onKeyDown = (e) => {
    const last = projects.length - 1
    const to = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: last }[e.key]
    if (to === undefined) return
    e.preventDefault()
    select(to < 0 ? last : to > last ? 0 : to, true)
  }

  return (
    <div className="pshow">
      <div className="pshow__index" role="tablist" aria-label="Projects" aria-orientation="vertical" onKeyDown={onKeyDown}>
        <p className="pshow__prompt" aria-hidden="true">
          <span>~/projects</span> $ ls
        </p>
        {projects.map((p, i) => (
          <button
            key={p.repo}
            ref={(el) => {
              tabRefs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${uid}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            className="pshow__tab"
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') select(i)
            }}
            onFocus={() => select(i)}
            onClick={() => select(i)}
          >
            <span className="pshow__tab-repo">{p.repo}</span>
            <span className="pshow__tab-name">{p.name}</span>
            <span className="pshow__tab-icons" aria-hidden="true">
              {p.icons.map((t) => (
                <svg key={t.title} viewBox="0 0 24 24">
                  <path d={t.path} />
                </svg>
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="pshow__stage">
        {projects.map((p, i) => (
          <article
            key={p.repo}
            id={`${uid}-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${i}`}
            className="pshow__panel"
            data-active={i === active ? '' : undefined}
          >
            <div className="pshow__chrome" aria-hidden="true">
              <span className="pshow__dots">
                <i />
                <i />
                <i />
              </span>
              <span className="pshow__path">
                {GITHUB}
                <b>{p.repo}</b>
              </span>
            </div>
            <div className={`pshow__shots${p.images.length > 1 ? ' pshow__shots--pair' : ''}`}>
              {p.images.map((src, k) => (
                <img
                  key={src}
                  src={src}
                  alt={k === 0 ? `${p.name}: screenshot` : ''}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              ))}
              {/* Restarts with each new project, since the panel re-matches [data-active]. */}
              <span className="pshow__scan" aria-hidden="true" />
            </div>
            <div className="pshow__info">
              <h3 className="pshow__title">{p.name}</h3>
              <p className="pshow__stack">{p.stack}</p>
              <p className="pshow__blurb">{p.blurb}</p>
              <ul className="pshow__tech" aria-label="Built with">
                {p.icons.map((t) => (
                  <li key={t.title}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d={t.path} />
                    </svg>
                    {t.title}
                  </li>
                ))}
              </ul>
              <a className="pshow__link" href={p.href} target="_blank" rel="noopener noreferrer">
                <Icon name="github" /> Open {p.repo}
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
