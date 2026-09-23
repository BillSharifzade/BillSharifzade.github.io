import { siGithub, siSignal, siTelegram } from 'simple-icons'
import { ICON_PATHS } from './icons.js'
import { channel } from './contacts.js'
import { splitSubpaths } from '../utils/svgSubpaths.js'

/**
 * The apps on the contact phone's home screen (see ContactDevice).
 *
 * Handles and links come from contacts.js — this file only adds the artwork:
 * an iOS-style tile colour and a brand glyph. Glyphs are the official
 * simple-icons paths where they exist (Telegram, Signal, GitHub). LinkedIn left
 * simple-icons for trademark reasons, so its "in" mark and the Mail envelope
 * come from Font Awesome via icons.js.
 *
 * `tile` is the icon background, `splash` the colour the opened app fills the
 * screen with (defaults to the tile), `glyphSize` the glyph's share of the tile.
 */

const fa = (name) => {
  const [w, h, path] = ICON_PATHS[name]
  return { path, viewBox: `0 0 ${w} ${h}` }
}

const si = (icon) => ({ path: icon.path, viewBox: '0 0 24 24' })

// simple-icons draws Telegram as the circled mark, but the iOS app icon is the
// bare paper plane on blue. Take the smaller subpath and frame the viewBox on it.
function bare(icon) {
  const sub = splitSubpaths(icon.path).sort((a, b) => a.bbox.area - b.bbox.area)[0]
  const { x, y, w, h } = sub.bbox
  const pad = Math.max(w, h) * 0.05
  return { path: sub.d, viewBox: `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}` }
}

function contactApp(label, art) {
  const c = channel(label)
  return {
    id: label.toLowerCase(),
    name: label,
    handle: c.handle,
    href: c.href,
    external: Boolean(c.external),
    ...art,
  }
}

export const CONTACT_APPS = [
  contactApp('Email', {
    name: 'Mail',
    tile: 'linear-gradient(180deg, #6fcfff 0%, #1d7cff 100%)',
    splash: '#1f7dff',
    glyph: fa('envelope'),
    glyphSize: 0.5,
  }),
  contactApp('Signal', {
    tile: 'linear-gradient(180deg, #5089f6 0%, #2f66e6 100%)',
    splash: '#3a76f0',
    glyph: si(siSignal),
    glyphSize: 0.62,
  }),
  contactApp('Telegram', {
    tile: 'linear-gradient(180deg, #41b8ec 0%, #1b92c8 100%)',
    splash: '#27a3dc',
    glyph: bare(siTelegram),
    glyphSize: 0.54,
  }),
  contactApp('LinkedIn', {
    tile: 'linear-gradient(180deg, #1f7fd9 0%, #0a5cb3 100%)',
    splash: '#0a66c2',
    glyph: fa('linkedin-in'),
    glyphSize: 0.5,
  }),
  contactApp('GitHub', {
    tile: 'linear-gradient(180deg, #3a424b 0%, #0d1117 100%)',
    splash: '#161b22',
    glyph: si(siGithub),
    glyphSize: 0.62,
  }),
]

/**
 * Dock shortcuts that stay on the page. `action: 'cv'` opens the CV format
 * dialog; `scrollTo` scrolls to a section once the app has "opened".
 */
export const SITE_APPS = [
  {
    id: 'cv',
    name: 'Résumé',
    tile: 'linear-gradient(180deg, #ffffff 0%, #d7d7e1 100%)',
    fg: '#1b1b24',
    splash: '#15151c',
    keepTile: true,
    glyph: fa('file-lines'),
    glyphSize: 0.46,
    action: 'cv',
  },
  {
    id: 'projects',
    name: 'Projects',
    tile: 'linear-gradient(180deg, #a6adff 0%, #5d64e8 100%)',
    splash: '#5d64e8',
    glyph: fa('folder'),
    glyphSize: 0.52,
    scrollTo: '#projects',
  },
  {
    id: 'journey',
    name: 'Journey',
    tile: 'linear-gradient(180deg, #4ade80 0%, #16a34a 100%)',
    splash: '#1fa04a',
    glyph: fa('route'),
    glyphSize: 0.5,
    scrollTo: '#experience',
  },
]
