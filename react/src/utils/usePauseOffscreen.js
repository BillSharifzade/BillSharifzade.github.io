import { useEffect } from 'react'

/**
 * Marks every `selector` match that is out of view with `data-offscreen`, which
 * index.css uses to pause its CSS animations. Infinite animations otherwise run
 * the style and layout work of a full frame, every frame, for sections nobody
 * is looking at.
 */
export function usePauseOffscreen(selector) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute('data-offscreen', !e.isIntersecting)
      },
      // Resume a little before an element scrolls in, so it is already moving.
      { rootMargin: '200px 0px' }
    )
    const els = document.querySelectorAll(selector)
    els.forEach((el) => io.observe(el))
    return () => {
      io.disconnect()
      els.forEach((el) => el.removeAttribute('data-offscreen'))
    }
  }, [selector])
}
