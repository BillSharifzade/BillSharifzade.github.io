// The hero boots a Linux before the page's ASCII backdrop may appear: the
// backdrop waits for this signal, then rises in. If the hero never sends it
// (no script, an error), the backdrop does not wait forever.

const FALLBACK_MS = 9000
let up = false
const waiting = new Set()

/** Linux is up: release anything waiting for it. Safe to call more than once. */
export function signalLinuxUp() {
  if (up) return
  up = true
  waiting.forEach((fn) => fn())
  waiting.clear()
}

/** Runs `fn` once Linux is up (now, if it already is). Returns a cancel function. */
export function whenLinuxUp(fn) {
  if (up) {
    fn()
    return () => {}
  }
  waiting.add(fn)
  const timer = setTimeout(signalLinuxUp, FALLBACK_MS)
  return () => {
    waiting.delete(fn)
    clearTimeout(timer)
  }
}
