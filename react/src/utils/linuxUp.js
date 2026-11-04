// The hero boots a Linux before the page's ASCII backdrop may appear: the
// backdrop follows this signal, rising in when Linux comes up and sinking away
// when the hero reboots. If the hero never sends it (no script, an error), the
// backdrop does not wait forever.

const FALLBACK_MS = 9000
let up = false
const watchers = new Set()

const set = (state) => {
  if (up === state) return
  up = state
  watchers.forEach((fn) => fn(state))
}

/** Linux is up. Safe to call more than once. */
export const signalLinuxUp = () => set(true)

/** Linux went down: the hero is rebooting. */
export const signalLinuxDown = () => set(false)

/** Calls `fn(up)` now and on every change. Returns a function that stops watching. */
export function watchLinux(fn) {
  watchers.add(fn)
  fn(up)
  const timer = up ? 0 : setTimeout(signalLinuxUp, FALLBACK_MS)
  return () => {
    watchers.delete(fn)
    clearTimeout(timer)
  }
}
