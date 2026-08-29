
const PARAM_COUNTS = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }
const NUM_RE = /[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/y

function tokenize(d) {
  const tokens = []
  let i = 0
  let cmd = null

  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++
  }
  const readNumber = () => {
    skip()
    NUM_RE.lastIndex = i
    const m = NUM_RE.exec(d)
    if (!m || m.index !== i) throw new Error(`svgSubpaths: bad number at index ${i}`)
    i = NUM_RE.lastIndex
    return m[0]
  }
  const readFlag = () => {
    skip()
    const ch = d[i]
    if (ch !== '0' && ch !== '1') throw new Error(`svgSubpaths: bad arc flag at index ${i}`)
    i++
    return ch
  }

  while (true) {
    skip()
    if (i >= d.length) break
    const ch = d[i]
    if (/[a-zA-Z]/.test(ch)) {
      cmd = ch
      i++
    } else if (cmd === 'M') cmd = 'L'
    else if (cmd === 'm') cmd = 'l'
    else if (!cmd || cmd === 'Z' || cmd === 'z') {
      throw new Error(`svgSubpaths: number with no command at index ${i}`)
    }

    const upper = cmd.toUpperCase()
    const count = PARAM_COUNTS[upper]
    if (count === undefined) throw new Error(`svgSubpaths: unknown command "${cmd}"`)

    const params = []
    if (upper === 'A') {
      params.push(readNumber(), readNumber(), readNumber(), readFlag(), readFlag(), readNumber(), readNumber())
    } else {
      for (let k = 0; k < count; k++) params.push(readNumber())
    }
    tokens.push({ cmd, params })
  }
  return tokens
}

const fmt = (n) => String(Math.round(n * 1e4) / 1e4)

export function splitSubpaths(d) {
  const tokens = tokenize(d)
  const subs = []
  let cur = null
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0

  const open = () => ({ parts: [], minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
  const mark = (px, py) => {
    if (!cur) return
    if (px < cur.minX) cur.minX = px
    if (py < cur.minY) cur.minY = py
    if (px > cur.maxX) cur.maxX = px
    if (py > cur.maxY) cur.maxY = py
  }
  const close = () => {
    if (!cur) return
    const w = cur.maxX - cur.minX
    const h = cur.maxY - cur.minY
    subs.push({
      d: cur.parts.join(''),
      bbox: { x: cur.minX, y: cur.minY, w, h, cx: cur.minX + w / 2, cy: cur.minY + h / 2, area: w * h },
    })
  }

  for (const { cmd, params } of tokens) {
    const rel = cmd >= 'a'
    const n = params.map(Number)
    const upper = cmd.toUpperCase()

    if (upper === 'M') {
      const nx = rel ? x + n[0] : n[0]
      const ny = rel ? y + n[1] : n[1]
      close()
      cur = open()
      cur.parts.push(`M${fmt(nx)} ${fmt(ny)}`)
      x = nx
      y = ny
      sx = nx
      sy = ny
      mark(x, y)
      continue
    }

    cur.parts.push(cmd + params.join(' '))

    switch (upper) {
      case 'L':
      case 'T': {
        x = rel ? x + n[0] : n[0]
        y = rel ? y + n[1] : n[1]
        mark(x, y)
        break
      }
      case 'H': {
        x = rel ? x + n[0] : n[0]
        mark(x, y)
        break
      }
      case 'V': {
        y = rel ? y + n[0] : n[0]
        mark(x, y)
        break
      }
      case 'C': {
        const [x1, y1, x2, y2, ex, ey] = rel ? [x + n[0], y + n[1], x + n[2], y + n[3], x + n[4], y + n[5]] : n
        mark(x1, y1)
        mark(x2, y2)
        x = ex
        y = ey
        mark(x, y)
        break
      }
      case 'S':
      case 'Q': {
        const [x1, y1, ex, ey] = rel ? [x + n[0], y + n[1], x + n[2], y + n[3]] : n
        mark(x1, y1)
        x = ex
        y = ey
        mark(x, y)
        break
      }
      case 'A': {
        const rx = Math.abs(n[0])
        const ry = Math.abs(n[1])
        const ex = rel ? x + n[5] : n[5]
        const ey = rel ? y + n[6] : n[6]
        mark(x - rx, y - ry)
        mark(x + rx, y + ry)
        mark(ex - rx, ey - ry)
        mark(ex + rx, ey + ry)
        x = ex
        y = ey
        break
      }
      case 'Z': {
        x = sx
        y = sy
        break
      }
    }
  }
  close()
  return subs
}
