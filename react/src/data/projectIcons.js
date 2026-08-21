// Official brand marks for the project gallery, resolved from the simple-icons
// slugs listed on each entry in cv.js. Named imports keep this tree-shakeable —
// `import * as simpleIcons` would pull all ~3000 icons into the bundle.
//
// Kept out of cv.js for the same reason as the covers: vite.config.js imports
// cv.js in Node at build time, and that path should stay dependency-free.
import {
  siRust,
  siGraphql,
  siJson,
  siOpenapiinitiative,
  siPostgresql,
  siNextdotjs,
  siTelegram,
  siGo,
  siReact,
  siTypescript,
  siApachekafka,
  siC,
  siLinux,
  siDocker,
} from 'simple-icons'

const SOURCE = {
  siRust,
  siGraphql,
  siJson,
  siOpenapiinitiative,
  siPostgresql,
  siNextdotjs,
  siTelegram,
  siGo,
  siReact,
  siTypescript,
  siApachekafka,
  siC,
  siLinux,
  siDocker,
}

// Brand hex is deliberately dropped — the gallery renders every mark in the
// site's monochrome palette.
export const projectIcons = Object.fromEntries(
  Object.entries(SOURCE).map(([slug, icon]) => [slug, { title: icon.title, path: icon.path }])
)

export function resolveIcons(slugs = []) {
  return slugs.map((slug) => projectIcons[slug]).filter(Boolean)
}
