import { siArchlinux } from 'simple-icons'

/** Small pieces shared by the phone's screens. */

// simple-icons ships the Arch mark with a ™ as a second subpath; keep the mark.
const ARCH = {
  path: siArchlinux.path.slice(0, siArchlinux.path.indexOf('M', 1)),
  viewBox: '0 0 24 24',
}

export const FLASHLIGHT =
  'M8 2h8a1 1 0 0 1 1 1v3.2a1 1 0 0 1-.2.6L15 9.4V21a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V9.4L7.2 6.8A1 1 0 0 1 7 6.2V3a1 1 0 0 1 1-1zm4 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'

export function Glyph({ glyph, size }) {
  const pct = `${Math.round(size * 100)}%`
  return (
    <svg viewBox={glyph.viewBox} style={{ width: pct, height: pct }} aria-hidden="true" focusable="false">
      <path d={glyph.path} />
    </svg>
  )
}

/** A monochrome glass app icon. */
export function Tile({ app, className = '' }) {
  return (
    <span className={`cd-tile${className ? ` ${className}` : ''}`}>
      <Glyph glyph={app.glyph} size={app.glyphSize} />
    </span>
  )
}

/** The Arch mark in a round frame, standing in for a profile picture. */
export function Avatar({ className = '' }) {
  return (
    <span className={`cd-avatar${className ? ` ${className}` : ''}`}>
      <Glyph glyph={ARCH} size={0.54} />
    </span>
  )
}

export function CellIcon({ className = 'cd-cell' }) {
  return (
    <svg className={className} viewBox="0 0 20 12" aria-hidden="true" focusable="false">
      <rect y="8" width="3.6" height="4" rx=".9" />
      <rect x="5.5" y="5.5" width="3.6" height="6.5" rx=".9" />
      <rect x="11" y="3" width="3.6" height="9" rx=".9" />
      <rect x="16.4" width="3.6" height="12" rx=".9" />
    </svg>
  )
}

export function BatteryIcon() {
  return (
    <svg className="cd-batt" viewBox="0 0 28 13" aria-hidden="true" focusable="false">
      <rect x=".5" y=".5" width="24" height="12" rx="3.8" fill="none" stroke="currentColor" strokeOpacity=".4" />
      <path d="M26 4.2v4.6a2.4 2.4 0 0 0 0-4.6z" fillOpacity=".4" />
      <rect x="2" y="2" width="21" height="9" rx="2.3" />
    </svg>
  )
}
