import { useEffect, useRef, useState } from 'react'
import OrbitImages from './OrbitImages.jsx'
import { useOnScreen } from '../hooks/useOnScreen.js'
import { burst } from '../utils/burst.js'
import { channel, channels } from '../data/contacts.js'
import { CONTACT_LOGOS } from '../data/contactLogos.js'
import Icon from './Icon.jsx'
import './ContactOrbit.css'


const CENTER_CTAS = [
  { text: 'text me on Telegram!', ...channel('Telegram') },
  { text: 'follow & drop a ★ on GitHub', ...channel('GitHub') },
  { text: 'send a network request on LinkedIn', ...channel('LinkedIn') },
  { text: 'ping me on Signal', ...channel('Signal') },
  { text: 'or old-school: email me', ...channel('Email') },
]
const CTA_INTERVAL = 3400

export default function ContactOrbit() {
  const [reduced, setReduced] = useState(false)
  const [ctaIndex, setCtaIndex] = useState(0)
  const rootRef = useRef(null)
  const onScreen = useOnScreen(rootRef)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // No point cycling the call-to-action while the section is off screen — it
  // only ever re-renders something nobody is looking at.
  useEffect(() => {
    if (reduced || !onScreen) return
    const id = window.setInterval(() => setCtaIndex((i) => (i + 1) % CENTER_CTAS.length), CTA_INTERVAL)
    return () => window.clearInterval(id)
  }, [reduced, onScreen])

  const chips = channels.map((c) => (
    <a
      key={c.label}
      className="orbit-chip"
      href={c.href}
      aria-label={`${c.label} — ${c.handle}`}
      onMouseEnter={(e) => burst(e.currentTarget)}
      onFocus={(e) => burst(e.currentTarget)}
      {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {c.logo
        ? <img className="orbit-chip-img" src={CONTACT_LOGOS[c.logo]} alt="" draggable={false} />
        : <Icon name={c.icon} />}
    </a>
  ))

  const cta = reduced ? CENTER_CTAS[CENTER_CTAS.length - 1] : CENTER_CTAS[ctaIndex]

  return (
    <div className="contact-orbit" ref={rootRef}>
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
