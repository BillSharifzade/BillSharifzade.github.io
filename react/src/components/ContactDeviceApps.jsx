import { useState } from 'react'
import Icon from './Icon.jsx'
import { Avatar } from './ContactDeviceBits.jsx'
import { profile, projects } from '../data/cv.js'
import { channel } from '../data/contacts.js'

/**
 * The screens the contact apps show inside the phone. Each one is a small,
 * monochrome take on the real app, and every outbound action is a real link
 * so nothing depends on a delayed window.open.
 *
 * `onHome` leaves the app; `onLink` tells the phone a link was followed so it
 * can return to the home screen once you come back.
 */

const ext = (app) => (app.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})

function Bar({ left, title, right, className = '' }) {
  return (
    <header className={`cd-av-bar${className ? ` ${className}` : ''}`}>
      <span className="cd-av-bar-side">{left}</span>
      <span className="cd-av-title">{title}</span>
      <span className="cd-av-bar-side cd-av-bar-side--right">{right}</span>
    </header>
  )
}

function BackButton({ onHome }) {
  return (
    <button type="button" className="cd-av-back" onClick={onHome} aria-label="Back to Home">
      <Icon name="chevron-left" />
    </button>
  )
}

// A compose sheet that actually composes: subject and body go into the mailto.
function MailApp({ onHome, onLink }) {
  const [subject, setSubject] = useState('Hello Bilol')
  const [body, setBody] = useState('')
  const to = channel('Email').handle
  const href = `mailto:${to}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`
  return (
    <div className="cd-av cd-av--mail">
      <Bar
        left={
          <button type="button" className="cd-av-link" onClick={onHome}>
            Cancel
          </button>
        }
        title="New Message"
        right={
          <a className="cd-av-link cd-av-link--strong" href={href} onClick={onLink}>
            Send
          </a>
        }
      />
      <div className="cd-mail-field">
        <span className="cd-mail-label">To:</span>
        <span className="cd-mail-chip">{to}</span>
      </div>
      <label className="cd-mail-field">
        <span className="cd-mail-label">Subject:</span>
        <input className="cd-mail-input" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <textarea
        className="cd-mail-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message…"
        aria-label="Message"
        data-lenis-prevent=""
      />
    </div>
  )
}

function ChatApp({ app, onHome, onLink }) {
  return (
    <div className="cd-av cd-av--chat">
      <Bar
        className="cd-av-bar--chat"
        left={<BackButton onHome={onHome} />}
        title={
          <span className="cd-av-who">
            <Avatar className="cd-avatar--sm" />
            <span>
              <b>Bilol</b>
              <small>{app.handle} · online</small>
            </span>
          </span>
        }
        right={
          <span className="cd-av-tools" aria-hidden="true">
            <Icon name="phone" />
            <Icon name="video" />
          </span>
        }
      />
      <div className="cd-chat" data-lenis-prevent="">
        <span className="cd-chat-day">Today</span>
        <p className="cd-bubble">{app.note}</p>
        <p className="cd-bubble">Write here — it lands straight on my phone.</p>
      </div>
      <a className="cd-composer cd-glass" href={app.href} {...ext(app)} onClick={onLink}>
        <span>Message {app.handle}</span>
        <Icon name="paper-plane" />
      </a>
    </div>
  )
}

function LinkedInApp({ app, onHome, onLink }) {
  return (
    <div className="cd-av cd-av--profile">
      <Bar left={<BackButton onHome={onHome} />} title="Profile" right={<Icon name="ellipsis" className="cd-av-more" />} />
      <div className="cd-av-scroll" data-lenis-prevent="">
        <div className="cd-prof-cover" aria-hidden="true" />
        <Avatar className="cd-prof-avatar" />
        <h4 className="cd-prof-name">{profile.name}</h4>
        <p className="cd-prof-headline">Backend Architect · Rust, high-load systems, applied AI</p>
        <p className="cd-prof-meta">
          <Icon name="location-dot" /> Dushanbe, Tajikistan
        </p>
        <div className="cd-prof-actions">
          <a className="cd-pill cd-pill--solid" href={app.href} {...ext(app)} onClick={onLink}>
            <Icon name="user-plus" /> Connect
          </a>
          <a className="cd-pill cd-glass" href={app.href} {...ext(app)} onClick={onLink}>
            Message
          </a>
        </div>
        <h5 className="cd-prof-h">About</h5>
        <p className="cd-prof-about">{profile.summary}</p>
      </div>
    </div>
  )
}

function GitHubApp({ app, onHome, onLink }) {
  return (
    <div className="cd-av cd-av--profile">
      <Bar left={<BackButton onHome={onHome} />} title={app.handle} right={<Icon name="ellipsis" className="cd-av-more" />} />
      <div className="cd-av-scroll" data-lenis-prevent="">
        <div className="cd-gh-top">
          <Avatar className="cd-prof-avatar cd-prof-avatar--inline" />
          <span>
            <h4 className="cd-prof-name">{profile.name}</h4>
            <p className="cd-prof-headline">{app.handle}</p>
          </span>
        </div>
        <p className="cd-prof-about cd-prof-about--short">{profile.summary}</p>
        <a className="cd-pill cd-pill--solid cd-pill--wide" href={app.href} {...ext(app)} onClick={onLink}>
          <Icon name="star" /> Follow &amp; star
        </a>
        <h5 className="cd-prof-h">Pinned</h5>
        <ul className="cd-gh-pins">
          {projects.map((p) => (
            <li key={p.repo}>
              <a className="cd-gh-pin cd-glass" href={p.href} target="_blank" rel="noopener noreferrer" onClick={onLink}>
                <span className="cd-gh-repo">
                  <Icon name="code-branch" /> {p.repo}
                </span>
                <span className="cd-gh-desc">{p.blurb}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const SCREENS = { email: MailApp, signal: ChatApp, telegram: ChatApp, linkedin: LinkedInApp, github: GitHubApp }

export function AppScreen({ app, onHome, onLink }) {
  const Screen = SCREENS[app.id]
  return Screen ? <Screen app={app} onHome={onHome} onLink={onLink} /> : null
}
