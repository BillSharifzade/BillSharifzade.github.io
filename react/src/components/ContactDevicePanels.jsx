import Icon from './Icon.jsx'
import { CellIcon, FLASHLIGHT, Tile } from './ContactDeviceBits.jsx'
import { appById } from '../data/contactApps.js'
import { AppScreen } from './ContactDeviceApps.jsx'
import { clamp } from './deviceGestures.js'

/** Control Center, Notification Center and the App Switcher — presentational. */

function Flashlight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={FLASHLIGHT} />
    </svg>
  )
}

function Toggle({ on, label, onClick, className = '', children }) {
  return (
    <button
      type="button"
      className={`cd-cc-btn${on ? ' is-on' : ''}${className ? ` ${className}` : ''}`}
      aria-label={label}
      aria-pressed={on}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// A vertical slider tile: drag anywhere on it, or use the arrow keys.
function VSlider({ label, value, onChange, className = '', children }) {
  const set = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    onChange(clamp(1 - (e.clientY - r.top) / r.height, 0, 1))
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') onChange(clamp(value + 0.1, 0, 1))
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') onChange(clamp(value - 0.1, 0, 1))
    else return
    e.preventDefault()
  }
  return (
    <div
      className={`cd-cc-tile cd-cc-slider${className ? ` ${className}` : ''}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      style={{ '--v': `${value * 100}%` }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        set(e)
      }}
      onPointerMove={(e) => {
        if (e.buttons) set(e)
      }}
      onKeyDown={onKeyDown}
    >
      <span className="cd-cc-slider-fill" />
      <span className="cd-cc-slider-icon">{children}</span>
    </div>
  )
}

export function ControlCenter({
  cc,
  setCc,
  brightness,
  setBrightness,
  volume,
  setVolume,
  torch,
  setTorch,
  silent,
  onSilent,
  onCamera,
}) {
  const flip = (key) => setCc((c) => ({ ...c, [key]: !c[key] }))
  return (
    <div className="cd-cc-grid">
      <div className="cd-cc-tile cd-cc-conn">
        <Toggle on={cc.airplane} label="Airplane Mode" onClick={() => flip('airplane')}>
          <Icon name="plane" />
        </Toggle>
        <Toggle on={cc.cellular && !cc.airplane} label="Cellular Data" onClick={() => flip('cellular')}>
          <CellIcon className="cd-cc-cell" />
        </Toggle>
        <Toggle on={cc.wifi && !cc.airplane} label="Wi-Fi" onClick={() => flip('wifi')}>
          <Icon name="wifi" />
        </Toggle>
        <Toggle on={cc.bluetooth} label="Bluetooth" onClick={() => flip('bluetooth')}>
          <Icon name="bluetooth-b" />
        </Toggle>
      </div>
      <div className="cd-cc-tile cd-cc-play">
        <span className="cd-cc-play-title">{cc.playing ? 'Playing' : 'Not Playing'}</span>
        <span className="cd-cc-play-ctl">
          <button type="button" aria-label="Previous track">
            <Icon name="backward-step" />
          </button>
          <button type="button" aria-label={cc.playing ? 'Pause' : 'Play'} onClick={() => flip('playing')}>
            <Icon name={cc.playing ? 'pause' : 'play'} />
          </button>
          <button type="button" aria-label="Next track">
            <Icon name="forward-step" />
          </button>
        </span>
      </div>
      <Toggle className="cd-cc-tile" on={cc.rotation} label="Rotation Lock" onClick={() => flip('rotation')}>
        <Icon name="rotate" />
      </Toggle>
      <Toggle className="cd-cc-tile" on={cc.mirror} label="Screen Mirroring" onClick={() => flip('mirror')}>
        <Icon name="display" />
      </Toggle>
      <VSlider className="cd-cc-bright" label="Brightness" value={brightness} onChange={setBrightness}>
        <Icon name="sun" />
      </VSlider>
      <VSlider className="cd-cc-vol" label="Volume" value={volume} onChange={setVolume}>
        <Icon name={volume === 0 ? 'volume-xmark' : 'volume-high'} />
      </VSlider>
      <Toggle className="cd-cc-tile" on={cc.focus} label="Focus" onClick={() => flip('focus')}>
        <Icon name="moon" />
      </Toggle>
      <Toggle className="cd-cc-tile" on={torch} label="Flashlight" onClick={() => setTorch((t) => !t)}>
        <Flashlight />
      </Toggle>
      <Toggle className="cd-cc-tile" label="Timer">
        <Icon name="stopwatch" />
      </Toggle>
      <Toggle className="cd-cc-tile" label="Calculator">
        <Icon name="calculator" />
      </Toggle>
      <Toggle className="cd-cc-tile" label="Camera" onClick={onCamera}>
        <Icon name="camera" />
      </Toggle>
      <Toggle className="cd-cc-tile" on={silent} label="Silent Mode" onClick={onSilent}>
        <Icon name="bell-slash" />
      </Toggle>
    </div>
  )
}

export function NotificationCenter({ time, date, notes, onClear, onOpen }) {
  return (
    <>
      <div className="cd-nc-clock">
        <span className="cd-nc-date">{date}</span>
        <span className="cd-nc-time">{time}</span>
      </div>
      <div className="cd-nc-head">
        <span>Notification Center</span>
        {notes.length > 0 && (
          <button type="button" className="cd-nc-clear cd-glass" aria-label="Clear all notifications" onClick={onClear}>
            <Icon name="times" />
          </button>
        )}
      </div>
      <ul className="cd-nc-list">
        {notes.map((id) => {
          const app = appById(id)
          return (
            <li key={id}>
              <button
                type="button"
                className="cd-note cd-glass"
                onClick={(e) => onOpen(app, e.currentTarget.querySelector('.cd-tile'))}
              >
                <Tile app={app} className="cd-tile--sm" />
                <span className="cd-note-body">
                  <span className="cd-note-top">
                    <b>{app.name}</b>
                    <span>now</span>
                  </span>
                  <span className="cd-note-title">{app.handle}</span>
                  <span className="cd-note-text">{app.note}</span>
                </span>
              </button>
            </li>
          )
        })}
        {notes.length === 0 && <li className="cd-nc-empty">No Notifications</li>}
      </ul>
    </>
  )
}

export function AppSwitcher({ recents, onReopen, railProps }) {
  return (
    <div className="cd-switcher-rail" {...railProps}>
      {recents.map((id) => {
        const app = appById(id)
        return (
          <div className="cd-recent" key={id} data-id={id}>
            <span className="cd-recent-head">
              <Tile app={app} className="cd-tile--xs" />
              {app.name}
            </span>
            <button
              type="button"
              className="cd-recent-card"
              aria-label={`Reopen ${app.name}. Swipe up to remove it`}
              onClick={(e) => onReopen(app, e.currentTarget)}
            >
              <div className="cd-recent-shot" inert>
                <AppScreen app={app} />
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
