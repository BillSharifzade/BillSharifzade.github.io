
import './Burst.css'

const DEFAULTS = {
  count: 12,
  distances: [82, 14],
  r: 90,
  time: 500,
  variance: 250,
  colors: ['#ffffff', '#cfd4dc', '#9aa1ac', '#6e737d'],
}

const noise = (n = 1) => n / 2 - Math.random() * n

export function burst(el, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts }
  const old = el.querySelector('.co-burst')
  if (old) old.remove()
  const holder = document.createElement('span')
  holder.className = 'co-burst'
  for (let i = 0; i < cfg.count; i++) {
    const t = cfg.time * 2 + noise(cfg.variance * 2)
    const angle = ((360 + noise(8)) / cfg.count) * i * (Math.PI / 180)
    const rot = noise(cfg.r / 10)
    const particle = document.createElement('span')
    particle.className = 'co-particle'
    particle.style.setProperty('--start-x', `${cfg.distances[0] * Math.cos(angle)}px`)
    particle.style.setProperty('--start-y', `${cfg.distances[0] * Math.sin(angle)}px`)
    particle.style.setProperty('--end-x', `${(cfg.distances[1] + noise(7)) * Math.cos(angle)}px`)
    particle.style.setProperty('--end-y', `${(cfg.distances[1] + noise(7)) * Math.sin(angle)}px`)
    particle.style.setProperty('--time', `${t}ms`)
    particle.style.setProperty('--scale', `${1 + noise(0.2)}`)
    particle.style.setProperty('--color', cfg.colors[Math.floor(Math.random() * cfg.colors.length)])
    particle.style.setProperty('--rotate', `${rot > 0 ? (rot + cfg.r / 20) * 10 : (rot - cfg.r / 20) * 10}deg`)
    const point = document.createElement('span')
    point.className = 'co-point'
    particle.appendChild(point)
    holder.appendChild(particle)
  }
  el.appendChild(holder)
  el.classList.remove('co-pop')
  void el.offsetWidth
  el.classList.add('co-pop')
  window.setTimeout(() => holder.remove(), cfg.time * 2 + cfg.variance + 100)
}
