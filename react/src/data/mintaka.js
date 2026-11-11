/**
 * Mintaka, the studio Bilol founded: where it lives and its mark.
 *
 * The site is github.com/BillSharifzade/mintaka_web. Until Mintaka has a
 * domain of its own it is a path on its host's domain, so every link to it is
 * read from here and moves in one edit.
 *
 * Kept free of asset imports: vite.config.js reads this in plain Node for the
 * JSON-LD, and cv.js reads it for the CV.
 */
const ROOT = 'https://dchr.koinotinav.com/mintaka/en/'

export const MINTAKA = {
  name: 'Mintaka',
  // The front door: what the studio does and the brief form.
  studio: `${ROOT}studio/`,
  // The brief form itself (the studio page's "Start a project").
  brief: `${ROOT}studio/#start`,
  // The lab: the live instruments that back up the studio's claims.
  lab: ROOT,
  repo: 'https://github.com/BillSharifzade/mintaka_web',
}

/**
 * The mark from the brand kit (assets/brand/logo/mintaka-mark-full-on-dark.svg):
 * Orion as an hourglass. The body is the constellation's outline, Betelgeuse
 * is the red star at its shoulder, and the belt runs Alnitak, Alnilam, then
 * Mintaka, the blue star the studio is named after.
 */
export const MINTAKA_MARK = {
  viewBox: '-84 -124 157.03 237.01',
  body:
    'M15.98 4.31C18.92 6.02 22.35 7 26 7C31.77 7 36.98 4.55 40.63 0.64L72.44 86.88Q73.73 90.38 72.17 93.77' +
    'Q70.61 97.15 67.12 98.44Q66.11 98.82 65.04 98.94L-54.96 112.94Q-58.66 113.37 -61.58 111.06Q-64.51 108.75 ' +
    '-64.94 105.04Q-65.17 103.07 -64.55 101.18L-42.2 33.4L15.98 4.31ZM-38 -104C-38 -106.11 -38.25 -108.15 ' +
    '-38.72 -110.11L57.04 -98.94Q60.75 -98.51 63.06 -95.58Q65.37 -92.66 64.94 -88.96Q64.81 -87.81 64.39 -86.73' +
    'L43.95 -34.27L36.02 -30.31C33.08 -32.02 29.65 -33 26 -33C15.76 -33 7.31 -25.3 6.14 -15.37L-37.58 6.49' +
    'L-65.02 -78.02C-64.68 -78.01 -64.34 -78 -64 -78C-49.64 -78 -38 -89.64 -38 -104Z',
  betelgeuse: { cx: -64, cy: -104, r: 20 },
  mintaka: { cx: 26, cy: -13, r: 14 },
  belt: [
    { cx: -26, cy: 13, r: 6 },
    { cx: 0, cy: 0, r: 6 },
  ],
}

/** A circle as path data, for drawing the mark where only paths will do. */
export const circlePath = ({ cx, cy, r }) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
