import { MINTAKA_MARK as M } from '../data/mintaka.js'
import './MintakaMark.css'

/**
 * Mintaka's mark, inline, in one colour like every other logo on the page:
 * the brand kit's mono colourway (mintaka-logo-horizontal-mono-*.svg), where
 * the stars keep their shape and lose their red and blue. It takes the text
 * colour, so the parent decides white on dark or black on a white tile.
 * With a `title` it is an image with that name; without one it is decoration.
 */
export default function MintakaMark({ className = '', title }) {
  return (
    <svg
      className={`mk-mark${className ? ` ${className}` : ''}`}
      viewBox={M.viewBox}
      focusable="false"
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      <path d={M.body} />
      <circle {...M.betelgeuse} />
      <circle {...M.mintaka} />
      {M.belt.map((star) => (
        <circle key={star.cx} {...star} />
      ))}
    </svg>
  )
}
