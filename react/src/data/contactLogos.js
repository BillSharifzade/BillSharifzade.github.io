import signalLogo from '../assets/signal_logo.svg'

/**
 * Bitmap/vector marks for contact channels that have no Font Awesome glyph.
 *
 * Separate from contacts.js on purpose: that file is imported by cv.js, which
 * vite.config.js loads in plain Node to build the <noscript> fallback, and Node
 * cannot resolve an `.svg` import. Keyed by a channel's `logo` field.
 */
export const CONTACT_LOGOS = { signal: signalLogo }
