import Icon from './Icon.jsx'
import { channels } from '../data/contacts.js'
import { SIGNAL_LOGO } from '../data/signalLogo.js'
import './ContactLinks.css'

const [, , sw, sh] = SIGNAL_LOGO.viewBox

/** Every way to reach Bilol, as a row of links. */
export default function ContactLinks() {
  return (
    <ul className="contact-links">
      {channels.map((c) => (
        <li key={c.label}>
          <a
            className="contact-link cursor-target"
            href={c.href}
            {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            <span className="contact-link__icon" aria-hidden="true">
              {c.logo === 'signal' ? (
                <svg viewBox={`0 0 ${sw} ${sh}`}>
                  {SIGNAL_LOGO.paths.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </svg>
              ) : (
                <Icon name={c.icon} />
              )}
            </span>
            <span className="contact-link__text">
              <span className="contact-link__label">{c.label}</span>
              <span className="contact-link__handle">{c.handle}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
