/**
 * Every way to reach Bilol, in one place.
 *
 * These handles were previously written out three times — in cv.js for the
 * exports and the crawler fallback, in ContactOrbit for the orbiting chips, and
 * again inline in App.jsx for the mobile contact grid. Changing a handle meant
 * remembering all three, and nothing caught it when one drifted.
 *
 * Listed in the order the site shows them. `handle` is what the page displays;
 * `cvValue` is the longer form the CV prints when the two differ (a CV is read
 * on paper, where "BillSharifzade" is not something you can type into a
 * browser). `cvHref` is deliberately absent for Telegram and Signal, which the
 * CV prints as plain text rather than links.
 *
 * Kept free of asset imports: vite.config.js imports cv.js in plain Node to
 * build the <noscript> fallback, so nothing in this chain may reach for an svg.
 */
export const channels = [
  {
    label: 'Email',
    handle: 'sharifzadebilal@gmail.com',
    href: 'mailto:sharifzadebilal@gmail.com',
    cvHref: 'mailto:sharifzadebilal@gmail.com',
    icon: 'envelope',
  },
  {
    label: 'Signal',
    handle: 'qwantum.01',
    href: 'https://signal.me/#eu/Rrvk7a7IZAngzf-XhPOkYe8_X-oy1pc9BSutK9idldmInEXjy8BPEJDELEKtQQlN',
    external: true,
    logo: 'signal',
  },
  {
    label: 'Telegram',
    handle: '@knight_of_bonnie',
    href: 'https://t.me/knight_of_bonnie',
    external: true,
    icon: 'telegram',
  },
  {
    label: 'LinkedIn',
    handle: 'Bilal Sharifzade',
    cvValue: 'linkedin.com/in/bilal-sharifzade-555bba35a',
    href: 'https://www.linkedin.com/in/bilal-sharifzade-555bba35a/',
    cvHref: 'https://www.linkedin.com/in/bilal-sharifzade-555bba35a/',
    external: true,
    icon: 'linkedin',
  },
  {
    label: 'GitHub',
    handle: 'BillSharifzade',
    cvValue: 'github.com/BillSharifzade',
    href: 'https://github.com/BillSharifzade',
    cvHref: 'https://github.com/BillSharifzade',
    external: true,
    icon: 'github',
  },
]

const byLabel = Object.fromEntries(channels.map((c) => [c.label, c]))

/** Look one up by label, e.g. channel('Telegram'). */
export const channel = (label) => byLabel[label]

/**
 * The contact line as the CV prints it. The CV leads with location and closes
 * with the website, and orders the channels for reading rather than for the
 * page's visual layout.
 */
const CV_ORDER = ['Email', 'Telegram', 'Signal', 'GitHub', 'LinkedIn']

export const cvContacts = [
  { label: 'Location', value: 'Dushanbe, Tajikistan', bare: true },
  ...CV_ORDER.map((label) => {
    const c = byLabel[label]
    return { label: c.label, value: c.cvValue ?? c.handle, href: c.cvHref }
  }),
  { label: 'Website', value: 'billsharifzade.github.io', href: 'https://billsharifzade.github.io/' },
]
