import { useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Icon from './Icon.jsx'
import ProjectImpact from './ProjectImpact.jsx'
import { projectImpact } from '../data/projectImpact.js'
import { liveSites } from '../data/liveSites.js'
import { usePauseHidden } from '../utils/usePauseOffscreen.js'
import './ProjectShowcase.css'

const GITHUB = 'github.com/BillSharifzade/'
const PROFILE = 'https://github.com/BillSharifzade'
const SITE_REPO = `${PROFILE}/BillSharifzade.github.io`

const host = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

// Logos come in every shape, from a square crest to a long wordmark. Giving
// each the same area, not the same height, makes them read as one size.
const LOGO_AREA = 2900
const logoHeight = ({ width, height, weight = 1 }) =>
  Math.round(Math.min(32, Math.max(15, weight * Math.sqrt((LOGO_AREA * height) / width))))

function Logos({ icons }) {
  return icons.map((t) => (
    <svg key={t.title} viewBox="0 0 24 24">
      <path d={t.path} />
    </svg>
  ))
}

// The window buttons' marks, drawn as strokes in a 10 × 10 box so each one
// sits on the button's centre (text glyphs ride on the font's baseline).
const MARKS = {
  close: 'M2.8 2.8l4.4 4.4M7.2 2.8L2.8 7.2',
  min: 'M2.2 5h5.6',
  max: 'M5 2.2v5.6M2.2 5h5.6',
  // Two corners pointing in, filled (see .pshow__ctl[aria-pressed]).
  restore: 'M4.3 4.3V1.4L1.4 4.3zM5.7 5.7v2.9l2.9-2.9z',
}

// What shows or hides a panel: the chosen project and the window buttons.
const PANEL_STATE = ['data-active', 'data-win', 'data-max']

const Mark = ({ d }) => (
  <svg viewBox="0 0 10 10" aria-hidden="true">
    <path d={MARKS[d]} />
  </svg>
)

/**
 * Selected projects as a repository browser: an index of repos on the left,
 * and on the right a window with the chosen one's screenshots, stack, summary
 * and link. The last entry opens a window of live sites instead.
 *
 * The window behaves like one. Close and minimise put it away until a project
 * is picked again, maximise gives it the whole width, and "Impact" turns its
 * body into a bento of what the project has done, at the same size.
 *
 * Switching only changes opacity and transforms, so it never lays the page
 * out again. Every panel stays rendered: the window keeps the height of the
 * tallest one, and screenshots are already decoded when their turn comes.
 * Inactive panels are `visibility: hidden`, which also takes them out of the
 * tab order and the accessibility tree. On phones the index goes away and
 * every project is its own card.
 */
export default function ProjectShowcase({ projects }) {
  const live = projects.length
  const [active, setActive] = useState(0)
  // open | min | closed: what the window buttons last did.
  const [win, setWin] = useState('open')
  const [max, setMax] = useState(false)
  // The panel showing its impact, and where the press came from.
  const [impact, setImpact] = useState(null)
  const tabRefs = useRef([])
  const impactRefs = useRef([])
  const backRef = useRef(null)
  const reopenRef = useRef(null)
  const dockRef = useRef(null)
  const rootRef = useRef(null)
  const uid = useId()
  usePauseHidden(rootRef, '.pshow__panel', PANEL_STATE)

  const select = (i, focus) => {
    if (i !== active) setImpact(null)
    setActive(i)
    setWin('open')
    if (focus) tabRefs.current[i]?.focus()
  }

  const onKeyDown = (e) => {
    const to = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: live }[e.key]
    if (to === undefined) return
    e.preventDefault()
    select(to < 0 ? live : to > live ? 0 : to, true)
  }

  // Maximise morphs the window where the browser can (a view transition),
  // and simply switches elsewhere.
  const toggleMax = () => {
    const swap = () => flushSync(() => setMax((m) => !m))
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (document.startViewTransition && !reduced) document.startViewTransition(swap)
    else swap()
  }

  const putAway = (state) => {
    if (max) setMax(false)
    setWin(state)
    // The button pressed is about to be hidden: move focus to what replaces it.
    requestAnimationFrame(() => (state === 'min' ? dockRef : reopenRef).current?.focus({ preventScroll: true }))
  }

  const openImpact = (i, e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setImpact({ index: i, open: true, origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  }

  const closeImpact = () => {
    const i = impact?.index
    setImpact((cur) => (cur ? { ...cur, open: false } : cur))
    // The button is inert until the project is back; focus it once it is.
    requestAnimationFrame(() => impactRefs.current[i]?.focus({ preventScroll: true }))
  }

  const chrome = (path, i) => (
    <div className="pshow__chrome">
      <span className="pshow__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {i === active && (
        <span className="pshow__ctls">
          <button type="button" className="pshow__ctl" aria-label="Close window" onClick={() => putAway('closed')}>
            <Mark d="close" />
          </button>
          <button type="button" className="pshow__ctl" aria-label="Minimise window" onClick={() => putAway('min')}>
            <Mark d="min" />
          </button>
          <button
            type="button"
            className="pshow__ctl"
            aria-label={max ? 'Restore window size' : 'Maximise window'}
            aria-pressed={max}
            onClick={toggleMax}
          >
            <Mark d={max ? 'restore' : 'max'} />
          </button>
        </span>
      )}
      <span className="pshow__path" aria-hidden="true">
        {path}
      </span>
    </div>
  )

  const current = projects[active]

  return (
    <div
      ref={rootRef}
      className="pshow"
      data-win={win}
      data-max={max ? '' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && max) toggleMax()
      }}
    >
      <aside className="pshow__side">
        <p className="pshow__prompt" aria-hidden="true">
          <span>~/projects</span> $ ls --sort=impact
        </p>
        <div className="pshow__index" role="tablist" aria-label="Projects" aria-orientation="vertical" onKeyDown={onKeyDown}>
          {[...projects, null].map((p, i) => (
            <button
              key={p ? p.repo : 'live'}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              aria-selected={i === active}
              aria-controls={`${uid}-panel-${i}`}
              tabIndex={i === active ? 0 : -1}
              className={`pshow__tab${p ? '' : ' pshow__tab--live'}`}
              onPointerEnter={(e) => {
                if (e.pointerType === 'mouse' && win === 'open') select(i)
              }}
              onFocus={() => {
                if (win === 'open') select(i)
              }}
              onClick={() => select(i)}
            >
              {p ? (
                <>
                  <span className="pshow__tab-repo">{p.repo}</span>
                  <span className="pshow__tab-name">{p.name}</span>
                  <span className="pshow__tab-icons" aria-hidden="true">
                    <Logos icons={p.icons} />
                  </span>
                </>
              ) : (
                <>
                  <span className="pshow__tab-repo">~/live</span>
                  <span className="pshow__tab-name">Live sites</span>
                  <span className="pshow__tab-count" aria-hidden="true">
                    <i /> {liveSites.length}+
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
        <div className="pshow__side-foot">
          <a className="pshow__side-link" href={current ? current.href : SITE_REPO} target="_blank" rel="noopener noreferrer">
            <span className="pshow__side-ico" aria-hidden="true">
              <Icon name="star" />
            </span>
            <span>
              Leave a star <small>{current ? current.repo : 'this site'}</small>
            </span>
          </a>
          <a className="pshow__side-link" href={`${PROFILE}?tab=repositories`} target="_blank" rel="noopener noreferrer">
            <span className="pshow__side-ico" aria-hidden="true">
              <Icon name="github" />
            </span>
            <span>
              All repositories <small>github.com/BillSharifzade</small>
            </span>
          </a>
        </div>
      </aside>

      <div className="pshow__stage">
        {projects.map((p, i) => {
          const showing = impact?.index === i
          const cells = projectImpact[p.repo]
          return (
            <article
              key={p.repo}
              id={`${uid}-panel-${i}`}
              role="tabpanel"
              aria-labelledby={`${uid}-tab-${i}`}
              className="pshow__panel"
              data-active={i === active ? '' : undefined}
              data-impact={showing && impact.open ? '' : undefined}
              inert={i === active && win !== 'open'}
            >
              {chrome(
                <>
                  {GITHUB}
                  <b>{p.repo}</b>
                  {showing && impact.open && <span className="pshow__path-tail">/impact</span>}
                </>,
                i
              )}
              <div className="pshow__body" inert={showing && impact.open}>
                <div
                  className={`pshow__shots${
                    p.images.some((img) => img.phone) ? ' pshow__shots--duo' : p.images.length > 1 ? ' pshow__shots--pair' : ''
                  }`}
                >
                  {p.images.map((img, k) => (
                    <img
                      key={img.src}
                      src={img.src}
                      className={img.phone ? 'pshow__shot--phone' : undefined}
                      alt={k === 0 ? `${p.name}: screenshot` : img.phone ? `${p.name} on a phone` : ''}
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
                  <div className="pshow__actions">
                    {cells && (
                      <button
                        ref={(el) => {
                          impactRefs.current[i] = el
                        }}
                        type="button"
                        className="pshow__impact"
                        aria-expanded={showing && impact.open}
                        onClick={(e) => openImpact(i, e)}
                      >
                        <Icon name="chart-line" /> Impact
                      </button>
                    )}
                    <a className="pshow__link" href={p.href} target="_blank" rel="noopener noreferrer">
                      <Icon name="github" /> Open {p.repo}
                    </a>
                    {p.site && (
                      <a className="pshow__link" href={p.site} target="_blank" rel="noopener noreferrer">
                        <Icon name="globe" /> Visit the site
                      </a>
                    )}
                  </div>
                </div>
              </div>
              {showing && cells && (
                <ProjectImpact
                  project={p}
                  cells={cells}
                  open={impact.open}
                  origin={impact.origin}
                  onClose={closeImpact}
                  backRef={backRef}
                />
              )}
            </article>
          )
        })}

        <article
          id={`${uid}-panel-${live}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${live}`}
          className="pshow__panel pshow__panel--live"
          data-active={active === live ? '' : undefined}
          inert={active === live && win !== 'open'}
        >
          {chrome(
            <>
              ~/live <span className="pshow__path-tail">— {liveSites.length} sites up, many more behind logins</span>
            </>,
            live
          )}
          <div className="plive">
            <p className="plive__head">
              <span className="plive__pulse" aria-hidden="true" /> Live now
            </p>
            <ul className="plive__list">
              {liveSites.map((site, k) => (
                <li key={site.url} style={{ '--k': k }}>
                  <a className="plive__site" href={site.url} target="_blank" rel="noopener noreferrer">
                    <span className="plive__brand">
                      <img
                        className="plive__logo"
                        src={site.logo.src}
                        alt={site.title}
                        width={site.logo.width}
                        height={site.logo.height}
                        style={{ height: logoHeight(site.logo) }}
                        loading="lazy"
                        decoding="async"
                      />
                      <em className="plive__kind">{site.kind}</em>
                    </span>
                    <span className="plive__blurb">{site.blurb}</span>
                    <span className="plive__host">
                      {host(site.url)} <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                </li>
              ))}
              <li className="plive__love" style={{ '--k': liveSites.length }}>
                <span className="plive__mono" aria-hidden="true">
                  <Icon name="heart" />
                </span>
                <span className="plive__text">
                  <span className="plive__title">
                    Romantic websites <em>for my future wife</em>
                  </span>
                  <span className="plive__blurb">An endless series, one for every occasion.</span>
                </span>
                <span className="plive__host plive__host--love" aria-label="infinitely many">
                  ∞
                </span>
              </li>
            </ul>
          </div>
        </article>

        {/* What the stage shows while the window is put away (desktop only). */}
        <div className="pshow__empty" inert={win !== 'closed'}>
          <p>
            <span>$</span> exit
          </p>
          <p className="pshow__empty-dim">[process {current ? current.repo : 'live'} exited]</p>
          <p className="pshow__empty-dim">Pick a project on the left, or</p>
          <button ref={reopenRef} type="button" className="pshow__reopen" onClick={() => setWin('open')}>
            <Icon name="rotate" /> Reopen {current ? current.repo : 'live sites'}
          </button>
        </div>
        <button
          ref={dockRef}
          type="button"
          className="pshow__dock"
          inert={win !== 'min'}
          onClick={() => setWin('open')}
        >
          <span className="pshow__dock-win" aria-hidden="true" />
          <span>
            {current ? current.repo : '~/live'} <small>minimised · click to restore</small>
          </span>
        </button>
      </div>
    </div>
  )
}
