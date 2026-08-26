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

function seoFallback() {
  return {
    name: 'cv-seo-fallback',
    transformIndexHtml(html) {
      return html
        .replace('<!--CV_FALLBACK-->', renderFallback())
        .replace('<!--JSONLD-->', renderJsonLd())
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
})
