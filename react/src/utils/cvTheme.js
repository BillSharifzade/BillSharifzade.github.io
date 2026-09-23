/**
 * Design tokens shared by every CV export, so a PDF, a DOCX and a spreadsheet
 * all read as the same document as the site.
 *
 * Colours are the site's own: the terminal palette from WipTerminal.css and
 * the social card (scripts/make-og.mjs), which is the strongest single image
 * of the brand — black ground, JetBrains Mono, green prompt, orange role.
 *
 * Kept free of asset imports so the text-only exporters (txt/md/csv) can share
 * it without dragging font files into their chunks.
 */
export const CV_THEME = {
  font: 'JetBrains Mono',
  // Word substitutes when the face is not installed; these are the closest
  // metric-compatible monospaces on each platform.
  fontFallbacks: ['Cascadia Mono', 'Consolas', 'Menlo', 'DejaVu Sans Mono', 'Courier New'],

  color: {
    bg: '0a0a0c',      // page ground (terminal chrome)
    panel: '121215',   // cards / table rows
    panelAlt: '0e0e11',
    rule: '2a2a30',    // hairlines
    white: 'ffffff',   // headings
    text: 'e3d3d3',    // body (--text-primary)
    muted: 'c8b9b9',   // secondary (--text-secondary)
    dim: '6e6e78',     // labels, meta (.wt-dim)
    ok: '4ade80',      // prompt green (.wt-ok)
    accent: 'fdba74',  // role orange (.wt-accent)
    dir: '60a5fa',     // link blue (.wt-dir)
    cyan: '22d3ee',
  },

  // The prompt the site's terminal and social card both show.
  prompt: { user: 'bill', host: 'coolest_website', path: '~' },
}

/** '#rrggbb' form for CSS-like consumers (react-pdf). */
export const hex = (key) => `#${CV_THEME.color[key]}`

/** `bill@coolest_website:~$ cmd` as plain text. */
export const promptLine = (cmd = '') => {
  const { user, host, path } = CV_THEME.prompt
  return `${user}@${host}:${path}$ ${cmd}`.trimEnd()
}
