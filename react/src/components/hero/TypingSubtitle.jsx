import { memo, useEffect, useRef } from 'react'

const TYPING_TEXTS = ['Backend Architect', 'Founder of Mintaka']

/**
 * Types each title out, holds it, deletes it, and moves on to the next.
 * Written straight into the span: a keystroke every 50–100 ms has no reason
 * to go through React.
 */
function TypingSubtitle({ texts = TYPING_TEXTS }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    let textIndex = 0
    let charIndex = 0
    let isDeleting = false
    let timeoutId

    // The pause before the next change depends on where the title is.
    const delay = () => {
      if (!isDeleting && charIndex === texts[textIndex].length) return 1500
      if (isDeleting && charIndex === 0) return 300
      return isDeleting ? 50 : 100
    }
    const advance = () => {
      // Off screen (usePauseOffscreen marks the hero) it waits where it is,
      // like the CSS loops do: each keystroke would cost the page a frame.
      if (el.closest('[data-offscreen]')) {
        timeoutId = setTimeout(advance, 250)
        return
      }
      if (!isDeleting && charIndex === texts[textIndex].length) isDeleting = true
      else if (isDeleting && charIndex === 0) {
        isDeleting = false
        textIndex = (textIndex + 1) % texts.length
      } else {
        charIndex += isDeleting ? -1 : 1
        el.textContent = texts[textIndex].substring(0, charIndex)
      }
      timeoutId = setTimeout(advance, delay())
    }

    timeoutId = setTimeout(advance, delay())
    return () => {
      clearTimeout(timeoutId)
      el.textContent = ''
    }
  }, [texts])

  return <span className="typing-text" ref={ref} />
}

export default memo(TypingSubtitle)
