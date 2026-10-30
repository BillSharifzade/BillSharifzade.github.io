/**
 * Writes the page's first frame into dist/index.html, so the browser paints
 * the page from HTML instead of waiting for the JavaScript to download, parse
 * and render it. src/main.jsx then hydrates that markup.
 *
 * Runs after both builds (see `npm run build`): the client build, whose
 * index.html it fills, and the SSR build of src/entry-server.jsx, which
 * renders <App /> with the same hashed asset URLs.
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SSR = join(ROOT, 'dist-ssr')
const PAGE = join(ROOT, 'dist', 'index.html')
const EMPTY = '<div id="root"></div>'

const { render } = await import(pathToFileURL(join(SSR, 'entry-server.js')).href)
const page = readFileSync(PAGE, 'utf8')
if (!page.includes(EMPTY)) {
  throw new Error(`dist/index.html has no ${EMPTY} to fill — was it pre-rendered already?`)
}
// A function replacement, so a `$&` or `$1` in the markup is not a pattern.
writeFileSync(PAGE, page.replace(EMPTY, () => `<div id="root">${render()}</div>`))
rmSync(SSR, { recursive: true, force: true })
