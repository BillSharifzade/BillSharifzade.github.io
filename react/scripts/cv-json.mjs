/**
 * Prints the CV as JSON for cvgen (../cvgen), the Rust tool that builds the
 * downloadable PDF/DOCX/XLSX/CSV/MD/TXT at build time.
 *
 * cv.js stays the one file to edit. Its formatting helpers (dateLine,
 * certLine, …) run here, so their output reaches Rust as plain strings and the
 * rules exist in one language only.
 *
 *   node scripts/cv-json.mjs | cargo run --manifest-path ../cvgen/Cargo.toml -- - public/cv
 */
import {
  profile,
  skills,
  experience,
  education,
  projects,
  projectRepoLine,
  interests,
  certifications,
  contactLine,
  certLine,
  dateLine,
} from '../src/data/cv.js'
import { resolveIcons } from '../src/data/projectIcons.js'
import { CV_ICON_PATHS } from '../src/data/cvIcons.js'
import { SIGNAL_LOGO } from '../src/data/signalLogo.js'
import { CV_THEME } from '../src/utils/cvTheme.js'
import { CV_BASENAME } from '../src/data/cvFormats.js'

const cv = {
  basename: CV_BASENAME,
  theme: { font: CV_THEME.font, color: CV_THEME.color, prompt: CV_THEME.prompt },
  name: profile.name,
  role: profile.role,
  summary: profile.summary,
  contacts: profile.contacts.map((c) => ({
    label: c.label,
    value: c.value,
    href: c.href ?? null,
    line: contactLine(c),
  })),
  skills: skills.map((s) => ({ cat: s.cat, list: s.list })),
  experience: experience.map((exp) => ({
    title: exp.title,
    company: exp.company,
    date: exp.date,
    type: exp.type ?? null,
    dateLine: dateLine(exp),
    desc: exp.desc,
    bullets: exp.bullets,
  })),
  projects: projects.map((p) => ({
    name: p.name,
    href: p.href,
    repoLine: projectRepoLine(p),
    stack: p.stack,
    desc: p.desc,
    icons: resolveIcons(p.icons).map((t) => t.path),
  })),
  education: education.map((ed) => ({
    degree: ed.degree,
    school: ed.school,
    date: ed.date,
    note: ed.note ?? null,
    meta: ed.note ? `${ed.date} · ${ed.note}` : ed.date,
  })),
  certifications: certifications.map((c) => ({
    name: c.name,
    issuer: c.issuer ?? null,
    year: c.year ?? null,
    line: certLine(c),
  })),
  interests,
  icons: Object.fromEntries(Object.entries(CV_ICON_PATHS).map(([k, [w, h, d]]) => [k, { w, h, d }])),
  signal: { width: SIGNAL_LOGO.viewBox[2], height: SIGNAL_LOGO.viewBox[3], paths: SIGNAL_LOGO.paths },
}

process.stdout.write(JSON.stringify(cv))
