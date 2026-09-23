import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Icon from './Icon.jsx'
import CvFormatDialog from './CvFormatDialog.jsx'
import { CONTACT_APPS, DOCK_APPS } from '../data/contactApps.js'
import { useOnScreen } from '../hooks/useOnScreen.js'
import { clamp, useSwipe } from './deviceGestures.js'
import { Avatar, BatteryIcon, CellIcon, FLASHLIGHT, Glyph, Tile } from './ContactDeviceBits.jsx'
import { AppScreen } from './ContactDeviceApps.jsx'
import { AppSwitcher, ControlCenter, NotificationCenter } from './ContactDevicePanels.jsx'
import './ContactDevice.css'
import './ContactDevicePanels.css'

/**
 * ContactDevice — the contact section as a phone.
 *
 * A static, pure-CSS iPhone mockup running a black-and-white, iOS 27-style
 * home screen. Each contact channel is an app that opens inside the phone
 * (Mail composes a real mailto, the chats and profiles link out); the dock
 * holds shortcuts that act on the page instead. Pull down from the status bar
 * for Notification Center (left) or Control Center (right); the home bar goes
 * home on a swipe and opens the App Switcher on a swipe-and-hold or long-press.
 *
 * The hardware buttons behave like Xcode's simulator bezel: volume shows the
 * HUD, the action button toggles silent mode in the Dynamic Island, the side
 * button sleeps/wakes (hold it for Siri), Camera Control admits it has no
 * camera.
 *
 * Sized in "logical points" via the --px unit (see ContactDevice.css) so the
 * whole device scales with its container without JS measurement. The only
 * measuring happens on tap, to zoom an app out of exactly where its icon is.
 */

const OPEN_MS = 480
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'
const HUD_MS = 1500
const HOLD_MS = 550
const VOLUME_STEP = 100 / 16 // the hardware buttons step in sixteenths
const PULL_OPEN = 70
const SWIPE_HOME = 40
const RECENTS_MAX = 5

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

function AppIcon({ app, onOpen }) {
  const onClick = (e) => {
    // Modifier clicks keep their native "open in a new tab" meaning.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    onOpen(app, e.currentTarget.querySelector('.cd-tile'))
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

export default function ContactDevice({ onNavigate }) {
  const rootRef = useRef(null)
  const screenRef = useRef(null)
  const uiRef = useRef(null)
  const layerRef = useRef(null)
  const heroRef = useRef(null)
  const viewRef = useRef(null)
  const ccRef = useRef(null)
  const ncRef = useRef(null)
  const animsRef = useRef([])
  const closingRef = useRef(false)
  const linkedRef = useRef(false)
  const timersRef = useRef({})
  const holdRef = useRef({ timer: 0, held: false })
  const railRef = useRef(null)
  const railDragRef = useRef(null)
  const fireRef = useRef(() => {})
  const openRef = useRef(() => {})

  const onScreen = useOnScreen(rootRef)
  const reduced = useReducedMotion()
  const now = useClock(onScreen)
  const timeText = fmtTime.format(now)
  const dateText = fmtDate.format(now)

  const [screen, setScreen] = useState('home') // 'home' | 'lock' | 'off'
  const [launch, setLaunch] = useState(null) // { app, from, el } while an app is open
  const [phase, setPhase] = useState('enter') // 'enter' | 'open' | 'exit'
  const [panel, setPanel] = useState(null) // 'notes' | 'control'
  const [switcher, setSwitcher] = useState(false)
  const [recents, setRecents] = useState([])
  const [notes, setNotes] = useState(() => CONTACT_APPS.map((a) => a.id))
  const [cc, setCc] = useState({
    airplane: false,
    cellular: true,
    wifi: true,
    bluetooth: true,
    rotation: false,
    mirror: false,
    focus: false,
    playing: false,
  })
  const [brightness, setBrightness] = useState(85) // 0–100
  const [silent, setSilent] = useState(false)
  const [torch, setTorch] = useState(false)
  const [volume, setVolume] = useState(69) // 0–100
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
    linkedRef.current = false
    setPhase('exit')
    anims.forEach((a) => a.reverse())
    Promise.all(anims.map((a) => a.finished))
      .then(() => {
        // The reversed animations keep holding their end frames (app clipped
        // to its icon, home screen fully visible) until the layer is gone —
        // the layout effect's cleanup cancels them on unmount. Cancelling
        // here first would paint one frame of the open app, and this runs
        // from a promise, so the removal is flushed synchronously too.
        animsRef.current = []
        closingRef.current = false
        flushSync(() => {
          setLaunch((l) => {
            // Hand keyboard focus back to the icon that launched the app.
            if (l?.el?.isConnected && document.activeElement === document.body) {
              const focusable = l.el.closest('a, button') ?? l.el
              focusable.focus?.({ preventScroll: true })
            }
            return null
          })
          setPhase('enter')
        })
      })
      .catch(() => {
        closingRef.current = false
      })
  }, [])

  const cancelLaunch = useCallback(() => {
    animsRef.current.forEach((a) => a.cancel())
    animsRef.current = []
    closingRef.current = false
    linkedRef.current = false
    setLaunch(null)
    setPhase('enter')
  }, [])

  // Dock apps act on the page once their zoom lands.
  const fire = useCallback(
    (app) => {
      if (app.action === 'cv') {
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
    (app, originEl) => {
      if (launch || screen !== 'home' || !originEl) return
      const s = screenRef.current.getBoundingClientRect()
      const r = originEl.getBoundingClientRect()
      linkedRef.current = false
      setLaunch({ app, el: originEl, from: { top: r.top - s.top, left: r.left - s.left, w: r.width, h: r.height } })
      setPhase('enter')
      if (app.kind === 'contact') {
        setRecents((ids) => [app.id, ...ids.filter((id) => id !== app.id)].slice(0, RECENTS_MAX))
      }
      setAnnounce(`Opening ${app.name}`)
    },
    [launch, screen]
  )
  useEffect(() => {
    openRef.current = openApp
  }, [openApp])

  // The iOS open-zoom: the app layer is clipped to the icon's rectangle and
  // grows to fill the screen, the hero glyph travels from the icon's centre
  // and hands over to the app's screen, and the home screen recedes. The same
  // animations play backwards for the close, and the home-bar swipe scrubs
  // them.
  useLayoutEffect(() => {
    if (!launch) return
    const screenEl = screenRef.current
    const layer = layerRef.current
    const hero = heroRef.current
    const ui = uiRef.current
    const view = viewRef.current
    if (!screenEl || !layer || !hero || !ui || typeof layer.animate !== 'function') {
      setPhase('open')
      if (launch.app.kind === 'dock') fireRef.current(launch.app)
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
    const heroFrom = `translate(${dx}px, ${dy}px) scale(${from.w / h.width})`
    const opts = { duration: reduced ? 0 : OPEN_MS, easing: EASE, fill: 'both' }
    const anims = [
      layer.animate([{ clipPath: startClip }, { clipPath: endClip }], opts),
      hero.animate(
        view
          ? [{ transform: heroFrom, opacity: 1 }, { opacity: 1, offset: 0.55 }, { transform: 'none', opacity: 0 }]
          : [{ transform: heroFrom }, { transform: 'none' }],
        opts
      ),
      ui.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(1.08)', opacity: 0 }], opts),
    ]
    if (view) anims.push(view.animate([{ opacity: 0 }, { opacity: 0, offset: 0.3 }, { opacity: 1 }], opts))
    animsRef.current = anims
    closingRef.current = false
    anims[0].finished
      .then(() => {
        if (closingRef.current || anims[0].playbackRate < 0) return
        setPhase('open')
        if (launch.app.kind === 'dock') fireRef.current(launch.app)
      })
      .catch(() => {})
    return () => {
      anims.forEach((a) => a.cancel())
      animsRef.current = []
    }
  }, [launch, reduced])

  // Coming back to this tab after following a link returns to the home
  // screen, the way a phone does when you switch back to it.
  useEffect(() => {
    if (!launch || phase !== 'open') return
    const onVisible = () => {
      if (!document.hidden && linkedRef.current) later('home', goHome, 250)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [launch, phase, later, goHome])

  const onLink = (e) => {
    linkedRef.current = true
    const href = e.currentTarget.getAttribute('href') ?? ''
    // mailto: hands off to the mail client without leaving the page.
    if (href.startsWith('mailto:')) later('home', goHome, 1400)
  }

  // ---- overlays: panels, switcher, home bar --------------------------------

  const homeTap = () => {
    if (panel) setPanel(null)
    else if (switcher) setSwitcher(false)
    else if (launch) goHome()
  }

  const openSwitcher = () => {
    if (screen !== 'home' || !recents.length) return
    if (launch) cancelLaunch()
    setPanel(null)
    setSwitcher(true)
    setAnnounce('App Switcher')
  }

  // Chrome keeps the previously snapped card when a newer one is prepended,
  // which would open the switcher scrolled past it. Always start at the newest.
  useEffect(() => {
    if (switcher) railRef.current?.scrollTo({ left: 0 })
  }, [switcher])

  const reopen = (app, cardEl) => {
    setSwitcher(false)
    openApp(app, cardEl)
  }

  const dismissRecent = (id) => {
    const next = recents.filter((x) => x !== id)
    setRecents(next)
    if (!next.length) setSwitcher(false)
  }

  const openFromNote = (app, tileEl) => {
    setPanel(null)
    later('open', () => openRef.current(app, tileEl), 200)
  }

  // Pull a panel down from the status bar. While dragging, the panel follows
  // the pointer; on release the CSS transition takes it the rest of the way.
  const panelEl = (kind) => (kind === 'control' ? ccRef : ncRef).current
  const previewPanel = (kind, dy) => {
    if (panel || screen !== 'home') return
    const el = panelEl(kind)
    if (!el) return
    el.style.transition = 'none'
    el.style.visibility = 'visible'
    el.style.transform = `translateY(calc(-100% + ${Math.max(0, dy)}px))`
  }
  const settlePanel = (kind, r) => {
    const el = panelEl(kind)
    if (el) {
      el.style.transition = ''
      el.style.transform = ''
      el.style.visibility = ''
    }
    if (screen !== 'home' || r.cancelled || r.held) return
    if (r.tap || r.dy > PULL_OPEN) {
      setSwitcher(false)
      setPanel(kind)
      setAnnounce(kind === 'control' ? 'Control Center' : 'Notification Center')
    }
  }
  const pullNotes = useSwipe({ onMove: (dx, dy) => previewPanel('notes', dy), onEnd: (r) => settlePanel('notes', r) })
  const pullControl = useSwipe({ onMove: (dx, dy) => previewPanel('control', dy), onEnd: (r) => settlePanel('control', r) })

  // Push an open panel back up.
  const panelSwipe = useSwipe(
    {
      onMove: (dx, dy) => {
        const el = panel && panelEl(panel)
        if (!el || dy > 0) return
        el.style.transition = 'none'
        el.style.transform = `translateY(${dy}px)`
      },
      onEnd: (r) => {
        const el = panel && panelEl(panel)
        if (el) {
          el.style.transition = ''
          el.style.transform = ''
        }
        if (r.dy < -60 && !r.cancelled) setPanel(null)
      },
    },
    { ignore: 'button, a, input, textarea, [role="slider"]' }
  )

  // The home bar: swipe up to leave an app (the swipe scrubs the open-zoom
  // backwards, so the app shrinks under the finger), pause before lifting or
  // long-press for the App Switcher, tap to dismiss whatever is on top.
  const scrub = (dy) => {
    const anims = animsRef.current
    if (!anims.length || closingRef.current) return
    const p = clamp(-dy / 260, 0, 0.7)
    anims.forEach((a) => {
      a.pause()
      a.currentTime = OPEN_MS * (1 - p)
    })
  }
  const homeSwipe = useSwipe(
    {
      onMove: (dx, dy) => {
        if (launch && !panel && !switcher) scrub(dy)
      },
      onHold: () => openSwitcher(),
      onEnd: (r) => {
        if (r.held) return
        if (r.tap) {
          homeTap()
          return
        }
        if (r.dy < -SWIPE_HOME) {
          if (r.pausedMs > 160 && recents.length && !panel) openSwitcher()
          else homeTap()
          return
        }
        // A short drag: let the app settle back into place.
        animsRef.current.forEach((a) => {
          if (a.playState === 'paused') {
            a.playbackRate = 1
            a.play()
          }
        })
      },
    },
    { holdMs: HOLD_MS }
  )

  // Flick a recents card up to forget it. Delegated so the rail can still
  // scroll sideways and the cards keep their click.
  const railSwipe = useSwipe(
    {
      onStart: (e) => {
        railDragRef.current = e.target.closest('.cd-recent')
      },
      onMove: (dx, dy) => {
        const el = railDragRef.current
        if (!el) return
        const y = Math.min(0, dy)
        el.style.transition = 'none'
        el.style.transform = `translateY(${y}px)`
        el.style.opacity = String(1 - clamp(-y / 260, 0, 0.6))
      },
      onEnd: (r) => {
        const el = railDragRef.current
        railDragRef.current = null
        if (!el) {
          // A tap on the empty rail, beside the cards, closes the switcher.
          if (r.tap) setSwitcher(false)
          return
        }
        el.style.transition = ''
        if (r.dy < -90 && !r.cancelled) {
          el.style.transform = 'translateY(-120%)'
          el.style.opacity = '0'
          const id = el.dataset.id
          later('dismiss', () => {
            el.style.transform = ''
            el.style.opacity = ''
            dismissRecent(id)
          }, 220)
        } else {
          el.style.transform = ''
          el.style.opacity = ''
        }
      },
    },
    { capture: false }
  )

  // ---- hardware buttons ---------------------------------------------------

  const sleep = useCallback(() => {
    cancelLaunch()
    setScreen('off')
    setPanel(null)
    setSwitcher(false)
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
    const next = clamp(Math.round((volume + dir * VOLUME_STEP) * 100) / 100, 0, 100)
    setVolume(next)
    setVolumeHud(true)
    later('volume', () => setVolumeHud(false), HUD_MS)
    setAnnounce(`Volume ${Math.round(next / VOLUME_STEP)} of 16`)
  }

  const toggleSilent = () => {
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
    if (e.key === 'Escape' && (panel || switcher || launch)) homeTap()
  }

  const app = launch?.app
  const uiInert = screen !== 'home' || Boolean(launch) || Boolean(panel) || switcher

  return (
    <div className="cd-root" ref={rootRef} onKeyDown={onKeyDown}>
      <div className="cd-phone" role="group" aria-label="Interactive phone: contact apps and hardware buttons">
        <button
          type="button"
          className="cd-btn cd-btn--left cd-btn--action"
          aria-label={silent ? 'Action button: silent mode on' : 'Action button: ring mode'}
          aria-pressed={silent}
          onClick={toggleSilent}
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
          <div className="cd-ui" ref={uiRef} inert={uiInert}>
            <div className="cd-wall" aria-hidden="true" />

            <div className="cd-widget cd-glass">
              <div className="cd-widget-me">
                <Avatar />
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

            <div className="cd-dock cd-glass cd-glass--clear">
              {DOCK_APPS.map((a) => (
                <AppIcon key={a.id} app={a} onOpen={openApp} />
              ))}
            </div>
          </div>

          <div className="cd-lock cd-wall" inert={screen !== 'lock'}>
            <button type="button" className="cd-lock-tap" aria-label="Unlock" onClick={() => setScreen('home')} />
            <Icon name="lock" className="cd-lock-icon" />
            <span className="cd-lock-date">{dateText}</span>
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
            <div className="cd-applayer" ref={layerRef} data-phase={phase}>
              {app.kind === 'contact' ? (
                <div className="cd-appview" ref={viewRef}>
                  <AppScreen app={app} onHome={homeTap} onLink={onLink} />
                </div>
              ) : (
                <div className="cd-app-info">
                  <span className="cd-app-name">{app.name}</span>
                  <button type="button" className="cd-app-cta cd-glass" onClick={() => fire(app)}>
                    Open {app.name}
                  </button>
                </div>
              )}
              <div className="cd-hero cd-tile" ref={heroRef} aria-hidden="true">
                <Glyph glyph={app.glyph} size={app.glyphSize} />
              </div>
            </div>
          )}

          <div className="cd-switcher" data-open={switcher || undefined} inert={!switcher}>
            <button type="button" className="cd-switcher-bg" aria-label="Close App Switcher" onClick={() => setSwitcher(false)} />
            <AppSwitcher recents={recents} onReopen={reopen} railProps={{ ...railSwipe, ref: railRef, 'data-lenis-prevent': '' }} />
          </div>

          <div
            className="cd-panel cd-nc"
            ref={ncRef}
            data-open={panel === 'notes' || undefined}
            inert={panel !== 'notes'}
            data-lenis-prevent=""
            {...(panel === 'notes' ? panelSwipe : {})}
          >
            <NotificationCenter time={timeText} date={dateText} notes={notes} onClear={() => setNotes([])} onOpen={openFromNote} />
          </div>
          <div
            className="cd-panel cd-cc"
            ref={ccRef}
            data-open={panel === 'control' || undefined}
            inert={panel !== 'control'}
            data-lenis-prevent=""
            {...(panel === 'control' ? panelSwipe : {})}
          >
            <ControlCenter
              cc={cc}
              setCc={setCc}
              brightness={brightness}
              setBrightness={setBrightness}
              volume={Math.round(volume)}
              setVolume={setVolume}
              torch={torch}
              setTorch={setTorch}
              silent={silent}
              onSilent={toggleSilent}
              onCamera={pressCamera}
            />
          </div>

          <div className="cd-status" aria-hidden={screen === 'off' ? 'true' : undefined}>
            <button
              type="button"
              className="cd-status-zone cd-status-zone--left"
              aria-label="Notification Center"
              data-lenis-prevent-touch=""
              {...pullNotes}
              onClick={(e) => {
                if (e.detail === 0) settlePanel('notes', { tap: true, dy: 0 })
              }}
            >
              <span className="cd-status-time">{timeText}</span>
            </button>
            <button
              type="button"
              className="cd-status-zone cd-status-zone--right"
              aria-label="Control Center"
              data-lenis-prevent-touch=""
              {...pullControl}
              onClick={(e) => {
                if (e.detail === 0) settlePanel('control', { tap: true, dy: 0 })
              }}
            >
              <span className="cd-status-icons">
                {cc.airplane ? <Icon name="plane" /> : <CellIcon className={`cd-cell${cc.cellular ? '' : ' is-off'}`} />}
                {!cc.airplane && cc.wifi && <Icon name="wifi" />}
                <BatteryIcon />
              </span>
            </button>
          </div>

          <div className="cd-island" data-hud={islandHud ?? undefined} aria-hidden="true">
            <span className="cd-island-cam" />
            <span className="cd-island-hud">
              {islandHud === 'silent' && (
                <>
                  <Icon name="bell-slash" className="cd-hud-icon" />
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
            style={{ '--vol': `${volume}%` }}
          >
            <span className="cd-volhud-track cd-glass">
              <span className="cd-volhud-fill" />
            </span>
            <Icon name={volume === 0 ? 'volume-xmark' : 'volume-high'} className="cd-volhud-icon" />
          </div>

          <button
            type="button"
            className="cd-homebar"
            aria-label="Home. Swipe up and hold, or long-press, for recent apps"
            data-lenis-prevent-touch=""
            inert={screen !== 'home'}
            {...homeSwipe}
            onClick={(e) => {
              if (e.detail === 0) homeTap()
            }}
          />
          <div className="cd-dim" style={{ opacity: (1 - brightness / 100) * 0.85 }} aria-hidden="true" />
          {screen === 'off' && <button type="button" className="cd-sleep" aria-label="Wake the screen" onClick={wake} />}
          <div className="cd-glare" aria-hidden="true" />
        </div>
      </div>

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
