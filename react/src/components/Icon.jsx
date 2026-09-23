import { ICON_PATHS } from '../data/icons.js'
import './Icon.css'

/**
 * Inline replacement for Font Awesome's <i className="fas fa-x"> webfont icons.
 *
 * Sizes to 1em and inherits `color` exactly as the webfont did, so existing
 * styles that target the old <i> keep working — see Icon.css for the
 * `.fa`-compatible metrics.
 *
 * Decorative by default. Pass `label` for an icon that carries meaning on its
 * own (no adjacent text saying the same thing).
 */
export default function Icon({ name, className = '', spin = false, label, style }) {
  const icon = ICON_PATHS[name]
  if (!icon) {
    if (import.meta.env.DEV) console.warn(`Icon: unknown name "${name}"`)
    return null
  }
  const [width, height, path] = icon

  return (
    <svg
      className={`icon${spin ? ' icon--spin' : ''}${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      // Font Awesome icons are not square — `infinity` is 1.25em wide, `times`
      // 0.75em — and the webfont advanced by each glyph's own width. Forcing a
      // 1em box instead would letterbox the art and quietly resize every
      // element sized around an icon.
      style={{ width: `${(width / height).toFixed(4)}em`, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      <path d={path} />
    </svg>
  )
}
