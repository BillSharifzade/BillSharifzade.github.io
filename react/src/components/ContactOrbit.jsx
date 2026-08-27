import { useEffect, useState } from 'react'
import OrbitImages from './OrbitImages.jsx'
import signalLogo from '../assets/signal_logo.svg'
import './ContactOrbit.css'

// The contact channels as chips orbiting a compact mail pill on a visible
// dashed path (desktop only — the plain .contact-grid stays for narrow
// screens, see ContactOrbit.css). No hover tricks: clicking a chip fires a
// monochrome particle burst (GooeyNav's burst mechanic, re-tuned) while the
// link opens.

const CHANNELS = [
  { label: 'Email', handle: 'sharifzadebilal@gmail.com', href: 'mailto:sharifzadebilal@gmail.com', icon: 'fas fa-envelope' },
  {
    label: 'Signal',
    handle: 'qwantum.01',
    href: 'https://signal.me/#eu/Rrvk7a7IZAngzf-XhPOkYe8_X-oy1pc9BSutK9idldmInEXjy8BPEJDELEKtQQlN',
    img: signalLogo,
    external: true,
  },
  { label: 'Telegram', handle: '@knight_of_bonnie', href: 'https://t.me/knight_of_bonnie', icon: 'fab fa-telegram', external: true },
  { label: 'LinkedIn', handle: 'Bilal Sharifzade', href: 'https://www.linkedin.com/in/bilal-sharifzade-555bba35a/', icon: 'fab fa-linkedin', external: true },
  { label: 'GitHub', handle: 'BillSharifzade', href: 'https://github.com/BillSharifzade', icon: 'fab fa-github', external: true },
]

// GooeyNav's burst, scaled to a chip: N points scatter from the click target
// on randomized spokes and pull back in. Colors are the site's grey ramp.
const BURST = {
  count: 12,
  distances: [82, 14],
  r: 90,
  time: 500,
  variance: 250,
  colors: ['#ffffff', '#cfd4dc', '#9aa1ac', '#6e737d'],
}

const noise = (n = 1) => n / 2 - Math.random() * n

function burst(chip) {
  const old = chip.querySelector('.co-burst')
  if (old) old.remove()
  const holder = document.createElement('span')
  holder.className = 'co-burst'
  const total = BURST.count
  for (let i = 0; i < total; i++) {
    const t = BURST.time * 2 + noise(BURST.variance * 2)
    const angle = ((360 + noise(8)) / total) * i * (Math.PI / 180)
    const rot = noise(BURST.r / 10)
    const particle = document.createElement('span')
    particle.className = 'co-particle'
    particle.style.setProperty('--start-x', `${BURST.distances[0] * Math.cos(angle)}px`)
    particle.style.setProperty('--start-y', `${BURST.distances[0] * Math.sin(angle)}px`)
    particle.style.setProperty('--end-x', `${(BURST.distances[1] + noise(7)) * Math.cos(angle)}px`)
    particle.style.setProperty('--end-y', `${(BURST.distances[1] + noise(7)) * Math.sin(angle)}px`)
    particle.style.setProperty('--time', `${t}ms`)
    particle.style.setProperty('--scale', `${1 + noise(0.2)}`)
    particle.style.setProperty('--color', BURST.colors[Math.floor(Math.random() * BURST.colors.length)])
    particle.style.setProperty('--rotate', `${rot > 0 ? (rot + BURST.r / 20) * 10 : (rot - BURST.r / 20) * 10}deg`)
    const point = document.createElement('span')
    point.className = 'co-point'
    particle.appendChild(point)
    holder.appendChild(particle)
  }
  chip.appendChild(holder)
  chip.classList.remove('orbit-chip--pop')
  void chip.offsetWidth
  chip.classList.add('orbit-chip--pop')
  window.setTimeout(() => holder.remove(), BURST.time * 2 + BURST.variance + 100)
}

export default function ContactOrbit() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const chips = CHANNELS.map((c) => (
    <a
      key={c.label}
      className="orbit-chip"
      href={c.href}
      aria-label={`${c.label} — ${c.handle}`}
      onClick={(e) => burst(e.currentTarget)}
      {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {c.img
        ? <img className="orbit-chip-img" src={c.img} alt="" draggable={false} />
        : <i className={c.icon} aria-hidden="true"></i>}
    </a>
  ))

  return (
    <div className="contact-orbit">
      <OrbitImages
        items={chips}
        shape="ellipse"
        radiusX={340}
        radiusY={80}
        rotation={-8}
        duration={30}
        itemSize={110}
        responsive={true}
        aspectRatio="1400 / 500"
        paused={reduced}
        showPath={true}
        pathColor="rgba(255, 255, 255, 0.16)"
        pathWidth={2}
        centerContent={
          <a className="orbit-center-mail" href="mailto:sharifzadebilal@gmail.com">
            sharifzadebilal@gmail.com
          </a>
        }
      />
    </div>
  )
}
