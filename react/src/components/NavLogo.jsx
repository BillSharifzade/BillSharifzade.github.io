import { useEffect, useRef } from 'react'
import { watchBackdropRise, watchLinux } from '../utils/linuxUp.js'
import { CELL_H, CELL_W, CHARACTERS as RAMP, gridOffset, litCells } from '../utils/asciiGrid.js'
import './NavLogo.css'

const WORD = 'qwantum'
// A letter's place on the backdrop's ramp: 0 is blank, 1–9 are the ramp's
// characters from dim to dense, and TOP is the letter itself.
const TOP = RAMP.length
const STEP = 38
const STAGGER = 60
// The backdrop's columns rise from below and its light fades in. From this
// long after it starts, the logo looks for enough lit characters to lift,
// again every LOOK_EVERY until it finds them or runs out of looks.
const LIFT_AFTER = 1200
const LOOK_EVERY = 300
const LOOKS = 9
const LIFT_GAP = 80
const FLIGHT = 850
// How bright a backdrop cell must be to read as a character worth lifting.
const SEEN = 0.2
// Without a backdrop (no WebGL) the name condenses in place instead.
const NO_BACKDROP = 2600
// A Linux that is up within this long of mounting was already up: the hero
// skipped its boot, so the name is simply there.
const INSTANT = 250

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * The header mark: "qwantum" made of the ASCII backdrop's own characters.
 *
 * It comes up with the page. While the hero boots there is no name; when
 * Linux is up and the backdrop rises, one of its lit characters per letter
 * lifts off its grid, flies into the header, and climbs the rest of the ramp
 * (… 8 # @) into its letter. A reboot dissolves the name back down the ramp,
 * and hovering runs every letter up the ramp again.
 *
 * The letters are driven from here, outside React, a text node at a time.
 * Without a script the name shows after the hero's fallback delay; with
 * reduced motion it is simply there.
 */
export default function NavLogo({ onClick }) {
  const ref = useRef(null)
  const hover = useRef(null)

  useEffect(() => {
    const root = ref.current
    if (reduced()) {
      root.dataset.live = ''
      return undefined
    }
    const cells = [...root.children]
    const rest = WORD.split('').map(() => 0)
    // Per letter: null, or a walk along the ramp { at, from, to }.
    const walks = rest.map(() => null)
    const flyers = new Set()
    const timers = new Set()
    let raf = 0

    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t)
        fn()
      }, ms)
      timers.add(t)
    }
    const clearLater = () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }

    const show = (i, pos) => {
      const el = cells[i]
      const ch = pos <= 0 ? ' ' : pos >= TOP ? WORD[i] : RAMP[pos]
      if (el.textContent !== ch) el.textContent = ch
      const noise = pos > 0 && pos < TOP
      el.style.opacity = noise ? (0.3 + (0.6 * (pos - 1)) / (TOP - 2)).toFixed(2) : ''
      el.toggleAttribute('data-noise', noise)
    }

    const frame = (now) => {
      raf = 0
      walks.forEach((w, i) => {
        if (!w) return show(i, rest[i])
        if (now < w.at) return show(i, rest[i])
        const dir = Math.sign(w.to - w.from)
        const pos = w.from + dir * Math.floor((now - w.at) / STEP)
        if ((pos - w.to) * dir >= 0) {
          rest[i] = w.to
          walks[i] = null
          return show(i, w.to)
        }
        show(i, pos)
      })
      if (walks.some(Boolean)) raf = requestAnimationFrame(frame)
    }
    const walk = (i, from, to, delay = 0) => {
      walks[i] = { at: performance.now() + delay, from, to }
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const ground = () => {
      flyers.forEach((a) => a.cancel())
      flyers.clear()
    }

    // Where each letter's character comes from: the backdrop's lit cells
    // nearest the name, one per letter and never side by side, handed out left
    // to right so the paths don't cross. Null while too few are lit, unless
    // this is the last look: then any cell under the header will do.
    const sources = (boxes, below, off, last) => {
      const lit = litCells({
        left: 0,
        top: below,
        width: Math.min(window.innerWidth, 1100),
        height: window.innerHeight - below,
      }).filter((c) => c.value > SEEN)
      const near = (c) => 1.5 * c.value - Math.hypot(c.x - boxes[0].left, c.y - below) / 900
      const picked = []
      for (const c of lit.sort((a, b) => near(b) - near(a))) {
        if (picked.length === boxes.length) break
        if (picked.every((p) => Math.abs(p.x - c.x) > CELL_W * 2.5 || Math.abs(p.y - c.y) > CELL_H * 1.5)) picked.push(c)
      }
      if (picked.length < boxes.length && !last) return null
      while (picked.length < boxes.length) {
        const box = boxes[picked.length]
        const col = Math.floor((box.left + box.width / 2 - off.x) / CELL_W) + Math.floor(Math.random() * 14) - 2
        const row = Math.ceil((below - off.y) / CELL_H) + Math.floor(Math.random() * 8)
        picked.push({
          x: off.x + (col + 0.5) * CELL_W,
          y: off.y + (row + 0.5) * CELL_H,
          char: RAMP[3 + Math.floor(Math.random() * 5)],
        })
      }
      return picked.sort((a, b) => a.x - b.x)
    }

    // Each lifted character rises first, then curves into its place in the name.
    const lift = (look = 1) => {
      const canvas = document.querySelector('.gradient-ascii-canvas')
      const nav = root.closest('nav')
      if (!canvas || !nav) return
      const boxes = cells.map((el) => el.getBoundingClientRect())
      const off = gridOffset(canvas.width, canvas.height)
      const from = sources(boxes, nav.getBoundingClientRect().bottom, off, look >= LOOKS)
      if (!from) return later(() => lift(look + 1), LOOK_EVERY)
      cells.forEach((el, i) => {
        const box = boxes[i]
        const pos = RAMP.indexOf(from[i].char)
        const sx = from[i].x - box.width / 2
        const sy = from[i].y - box.height / 2
        const [ex, ey] = [box.left, box.top]
        // From backdrop size (its glyphs are ~0.78 of a cell) to the letter's.
        const s0 = (CELL_H * 0.78) / parseFloat(getComputedStyle(el).fontSize)
        // Landing at the opacity its letter shows that step of the ramp with.
        const end = 0.3 + (0.6 * (pos - 1)) / (TOP - 2)
        const frames = Array.from({ length: 9 }, (_, k) => {
          const t = k / 8
          // A quadratic curve whose control point sits straight above the start.
          const x = (1 - t) * (1 - t) * sx + 2 * t * (1 - t) * sx + t * t * ex
          const y = (1 - t) * (1 - t) * sy + 2 * t * (1 - t) * ey + t * t * ey
          return {
            transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(s0 + (1 - s0) * t).toFixed(3)})`,
            opacity: k === 0 ? 0 : (0.55 + (end - 0.55) * t).toFixed(2),
          }
        })
        const fly = document.createElement('span')
        fly.className = 'qlogo-fly'
        fly.setAttribute('aria-hidden', 'true')
        fly.textContent = from[i].char
        const cs = getComputedStyle(el)
        fly.style.fontSize = cs.fontSize
        fly.style.lineHeight = cs.lineHeight
        fly.style.width = `${box.width}px`
        fly.style.height = `${box.height}px`
        document.body.append(fly)
        const a = fly.animate(frames, {
          duration: FLIGHT,
          delay: i * LIFT_GAP,
          easing: 'cubic-bezier(0.5, 0, 0.25, 1)',
          fill: 'backwards',
        })
        flyers.add(a)
        const land = () => {
          flyers.delete(a)
          fly.remove()
        }
        a.oncancel = land
        a.onfinish = () => {
          land()
          walk(i, pos, TOP)
        }
      })
    }

    const condense = () => rest.forEach((r, i) => r < TOP && walk(i, 1, TOP, i * STAGGER))

    const mountedAt = performance.now()
    let up = false
    const stopLinux = watchLinux((state) => {
      if (state === up) return
      up = state
      clearLater()
      ground()
      if (up) {
        if (performance.now() - mountedAt < INSTANT) {
          rest.fill(TOP)
          rest.forEach((r, i) => show(i, r))
        } else later(condense, NO_BACKDROP)
      } else {
        // Back into the backdrop, the last letter first.
        cells.forEach((_, i) => (rest[i] > 0 || walks[i]) && walk(i, TOP - 1, 0, (cells.length - 1 - i) * 45))
      }
    })
    // Handled once every watcher of the same Linux signal has heard it.
    const stopRise = watchBackdropRise(() =>
      queueMicrotask(() => {
        if (!up || flyers.size) return
        clearLater()
        later(lift, LIFT_AFTER)
      })
    )

    hover.current = () => {
      if (!up || flyers.size || walks.some(Boolean) || rest.some((r) => r < TOP)) return
      cells.forEach((_, i) => walk(i, 1, TOP, i * STAGGER))
    }

    rest.forEach((r, i) => show(i, r))
    root.dataset.live = ''

    return () => {
      stopLinux()
      stopRise()
      clearLater()
      ground()
      cancelAnimationFrame(raf)
      hover.current = null
      cells.forEach((el, i) => {
        el.textContent = WORD[i]
        el.style.opacity = ''
        el.removeAttribute('data-noise')
      })
      delete root.dataset.live
    }
  }, [])

  return (
    <a
      ref={ref}
      href="#home"
      className="logo qlogo cursor-target"
      onClick={onClick}
      onPointerEnter={() => hover.current?.()}
      onFocus={() => hover.current?.()}
      aria-label="qwantum, back to the top"
    >
      {[...WORD].map((c, i) => (
        <span key={i} aria-hidden="true">
          {c}
        </span>
      ))}
    </a>
  )
}
