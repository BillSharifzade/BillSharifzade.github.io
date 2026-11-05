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

/**
 * Marks every `selector` match inside `ref` with `data-asleep` while it is
 * `visibility: hidden`, which index.css uses to pause the CSS animations in it.
 * Chrome can't run an animation on the compositor when none of it shows, so a
 * loop left going in a hidden panel costs a main-thread frame every frame.
 *
 * The mark follows the computed visibility, so a hiding fade plays out before
 * anything stops: it is set when the visibility transition ends, and checked
 * again whenever one of `attributes` changes inside `ref` (what shows a hidden
 * element again) or the window is resized (media queries).
 */
export function usePauseHidden(ref, selector, attributes) {
  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const check = (el) => el.toggleAttribute('data-asleep', getComputedStyle(el).visibility === 'hidden')
    const checkAll = () => root.querySelectorAll(selector).forEach(check)
    const onEnd = (e) => e.propertyName === 'visibility' && e.target.matches(selector) && check(e.target)
    const mo = new MutationObserver(checkAll)
    mo.observe(root, { attributes: true, subtree: true, attributeFilter: attributes })
    root.addEventListener('transitionend', onEnd)
    window.addEventListener('resize', checkAll)
    checkAll()
    return () => {
      mo.disconnect()
      root.removeEventListener('transitionend', onEnd)
      window.removeEventListener('resize', checkAll)
      root.querySelectorAll('[data-asleep]').forEach((el) => el.removeAttribute('data-asleep'))
    }
  }, [ref, selector, attributes])
}
