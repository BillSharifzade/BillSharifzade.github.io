import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import CvFormatDialog from './CvFormatDialog.jsx'
import mainAvatar from '../assets/main_img.webp'
import { CONTACT_APPS, SITE_APPS } from '../data/contactApps.js'
import { useOnScreen } from '../hooks/useOnScreen.js'
import './ContactDevice.css'

/**
 * ContactDevice — the contact section as a phone.
 *
 * A static, pure-CSS iPhone mockup whose home screen holds one app per contact
 * channel. Tapping an app plays the iOS open-zoom out of its icon, then the
 * real link fires (new tab, mailto:, or an in-page action for the dock). The
 * hardware buttons behave like Xcode's simulator bezel: volume shows the HUD,
 * the action button toggles silent mode in the Dynamic Island, the side button
 * sleeps/wakes (hold it for Siri), and Camera Control admits it has no camera.
 *
 * Sized in "logical points" via the --px unit (see ContactDevice.css) so the
 * whole device scales with its container without any JS measurement. The only
 * measuring happens on tap, to zoom the app out of exactly where its icon is.
 */

const OPEN_MS = 480
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
const HUD_MS = 1500
const HOLD_MS = 550
const VOLUME_STEPS = 16

// The phone lives in Dushanbe, so its clock does too.
function dushanbe(opts) {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dushanbe', ...opts })
  } catch {
    return new Intl.DateTimeFormat('en-GB', opts)
  }
}
const fmtTime = dushanbe({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const fmtDate = dushanbe({ weekday: 'long', day: 'numeric', month: 'long' })

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

// Ticks on the minute, and only while the phone is actually on screen.
function useClock(active) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!active) return
    let id
    const tick = () => {
      setNow(new Date())
      id = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50)
    }
    tick()
    return () => window.clearTimeout(id)
  }, [active])
  return now
}

function Glyph({ glyph, size }) {
  const pct = `${Math.round(size * 100)}%`
  return (
    <svg viewBox={glyph.viewBox} style={{ width: pct, height: pct }} aria-hidden="true" focusable="false">
      <path d={glyph.path} />
    </svg>
  )
}

function Tile({ app }) {
  return (
    <span className="cd-tile" style={{ '--tile': app.tile, '--fg': app.fg ?? '#fff' }}>
      <Glyph glyph={app.glyph} size={app.glyphSize} />
    </span>
  )
}

function AppIcon({ app, onOpen }) {
  const onClick = (e) => {
    // Modifier clicks keep their native "open in a new tab" meaning.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onOpen(app, e.currentTarget)
  }
  const label = app.handle ? `${app.name} — ${app.handle}` : app.name
  const body = (
    <>
      <Tile app={app} />
      <span className="cd-app-label">{app.name}</span>
    </>
  )
  if (app.href) {
    return (
      <a
        className="cd-app"
        href={app.href}
        aria-label={label}
        onClick={onClick}
        draggable={false}
        {...(app.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {body}
      </a>
    )
  }
  return (
    <button type="button" className="cd-app" aria-label={label} onClick={onClick}>
      {body}
    </button>
  )
}

function StatusBar({ time }) {
  return (
    <div className="cd-status" aria-hidden="true">
      <span className="cd-status-time">{time}</span>
      <span className="cd-status-icons">
        <svg className="cd-cell" viewBox="0 0 20 12">
          <rect y="8" width="3.6" height="4" rx=".9" />
          <rect x="5.5" y="5.5" width="3.6" height="6.5" rx=".9" />
          <rect x="11" y="3" width="3.6" height="9" rx=".9" />
          <rect x="16.4" width="3.6" height="12" rx=".9" />
        </svg>
        <Icon name="wifi" />
        <svg className="cd-batt" viewBox="0 0 28 13">
          <rect x=".5" y=".5" width="24" height="12" rx="3.8" fill="none" stroke="currentColor" strokeOpacity=".4" />
          <path d="M26 4.2v4.6a2.4 2.4 0 0 0 0-4.6z" fillOpacity=".4" />
          <rect x="2" y="2" width="21" height="9" rx="2.3" />
        </svg>
      </span>
    </div>
  )
}

const FLASHLIGHT = 'M8 2h8a1 1 0 0 1 1 1v3.2a1 1 0 0 1-.2.6L15 9.4V21a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V9.4L7.2 6.8A1 1 0 0 1 7 6.2V3a1 1 0 0 1 1-1zm4 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'

export default function ContactDevice({ onNavigate }) {
  const rootRef = useRef(null)
  const screenRef = useRef(null)
  const uiRef = useRef(null)
  const layerRef = useRef(null)
  const heroRef = useRef(null)
  const animsRef = useRef([])
  const closingRef = useRef(false)
  const timersRef = useRef({})
  const holdRef = useRef({ timer: 0, held: false })
  const fireRef = useRef(() => {})

  const onScreen = useOnScreen(rootRef)
  const reduced = useReducedMotion()
  const now = useClock(onScreen)
  const timeText = fmtTime.format(now)

  const [screen, setScreen] = useState('home') // 'home' | 'lock' | 'off'
  const [launch, setLaunch] = useState(null) // { app, from, el } while an app is open
  const [phase, setPhase] = useState('enter') // 'enter' | 'open' | 'exit'
  const [silent, setSilent] = useState(false)
  const [torch, setTorch] = useState(false)
  const [volume, setVolume] = useState(11)
  const [volumeHud, setVolumeHud] = useState(false)
  const [islandHud, setIslandHud] = useState(null) // 'silent' | 'ring' | 'camera' | 'siri'
  const [cvOpen, setCvOpen] = useState(false)
  const [announce, setAnnounce] = useState('')

  const later = useCallback((key, fn, ms) => {
    window.clearTimeout(timersRef.current[key])
    timersRef.current[key] = window.setTimeout(fn, ms)
  }, [])
  useEffect(() => {
    const timers = timersRef.current
    return () => Object.values(timers).forEach((t) => window.clearTimeout(t))
  }, [])

  const flashIsland = useCallback(
    (kind, ms = HUD_MS + 300) => {
      setIslandHud(kind)
      later('island', () => setIslandHud(null), ms)
    },
    [later]
  )

  // ---- the opened app -----------------------------------------------------

  const goHome = useCallback(() => {
    const anims = animsRef.current
    if (!anims.length || closingRef.current) return
    closingRef.current = true
    setPhase('exit')
    anims.forEach((a) => a.reverse())
    Promise.all(anims.map((a) => a.finished))
      .then(() => {
        anims.forEach((a) => a.cancel())
        animsRef.current = []
        closingRef.current = false
        setLaunch((l) => {
          // Hand keyboard focus back to the icon that launched the app.
          if (l?.el && document.activeElement === document.body) l.el.focus({ preventScroll: true })
          return null
        })
        setPhase('enter')
      })
      .catch(() => {
        closingRef.current = false
      })
  }, [])

  const cancelLaunch = useCallback(() => {
    animsRef.current.forEach((a) => a.cancel())
    animsRef.current = []
    closingRef.current = false
    setLaunch(null)
    setPhase('enter')
  }, [])

  const fire = useCallback(
    (app) => {
      if (app.href) {
        if (app.external) {
          window.open(app.href, '_blank', 'noopener,noreferrer')
        } else {
          window.location.href = app.href // mailto: — the page stays put
          later('home', goHome, 1400)
        }
      } else if (app.action === 'cv') {
        setCvOpen(true)
      } else if (app.scrollTo) {
        onNavigate?.(app.scrollTo)
        later('home', goHome, 900)
      }
    },
    [goHome, later, onNavigate]
  )
  useEffect(() => {
    fireRef.current = fire
  }, [fire])

  const openApp = useCallback(
    (app, el) => {
      if (launch || screen !== 'home') return
      const tile = el.querySelector('.cd-tile') ?? el
      const s = screenRef.current.getBoundingClientRect()
      const r = tile.getBoundingClientRect()
      setLaunch({ app, el, from: { top: r.top - s.top, left: r.left - s.left, w: r.width, h: r.height } })
      setPhase('enter')
      setAnnounce(`Opening ${app.name}`)
    },
    [launch, screen]
  )

  // The iOS open-zoom: the app layer is clipped to the icon's rectangle and
  // grows to fill the screen, the hero glyph travels from the icon's centre,
  // and the home screen recedes. The link fires when the zoom lands. Reversing
  // the same three animations plays the close.
  useLayoutEffect(() => {
    if (!launch) return
    const screenEl = screenRef.current
    const layer = layerRef.current
    const hero = heroRef.current
    const ui = uiRef.current
    if (!screenEl || !layer || !hero || !ui || typeof layer.animate !== 'function') {
      setPhase('open')
      fireRef.current(launch.app)
      return
    }
    const s = screenEl.getBoundingClientRect()
    const { from } = launch
    const radius = parseFloat(getComputedStyle(screenEl).borderTopLeftRadius) || 0
    const startClip = `inset(${from.top}px ${s.width - from.left - from.w}px ${s.height - from.top - from.h}px ${from.left}px round ${from.w * 0.225}px)`
    const endClip = `inset(0px round ${radius}px)`
    const h = hero.getBoundingClientRect()
    const dx = from.left + from.w / 2 - (h.left - s.left + h.width / 2)
    const dy = from.top + from.h / 2 - (h.top - s.top + h.height / 2)
    const opts = { duration: reduced ? 0 : OPEN_MS, easing: EASE, fill: 'both' }
    const anims = [
      layer.animate([{ clipPath: startClip }, { clipPath: endClip }], opts),
      hero.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${from.w / h.width})` }, { transform: 'none' }],
        opts
      ),
      ui.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(1.08)', opacity: 0 }], opts),
    ]
    animsRef.current = anims
    closingRef.current = false
    anims[0].finished
      .then(() => {
        if (closingRef.current || anims[0].playbackRate < 0) return
        setPhase('open')
        fireRef.current(launch.app)
      })
      .catch(() => {})
    return () => {
      anims.forEach((a) => a.cancel())
      animsRef.current = []
    }
  }, [launch, reduced])

  // Coming back to this tab after the link opened elsewhere returns to the
  // home screen, the way a phone does when you switch back.
  useEffect(() => {
    if (!launch?.app.external || phase !== 'open') return
    const onVisible = () => {
      if (!document.hidden) later('home', goHome, 250)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [launch, phase, later, goHome])

  // ---- hardware buttons ---------------------------------------------------

  const sleep = useCallback(() => {
    cancelLaunch()
    setScreen('off')
    setIslandHud(null)
    setVolumeHud(false)
    setTorch(false)
    setAnnounce('Screen off')
  }, [cancelLaunch])

  const wake = useCallback(() => {
    setScreen('lock')
    setAnnounce('Lock screen')
  }, [])

  // Side button: tap sleeps or wakes; holding it summons Siri, which iOS 27
  // shows as an orb inside the Dynamic Island. Pointer events arm the hold,
  // the click (which also serves keyboards and assistive tech) does the tap.
  const sideDown = () => {
    holdRef.current.held = false
    window.clearTimeout(holdRef.current.timer)
    holdRef.current.timer = window.setTimeout(() => {
      holdRef.current.held = true
      setScreen((s) => (s === 'off' ? 'lock' : s))
      flashIsland('siri', 2600)
      setAnnounce('Siri listening')
    }, HOLD_MS)
  }
  const sideCancel = () => window.clearTimeout(holdRef.current.timer)
  const sideClick = () => {
    window.clearTimeout(holdRef.current.timer)
    if (holdRef.current.held) {
      holdRef.current.held = false
      return
    }
    if (screen === 'off') wake()
    else sleep()
  }

  const pressVolume = (dir) => {
    if (screen === 'off') return
    const next = Math.min(VOLUME_STEPS, Math.max(0, volume + dir))
    setVolume(next)
    setVolumeHud(true)
    later('volume', () => setVolumeHud(false), HUD_MS)
    setAnnounce(`Volume ${next} of ${VOLUME_STEPS}`)
  }

  const pressAction = () => {
    if (screen === 'off') return
    const next = !silent
    setSilent(next)
    flashIsland(next ? 'silent' : 'ring')
    setAnnounce(next ? 'Silent mode on' : 'Silent mode off')
  }

  const pressCamera = () => {
    if (screen === 'off') return
    flashIsland('camera')
    setAnnounce('Camera is not available on this mockup')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && launch) goHome()
  }

  const app = launch?.app

  return (
    <div className="cd-root" ref={rootRef} onKeyDown={onKeyDown}>
      <div className="cd-phone" role="group" aria-label="Interactive phone: contact apps and hardware buttons">
        <button
          type="button"
          className="cd-btn cd-btn--left cd-btn--action"
          aria-label={silent ? 'Action button: silent mode on' : 'Action button: ring mode'}
          aria-pressed={silent}
          onClick={pressAction}
        />
        <button type="button" className="cd-btn cd-btn--left cd-btn--vol-up" aria-label="Volume up" onClick={() => pressVolume(1)} />
        <button type="button" className="cd-btn cd-btn--left cd-btn--vol-down" aria-label="Volume down" onClick={() => pressVolume(-1)} />
        <button
          type="button"
          className="cd-btn cd-btn--right cd-btn--side"
          aria-label={screen === 'off' ? 'Side button: wake the screen' : 'Side button: sleep. Hold for Siri'}
          onPointerDown={sideDown}
          onPointerUp={sideCancel}
          onPointerLeave={sideCancel}
          onPointerCancel={sideCancel}
          onClick={sideClick}
        />
        <button type="button" className="cd-btn cd-btn--right cd-btn--camera" aria-label="Camera Control" onClick={pressCamera} />
        <span className="cd-antenna cd-antenna--l cd-antenna--top" aria-hidden="true" />
        <span className="cd-antenna cd-antenna--r cd-antenna--top" aria-hidden="true" />
        <span className="cd-antenna cd-antenna--l cd-antenna--bottom" aria-hidden="true" />
        <span className="cd-antenna cd-antenna--r cd-antenna--bottom" aria-hidden="true" />

        <div className="cd-bezel" aria-hidden="true" />

        <div className="cd-screen" ref={screenRef} data-screen={screen}>
          <div className="cd-ui" ref={uiRef} inert={screen !== 'home' || Boolean(launch)}>
            <div className="cd-wall" aria-hidden="true" />

            <div className="cd-widget cd-glass">
              <div className="cd-widget-me">
                <img
                  className="cd-avatar"
                  src={mainAvatar}
                  alt=""
                  width="46"
                  height="46"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                <span className="cd-widget-text">
                  <span className="cd-widget-name">Sharifzoda Bilol</span>
                  <span className="cd-widget-role">Backend Architect</span>
                </span>
              </div>
              <div className="cd-widget-side">
                <span className="cd-widget-time">{timeText}</span>
                <span className="cd-widget-place">Dushanbe · GMT+5</span>
                <span className="cd-widget-status">
                  <i /> Online
                </span>
              </div>
            </div>

            <div className="cd-apps">
              {CONTACT_APPS.map((a) => (
                <AppIcon key={a.id} app={a} onOpen={openApp} />
              ))}
            </div>

            <div className="cd-search cd-glass" aria-hidden="true">
              <svg viewBox="0 0 20 20" focusable="false">
                <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
                <path d="M13 13l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              Search
            </div>

            <div className="cd-dock cd-glass cd-glass--clear">
              {SITE_APPS.map((a) => (
                <AppIcon key={a.id} app={a} onOpen={openApp} />
              ))}
            </div>
          </div>

          <div className="cd-lock cd-wall" inert={screen !== 'lock'}>
            <button type="button" className="cd-lock-tap" aria-label="Unlock" onClick={() => setScreen('home')} />
            <Icon name="lock" className="cd-lock-icon" />
            <span className="cd-lock-date">{fmtDate.format(now)}</span>
            <span className="cd-lock-time">{timeText}</span>
            <button
              type="button"
              className={`cd-lock-btn cd-lock-btn--torch cd-glass${torch ? ' is-on' : ''}`}
              aria-label="Flashlight"
              aria-pressed={torch}
              onClick={() => setTorch((t) => !t)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d={FLASHLIGHT} />
              </svg>
            </button>
            <button type="button" className="cd-lock-btn cd-lock-btn--camera cd-glass" aria-label="Camera" onClick={pressCamera}>
              <Icon name="camera" />
            </button>
            <span className="cd-lock-hint">Tap to unlock</span>
          </div>

          {launch && (
            <div
              className="cd-applayer"
              ref={layerRef}
              data-phase={phase}
              style={{ '--splash': app.splash ?? app.tile, '--tile': app.tile, '--fg': app.fg ?? '#fff' }}
            >
              <div className={`cd-hero${app.keepTile ? ' cd-hero--keep' : ''}`} ref={heroRef}>
                <Glyph glyph={app.glyph} size={app.glyphSize} />
              </div>
              <div className="cd-app-info">
                <span className="cd-app-name">{app.name}</span>
                {app.handle && <span className="cd-app-handle">{app.handle}</span>}
                {app.href ? (
                  <a
                    className="cd-app-cta cd-glass"
                    href={app.href}
                    {...(app.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    Open {app.name}
                  </a>
                ) : (
                  <button type="button" className="cd-app-cta cd-glass" onClick={() => fire(app)}>
                    Open {app.name}
                  </button>
                )}
              </div>
            </div>
          )}

          <StatusBar time={timeText} />

          <div className="cd-island" data-hud={islandHud ?? undefined} aria-hidden="true">
            <span className="cd-island-cam" />
            <span className="cd-island-hud">
              {islandHud === 'silent' && (
                <>
                  <Icon name="bell-slash" className="cd-hud-icon cd-hud-icon--silent" />
                  <span>Silent</span>
                </>
              )}
              {islandHud === 'ring' && (
                <>
                  <Icon name="bell" className="cd-hud-icon" />
                  <span>Ring</span>
                </>
              )}
              {islandHud === 'camera' && (
                <>
                  <Icon name="camera" className="cd-hud-icon" />
                  <span>Camera unavailable</span>
                </>
              )}
              {islandHud === 'siri' && (
                <>
                  <span className="cd-siri-orb" />
                  <span className="cd-siri-wave">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                </>
              )}
            </span>
          </div>

          <div
            className="cd-volhud"
            data-show={volumeHud || undefined}
            aria-hidden="true"
            style={{ '--vol': `${(volume / VOLUME_STEPS) * 100}%` }}
          >
            <span className="cd-volhud-track cd-glass">
              <span className="cd-volhud-fill" />
            </span>
            <Icon name={volume === 0 ? 'volume-xmark' : 'volume-high'} className="cd-volhud-icon" />
          </div>

          <button type="button" className="cd-homebar" aria-label="Home" onClick={goHome} inert={!launch} />
          {screen === 'off' && <button type="button" className="cd-sleep" aria-label="Wake the screen" onClick={wake} />}
          <div className="cd-glare" aria-hidden="true" />
        </div>
      </div>

      <p className="cd-caption">Tap an app to reach me — the side buttons work too.</p>
      <span className="sr-only" aria-live="polite">{announce}</span>
      <CvFormatDialog
        open={cvOpen}
        onClose={() => {
          setCvOpen(false)
          goHome()
        }}
      />
    </div>
  )
}
