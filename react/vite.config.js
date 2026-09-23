import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  profile,
  skills,
  experience,
  education,
  projects,
  certifications,
  interests,
  contactLine,
  certLine,
  dateLine,
} from './src/data/cv.js'

const SITE = 'https://billsharifzade.github.io/'

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// The app renders client-side, so crawlers and no-JS visitors would otherwise
// receive an empty <div id="root">. This renders the same cv.js data into a
// static <noscript> block at build time — real indexable content, no prerenderer.
function renderFallback() {
  const contacts = profile.contacts
    .map((c) => (c.href ? `<a href="${esc(c.href)}">${esc(c.value)}</a>` : esc(contactLine(c))))
    .join(' &middot; ')

  const jobs = experience
    .map(
      (exp) => `<article>
      <h3>${esc(exp.title)} &middot; ${esc(exp.company)}</h3>
      <p><em>${esc(dateLine(exp))}</em></p>
      <p>${esc(exp.desc)}</p>
      <ul>${exp.bullets.map(([l, t]) => `<li><strong>${esc(l)}</strong> ${esc(t)}</li>`).join('')}</ul>
    </article>`
    )
    .join('\n')

  const projs = projects
    .map(
      (p) => `<article>
      <h3><a href="${esc(p.href)}">${esc(p.name)}</a></h3>
      <p class="meta">${esc(p.stack)}</p>
      <p>${esc(p.desc)}</p>
    </article>`
    )
    .join('\n')

  const edu = education
    .map(
      (ed) =>
        `<li><strong>${esc(ed.degree)}</strong> &middot; ${esc(ed.school)} (${esc(
          ed.note ? `${ed.date} · ${ed.note}` : ed.date
        )})</li>`
    )
    .join('')

  return `<noscript>
  <style>
    .nojs{max-width:52rem;margin:0 auto;padding:2.5rem 1.25rem;font-family:system-ui,-apple-system,sans-serif;
      line-height:1.6;color:#e8e8ef;background:#0b0b12}
    .nojs a{color:#818cf8}
    .nojs h1{font-size:2rem;margin:0 0 .25rem}
    .nojs h2{font-size:1.1rem;text-transform:uppercase;letter-spacing:.08em;margin:2rem 0 .5rem;color:#818cf8}
    .nojs h3{font-size:1rem;margin:1.25rem 0 .25rem}
    .nojs .role{color:#818cf8;font-weight:600;margin:0 0 .75rem}
    .nojs .meta{color:#8a8a9e;font-size:.9rem}
  </style>
  <div class="nojs">
    <h1>${esc(profile.name)}</h1>
    <p class="role">${esc(profile.role)}</p>
    <p class="meta">${contacts}</p>
    <h2>Summary</h2>
    <p>${esc(profile.summary)}</p>
    <h2>Core Stack</h2>
    <ul>${skills.map((s) => `<li><strong>${esc(s.cat)}:</strong> ${esc(s.list)}</li>`).join('')}</ul>
    <h2>Experience</h2>
    ${jobs}
    <h2>Selected Projects</h2>
    ${projs}
    <h2>Education</h2>
    <ul>${edu}</ul>
    <h2>Certifications</h2>
    <ul>${certifications.map((c) => `<li>${esc(certLine(c))}</li>`).join('')}</ul>
    <h2>Interests</h2>
    <p>${esc(interests)}</p>
  </div>
</noscript>`
}

// Person schema for rich results, generated from the same cv.js data as the
// page. JSON.stringify escapes quotes; '<' is escaped below so the payload
// can never close its own <script> tag.
function renderJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    url: SITE,
    email: 'mailto:sharifzadebilal@gmail.com',
    address: { '@type': 'PostalAddress', addressLocality: 'Dushanbe', addressCountry: 'TJ' },
    sameAs: profile.contacts
      .filter((c) => c.href && c.href.startsWith('http'))
      .map((c) => c.href),
    alumniOf: education.map((ed) => ({ '@type': 'CollegeOrUniversity', name: ed.school })),
  }
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

// Messenger scrapers (Telegram, WhatsApp, Discord…) cache the preview image
// by its URL. Stamping og.png's content hash into the ?v= makes every
// redesigned card a brand-new URL automatically — no manual bumping, and an
// unchanged card keeps its URL (and caches) stable.
function ogImageVersion() {
  const here = dirname(fileURLToPath(import.meta.url))
  const png = readFileSync(join(here, 'public/og.png'))
  return createHash('md5').update(png).digest('hex').slice(0, 8)
}

// The Latin subset is the only one an English page needs, and it is discovered
// two round-trips deep (html -> css -> woff2) without a preload. The filename is
// content-hashed at build time, so the tag is emitted from the bundle rather
// than hard-coded.
function fontPreload(bundle) {
  if (!bundle) return ''
  // Anchored so it cannot match the latin-ext subset, which an English page
  // never needs and which would waste the one preload slot that matters.
  const latin = Object.keys(bundle).find((f) =>
    /jetbrains-mono-latin-[A-Za-z0-9_-]+\.woff2$/.test(f) && !f.includes('latin-ext')
  )
  return latin ? `<link rel="preload" as="font" type="font/woff2" href="/${latin}" crossorigin />` : ''
}

// These placeholders were once silently stripped out of index.html, which left
// the crawler fallback and the Person schema building to nothing for months —
// a no-op .replace() looks exactly like a successful one. Fail the build
// instead.
function fill(html, placeholder, value) {
  if (!html.includes(placeholder)) {
    throw new Error(
      `index.html is missing the ${placeholder} placeholder — ` +
      `SEO markup would be silently dropped. Restore it before building.`
    )
  }
  return html.replace(placeholder, value)
}

function seoFallback() {
  return {
    name: 'cv-seo-fallback',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        let out = html
        out = fill(out, '<!--CV_FALLBACK-->', renderFallback())
        out = fill(out, '<!--JSONLD-->', renderJsonLd())
        out = fill(out, '<!--FONTPRELOAD-->', fontPreload(ctx.bundle))
        return out.replace(/og\.png\?v=[^"]*/g, `og.png?v=${ogImageVersion()}`)
      },
    },
  }
}

// Generated from the same source as the page so they cannot drift apart.
function seoFiles() {
  return {
    name: 'cv-seo-files',
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), seoFallback(), seoFiles()],
  base: '/',
  build: {
    // three.js alone clears the default 500 kB warning, and it is already
    // deliberately split into its own lazily-imported chunk.
    chunkSizeWarningLimit: 1000,
    // Small font subsets (cyrillic-ext is ~2 kB) would otherwise be inlined as
    // data: URIs, which `font-src 'self'` blocks outright — the glyphs silently
    // fall back. Keep every font as a real, cacheable file.
    assetsInlineLimit(filePath) {
      if (filePath.endsWith('.woff2') || filePath.endsWith('.woff')) return false
    },
    rollupOptions: {
      output: {
        // React and the animation libraries change far less often than the CV
        // content does. Splitting them out means a copy edit reships only the
        // app chunk instead of busting one ~600 kB bundle. Matched by path
        // rather than by package name so that deep entry points
        // (react-dom/client, motion/react) land in the same chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/[\\/]node_modules[\\/](gsap|motion|framer-motion|lenis)[\\/]/.test(id)) return 'animation'
        },
      },
    },
  },
})
