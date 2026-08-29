import { useEffect, useState } from 'react'
import OrbitImages from './OrbitImages.jsx'
import { burst } from '../utils/burst.js'
import signalLogo from '../assets/signal_logo.svg'
import './ContactOrbit.css'


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

const href = (label) => CHANNELS.find((c) => c.label === label)
const CENTER_CTAS = [
  { text: 'text me on Telegram!', ...href('Telegram') },
  { text: 'follow & drop a ★ on GitHub', ...href('GitHub') },
  { text: 'send a network request on LinkedIn', ...href('LinkedIn') },
  { text: 'ping me on Signal', ...href('Signal') },
  { text: 'or old-school: email me', ...href('Email') },
]
const CTA_INTERVAL = 3400

export default function ContactOrbit() {
  const [reduced, setReduced] = useState(false)
  const [ctaIndex, setCtaIndex] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setCtaIndex((i) => (i + 1) % CENTER_CTAS.length), CTA_INTERVAL)
    return () => window.clearInterval(id)
  }, [reduced])

  const chips = CHANNELS.map((c) => (
    <a
      key={c.label}
      className="orbit-chip"
      href={c.href}
      aria-label={`${c.label} — ${c.handle}`}
      onMouseEnter={(e) => burst(e.currentTarget)}
      onFocus={(e) => burst(e.currentTarget)}
      {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {c.img
        ? <img className="orbit-chip-img" src={c.img} alt="" draggable={false} />
        : <i className={c.icon} aria-hidden="true"></i>}
    </a>
  ))

  const cta = reduced ? CENTER_CTAS[CENTER_CTAS.length - 1] : CENTER_CTAS[ctaIndex]

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
          <a
            key={cta.text}
            className="orbit-center-cta"
            href={cta.href}
            {...(cta.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {cta.text}
          </a>
        }
      />
    </div>
  )
}
