// The hero boots a Linux before the page's ASCII backdrop may appear: the
// backdrop follows this signal, rising in when Linux comes up and sinking away
// when the hero reboots. If the hero never sends it (no script, an error), the
// backdrop does not wait forever. The backdrop in turn says when it starts to
// rise, and the header logo lifts its letters out of it.

const FALLBACK_MS = 9000
let up = false
const watchers = new Set()
// Pending fallbacks. Once Linux has come up they have nothing left to cover,
// and one firing later would bring the backdrop up in the middle of a reboot.
const fallbacks = new Set()

const set = (state) => {
  if (up === state) return
  up = state
  if (up) {
    fallbacks.forEach(clearTimeout)
    fallbacks.clear()
  }
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
  if (timer) fallbacks.add(timer)
  return () => {
    watchers.delete(fn)
    clearTimeout(timer)
    fallbacks.delete(timer)
  }
}

const risers = new Set()

/** The backdrop has started rising (each time Linux comes up). */
export const signalBackdropRise = () => risers.forEach((fn) => fn())

/** Calls `fn()` each time the backdrop starts rising. Returns a function that stops watching. */
export function watchBackdropRise(fn) {
  risers.add(fn)
  return () => risers.delete(fn)
}
