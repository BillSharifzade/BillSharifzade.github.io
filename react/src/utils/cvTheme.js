/**
 * Design tokens shared by every CV file, so a PDF, a DOCX and a spreadsheet
 * all read as the same document as the site. scripts/cv-json.mjs hands them to
 * cvgen (../cvgen), which builds the files.
 *
 * Colours are the site's own: the terminal palette from WipTerminal.css and
 * the social card (scripts/make-og.mjs), which is the strongest single image
 * of the brand — black ground, JetBrains Mono, green prompt, orange role.
 */
export const CV_THEME = {
  // The DOCX declares it a fixed-pitch face, so Word substitutes another
  // monospace on a machine that does not have it installed.
  font: 'JetBrains Mono',

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

