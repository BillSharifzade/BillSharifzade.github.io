import { siArchlinux } from 'simple-icons'

// The simple-icons path ends with a second subpath, a ™ that shows at large
// sizes. The mark is the first subpath alone.
const ARCH = siArchlinux.path.slice(0, siArchlinux.path.indexOf('M', 1))

/** The Arch Linux mark as inline SVG, drawn in currentColor. */
export default function ArchMark({ className, title }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      <path d={ARCH} fill="currentColor" />
    </svg>
  )
}
