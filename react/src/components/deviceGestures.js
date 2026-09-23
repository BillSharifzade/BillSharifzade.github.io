import { useMemo, useRef } from 'react'

/**
 * Pointer-drag recogniser for the phone's gestures (pull down for the panels,
 * swipe up on the home bar, flick a recents card away).
 *
 * Returns stable handler props. The latest callbacks are read through a ref so
 * a drag survives re-renders — the clock ticking mid-swipe must not drop it.
 *
 * `onMove(dx, dy)` fires once the pointer leaves a small dead zone. `onEnd`
 * gets the final offset, the elapsed time, how long the pointer sat still
 * before lifting (`pausedMs`, the "swipe up and hold" signal iOS uses for the
 * App Switcher), and whether the whole thing was just a tap. `onHold` fires
 * once if the pointer stays put for `holdMs`.
 *
 * `capture` pins the pointer to the element (default). Pass false where child
 * buttons must still receive their click, e.g. a delegated handler on a row of
 * cards. `ignore` is a selector of descendants that own their own drags.
 */
export function useSwipe(handlers, { threshold = 6, holdMs = 0, capture = true, ignore = null } = {}) {
  const latest = useRef(handlers)
  latest.current = handlers
  const drag = useRef(null)
  const swallowClick = useRef(false)

  return useMemo(() => {
    const finish = (e, cancelled) => {
      const d = drag.current
      if (!d || e.pointerId !== d.id) return
      drag.current = null
      window.clearTimeout(d.hold)
      // A drag that ends over the element it started on still produces a
      // click; that click must not count as a tap on whatever is under it.
      swallowClick.current = d.moved || d.held
      const now = performance.now()
      latest.current.onEnd?.(
        {
          dx: d.dx,
          dy: d.dy,
          elapsed: now - d.t0,
          pausedMs: now - d.lastMove,
          tap: !d.moved && !cancelled,
          held: d.held,
          cancelled,
        },
        e
      )
    }
    const props = {
      onPointerDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        if (ignore && e.target.closest(ignore)) return
        swallowClick.current = false
        const now = performance.now()
        const d = {
          id: e.pointerId,
          x0: e.clientX,
          y0: e.clientY,
          dx: 0,
          dy: 0,
          t0: now,
          lastMove: now,
          moved: false,
          held: false,
          hold: 0,
        }
        drag.current = d
        if (capture) {
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* capture is a nicety, not a requirement */
          }
        }
        if (holdMs) {
          d.hold = window.setTimeout(() => {
            if (drag.current === d && !d.moved) {
              d.held = true
              latest.current.onHold?.(e)
            }
          }, holdMs)
        }
        latest.current.onStart?.(e)
      },
      onPointerMove(e) {
        const d = drag.current
        if (!d || e.pointerId !== d.id) return
        d.dx = e.clientX - d.x0
        d.dy = e.clientY - d.y0
        if (!d.moved) {
          if (Math.hypot(d.dx, d.dy) < threshold) return
          d.moved = true
          window.clearTimeout(d.hold)
        }
        d.lastMove = performance.now()
        latest.current.onMove?.(d.dx, d.dy, e)
      },
      onPointerUp: (e) => finish(e, false),
      onPointerCancel: (e) => finish(e, true),
      onClickCapture(e) {
        if (!swallowClick.current) return
        swallowClick.current = false
        e.stopPropagation()
        e.preventDefault()
      },
    }
    if (!capture) props.onPointerLeave = (e) => finish(e, true)
    return props
  }, [threshold, holdMs, capture, ignore])
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
