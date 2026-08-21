// Browser-only companion to cv.js. Kept separate because vite.config.js imports
// cv.js in Node to build the <noscript> fallback, where `import ... from '*.svg'`
// has no loader and would break the build.
//
// These are generated cover plates, not screenshots. To use a real screenshot,
// drop the file in src/assets/projects/ and repoint the matching key below —
// the `cover` value in cv.js stays the same.
import apiweave from '../assets/projects/apiweave.svg'
import screenx from '../assets/projects/screenx.svg'
import hrProgress from '../assets/projects/hr-progress.svg'
import rdkafka from '../assets/projects/rdkafka.svg'
import procs from '../assets/projects/procs.svg'

export const projectCovers = {
  apiweave,
  screenx,
  'hr-progress': hrProgress,
  rdkafka,
  procs,
}
