// Browser-only companion to cv.js. Kept separate because vite.config.js imports
// cv.js in Node to build the <noscript> fallback, where `import ... from '*.svg'`
// has no loader and would break the build.
//
// Every entry is an array so a project can show more than one shot in the same
// card — the gallery lays them out side by side. Projects with a real screenshot
// point at it; the rest keep a generated cover plate drawn at the same landscape
// aspect the gallery reserves for artwork, so nothing is cropped away.
import apiweave from '../assets/projects/apiweave.svg'
import rdkafka from '../assets/projects/rdkafka.svg'
import screenx1 from '../assets/projects/screenx1.jpg'
import screenx2 from '../assets/projects/screenx2.jpg'
import hrProgress from '../assets/projects/hr-progress.jpg'
import procs from '../assets/projects/procs.png'

export const projectCovers = {
  apiweave: [apiweave],
  screenx: [screenx1, screenx2],
  'hr-progress': [hrProgress],
  rdkafka: [rdkafka],
  procs: [procs],
}
