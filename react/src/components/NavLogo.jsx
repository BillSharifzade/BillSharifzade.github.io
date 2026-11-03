import './NavLogo.css'

const WORD = 'qwantum'
// Each letter's twin from physics notation: ψ for the wave function, ω, α, η, τ, υ, μ.
const TWIN = 'ψωαητυμ'

/**
 * The header mark as a quantum state, |qwantum>. Left alone, each letter is
 * in superposition, drifting between itself and its Greek twin over a small
 * wave packet. Hovering or focusing it observes the state: the word collapses
 * to plain, bold "qwantum", the brackets close in and the wave flattens into
 * the one point where it was measured.
 *
 * All CSS, transform and opacity only (plus the variable font's weight on
 * collapse); reduced motion leaves it collapsed.
 */
export default function NavLogo({ onClick }) {
  return (
    <a href="#home" className="logo qlogo cursor-target" onClick={onClick} aria-label="qwantum, back to the top">
      <span className="qlogo__ket qlogo__ket--l" aria-hidden="true">|</span>
      <span className="qlogo__word" aria-hidden="true">
        {[...WORD].map((c, i) => (
          <span key={i} className="qlogo__q" style={{ '--i': i }} data-twin={TWIN[i]}>
            {c}
          </span>
        ))}
      </span>
      <span className="qlogo__ket qlogo__ket--r" aria-hidden="true">&gt;</span>
      <span className="qlogo__wave" aria-hidden="true">
        <i />
      </span>
      <span className="qlogo__dot" aria-hidden="true" />
    </a>
  )
}
