import { useEffect, useState } from 'react'

/**
 * True while `ref`'s element intersects the viewport AND the tab is in the
 * foreground.
 *
 * The page runs several infinite animations (the orbiting contact chips, the
 * nav's proximity-weighted logo, the WebGL backdrop). Left unguarded each one
 * keeps a rAF loop or compositor animation alive for the whole visit, including
 * while it is scrolled far out of view or the tab is buried. Gating them on this
 * hook costs one IntersectionObserver and gives the CPU back when nothing is
 * being looked at.
 *
 * Defaults to true so that a browser without IntersectionObserver, or a render
 * before the observer's first callback, animates rather than sits frozen.
 */
export function useOnScreen(ref, { threshold = 0, rootMargin = '0px' } = {}) {
  const [onScreen, setOnScreen] = useState(true)
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden
  )

  useEffect(() => {
    const el = ref?.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { threshold, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold, rootMargin])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const onChange = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return onScreen && pageVisible
}
