import { useEffect, useState } from 'react'
import OrbitImages from './OrbitImages.jsx'
import signalLogo from '../assets/signal_logo.svg'
import './ContactOrbit.css'

// The contact channels as chips orbiting a mail CTA (desktop only — the
// plain .contact-grid stays for narrow screens, see ContactOrbit.css).
// Hovering anywhere over the orbit pauses it so the links hold still for the
// click; the hovered chip inverts, lifts, and names its handle.

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

export default function ContactOrbit() {
  const [held, setHeld] = useState(false)
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
      {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {c.img
        ? <img className="orbit-chip-img" src={c.img} alt="" draggable={false} />
        : <i className={c.icon} aria-hidden="true"></i>}
      <span className="orbit-chip-tip" aria-hidden="true">
        <b>{c.label}</b>
        <span>{c.handle}</span>
      </span>
    </a>
  ))

  return (
    <div
      className="contact-orbit"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <OrbitImages
        items={chips}
        shape="ellipse"
        radiusX={340}
        radiusY={80}
        rotation={-8}
        duration={30}
        itemSize={80}
        responsive={true}
        aspectRatio="1400 / 470"
        paused={held || reduced}
        centerContent={
          <div className="orbit-center">
            <p className="orbit-center-kicker">open to interesting problems</p>
            <a className="orbit-center-mail" href="mailto:sharifzadebilal@gmail.com">
              sharifzadebilal@gmail.com
            </a>
          </div>
        }
      />
    </div>
  )
}
