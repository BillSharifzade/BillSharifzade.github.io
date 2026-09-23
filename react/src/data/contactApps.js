import { siGithub, siSignal, siTelegram } from 'simple-icons'
import { ICON_PATHS } from './icons.js'
import { channel } from './contacts.js'
import { splitSubpaths } from '../utils/svgSubpaths.js'

/**
 * The apps on the contact phone's home screen (see ContactDevice).
 *
 * Handles and links come from contacts.js — this file only adds the glyph and
 * the copy each app shows. Every tile is the same monochrome glass, so there is
 * no per-app colour here on purpose: the phone is black and white throughout.
 *
 * Glyphs are the official simple-icons paths where they exist (Telegram,
 * Signal, GitHub). LinkedIn left simple-icons for trademark reasons, so its
 * "in" mark and the rest come from Font Awesome via icons.js.
 *
 * `kind: 'contact'` apps open as screens inside the phone; `kind: 'dock'` apps
 * act on the page instead (the CV dialog, or scrolling to a section).
 */

const fa = (name) => {
  const [w, h, path] = ICON_PATHS[name]
  return { path, viewBox: `0 0 ${w} ${h}` }
}

const si = (icon) => ({ path: icon.path, viewBox: '0 0 24 24' })

// simple-icons draws Telegram as the circled mark, but the iOS app icon is the
// bare paper plane. Take the smaller subpath and frame the viewBox on it.
function bare(icon) {
  const sub = splitSubpaths(icon.path).sort((a, b) => a.bbox.area - b.bbox.area)[0]
  const { x, y, w, h } = sub.bbox
  const pad = Math.max(w, h) * 0.05
  return { path: sub.d, viewBox: `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}` }
}

function contactApp(label, extra) {
  const c = channel(label)
  return {
    id: label.toLowerCase(),
    name: label,
    kind: 'contact',
    handle: c.handle,
    href: c.href,
    external: Boolean(c.external),
    ...extra,
  }
}

export const CONTACT_APPS = [
  contactApp('Email', {
    name: 'Mail',
    glyph: fa('envelope'),
    glyphSize: 0.5,
    note: 'Or old-school: email me.',
  }),
  contactApp('Signal', {
    glyph: si(siSignal),
    glyphSize: 0.6,
    note: 'Prefer end-to-end encryption? Ping me on Signal.',
  }),
  contactApp('Telegram', {
    glyph: bare(siTelegram),
    glyphSize: 0.52,
    note: 'The fastest way to reach me. Text me on Telegram.',
  }),
  contactApp('LinkedIn', {
    glyph: fa('linkedin-in'),
    glyphSize: 0.48,
    note: 'Send a network request on LinkedIn.',
  }),
  contactApp('GitHub', {
    glyph: si(siGithub),
    glyphSize: 0.6,
    note: 'Follow & drop a ★ on GitHub.',
  }),
]

export const DOCK_APPS = [
  { id: 'cv', name: 'Résumé', kind: 'dock', glyph: fa('file-lines'), glyphSize: 0.46, action: 'cv' },
  { id: 'skills', name: 'Skills', kind: 'dock', glyph: fa('microchip'), glyphSize: 0.5, scrollTo: '#skills' },
  { id: 'projects', name: 'Projects', kind: 'dock', glyph: fa('folder'), glyphSize: 0.5, scrollTo: '#projects' },
  { id: 'journey', name: 'Journey', kind: 'dock', glyph: fa('route'), glyphSize: 0.48, scrollTo: '#experience' },
]

const byId = Object.fromEntries([...CONTACT_APPS, ...DOCK_APPS].map((a) => [a.id, a]))

export const appById = (id) => byId[id]
