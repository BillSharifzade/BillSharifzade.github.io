// The ASCII backdrop's characters and its grid. Shared with the header logo,
// which lifts its letters out of the backdrop, so this stays out of the
// backdrop's own (lazy) chunk.

/** Characters from dimmest to brightest. */
export const CHARACTERS = ' =+xX0S8#@'

/**
 * A character cell in CSS pixels, the shape of the backdrop's glyph atlas
 * cell (60 × 100).
 */
export const CELL_H = 18
export const CELL_W = CELL_H * 0.6

/** Where the grid starts: it is centred, so a part cell is left on each side. */
export const gridOffset = (width, height) => ({
  x: (width - Math.ceil(width / CELL_W) * CELL_W) / 2,
  y: (height - Math.ceil(height / CELL_H) * CELL_H) / 2,
})

// The shader's hash (GradientASCII's hash12), in single precision like the GPU.
const f = Math.fround
const fract = (x) => f(x - Math.floor(x))
export const hash12 = (x, y) => {
  let a = fract(f(x * 0.1031))
  let b = fract(f(y * 0.1031))
  let c = a
  const d = f(f(f(a * f(b + 33.33)) + f(b * f(c + 33.33))) + f(c * f(a + 33.33)))
  a = f(a + d)
  b = f(b + d)
  c = f(c + d)
  return fract(f(f(a + b) * c))
}

let sampler = null

/** The backdrop lends a way to read its lit cells while it is running. */
export function lendSampler(fn) {
  sampler = fn
  return () => {
    if (sampler === fn) sampler = null
  }
}

/**
 * The backdrop's lit cells inside a rectangle of the viewport (CSS pixels):
 * `{ x, y, char, value }` at each cell's centre, brightest first. Empty when
 * there is no backdrop.
 */
export const litCells = (rect) => sampler?.(rect) ?? []
