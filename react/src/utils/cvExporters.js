import { createElement } from 'react'
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
} from '../data/cv.js'
import { resolveIcons } from '../data/projectIcons.js'
import { CV_THEME, promptLine } from '../utils/cvTheme.js'

const BASENAME = 'Sharifzoda_Bilol_CV'
const { color: COLOR, font: FONT } = CV_THEME

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 40_000)
}

const eduMeta = (ed) => (ed.note ? `${ed.date} · ${ed.note}` : ed.date)

// ---------------------------------------------------------------------------
// PDF — react-pdf renders CvDocument.jsx with the embedded JetBrains Mono.
// ---------------------------------------------------------------------------

async function exportPdf() {
  const [{ pdf }, { default: CvDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/CvDocument.jsx'),
  ])
  const blob = await pdf(createElement(CvDocument)).toBlob()
  triggerDownload(blob, `${BASENAME}.pdf`)
}

// ---------------------------------------------------------------------------
// Icons for Word — docx has no vector image support, so the same path data the
// PDF draws is rasterised through a canvas at 4x for crisp printing.
// ---------------------------------------------------------------------------

function rasterise(paths, [, , vw, vh], px, hexColor) {
  try {
    const scale = 4
    const canvas = document.createElement('canvas')
    canvas.height = Math.round(px * scale)
    canvas.width = Math.round((px * scale * vw) / vh)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.scale(canvas.height / vh, canvas.height / vh)
    ctx.fillStyle = `#${hexColor}`
    for (const d of paths) ctx.fill(new Path2D(d))
    // toDataURL over toBlob on purpose: it is synchronous, and toBlob's
    // callback was measured at ~1 s per icon in headless Chrome — 25 s for
    // one document — where the data URL route takes milliseconds.
    const b64 = canvas.toDataURL('image/png').split(',')[1]
    const data = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0))
    return { data, width: px * (vw / vh), height: px }
  } catch {
    // No canvas (odd embedded browsers): the document still reads fine without glyphs.
    return null
  }
}

async function exportDocx() {
  const [
    {
      Document,
      Packer,
      Paragraph,
      TextRun,
      ImageRun,
      ExternalHyperlink,
      Footer,
      PageNumber,
      BorderStyle,
      TabStopType,
      TabStopPosition,
    },
    { CV_ICON_PATHS },
    { SIGNAL_LOGO },
  ] = await Promise.all([
    import('docx'),
    import('../data/cvIcons.js'),
    import('../data/signalLogo.js'),
  ])

  // Half-points, as Word counts them.
  const pt = (n) => Math.round(n * 2)

  const run = (text, opts = {}) => new TextRun({ text, font: FONT, color: COLOR.text, size: pt(8.5), ...opts })
  const white = (text, opts = {}) => run(text, { color: COLOR.white, bold: true, ...opts })
  const dim = (text, opts = {}) => run(text, { color: COLOR.dim, size: pt(7), ...opts })
  const muted = (text, opts = {}) => run(text, { color: COLOR.muted, ...opts })
  const accent = (text, opts = {}) => run(text, { color: COLOR.accent, bold: true, ...opts })
  const link = (text, href, opts = {}) =>
    new ExternalHyperlink({ link: href, children: [run(text, { color: COLOR.dir, ...opts })] })

  const iconCache = new Map()
  const icon = async (key, px = 9, color = COLOR.dim) => {
    const id = `${key}|${px}|${color}`
    if (!iconCache.has(id)) {
      let img = null
      if (key === 'signal') img = rasterise(SIGNAL_LOGO.paths, SIGNAL_LOGO.viewBox, px, color)
      else if (CV_ICON_PATHS[key]) {
        const [w, h, d] = CV_ICON_PATHS[key]
        img = rasterise([d], [0, 0, w, h], px, color)
      }
      iconCache.set(id, img)
    }
    const img = iconCache.get(id)
    return img
      ? [new ImageRun({ type: 'png', data: img.data, transformation: { width: img.width, height: img.height } }), run('\u00a0')]
      : []
  }
  const brand = async (path, px = 9, color = COLOR.muted) => {
    const id = `brand|${path.slice(0, 40)}|${px}|${color}`
    if (!iconCache.has(id)) iconCache.set(id, rasterise([path], [0, 0, 24, 24], px, color))
    const img = iconCache.get(id)
    return img
      ? [new ImageRun({ type: 'png', data: img.data, transformation: { width: img.width, height: img.height } }), run(' ')]
      : []
  }

  const rightTab = { tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }] }

  // `bill@coolest_website:~$ cmd`, coloured like the site's terminal.
  const prompt = (cmd) => {
    const { user, host, path } = CV_THEME.prompt
    return new Paragraph({
      spacing: { after: 20 },
      children: [
        run(user, { color: COLOR.ok, size: pt(7.5) }),
        run('@', { color: COLOR.dim, size: pt(7.5) }),
        run(host, { color: COLOR.ok, size: pt(7.5) }),
        run(':', { color: COLOR.dim, size: pt(7.5) }),
        run(path, { color: COLOR.dir, bold: true, size: pt(7.5) }),
        run(`$ ${cmd}`, { size: pt(7.5) }),
      ],
    })
  }

  const section = async (title, glyph) =>
    new Paragraph({
      spacing: { before: 280, after: 110 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.rule, space: 3 } },
      keepNext: true,
      children: [...(await icon(glyph, 10, COLOR.ok)), white(title.toUpperCase(), { size: pt(8), characterSpacing: 24 })],
    })

  const bullet = (label, text) =>
    new Paragraph({
      indent: { left: 340, hanging: 200 },
      spacing: { after: 40 },
      children: [run('› ', { color: COLOR.ok, bold: true }), white(label + ' ', { size: pt(8.5) }), run(text)],
    })

  const CONTACT_GLYPH = {
    Location: 'location-dot',
    Email: 'envelope',
    Telegram: 'telegram',
    Signal: 'signal',
    GitHub: 'github',
    LinkedIn: 'linkedin',
    Website: 'globe',
  }
  // Word treats an inline image as a break opportunity on both sides, so a
  // flowing contact row can strand a glyph at a line end away from its label.
  // Two fixed columns per line never wrap: the longest item is ~46 columns of
  // a 110-column line.
  const contactRun = async (c) => [
    ...(await icon(CONTACT_GLYPH[c.label], 9)),
    c.href ? link(c.value, c.href, { size: pt(7.5) }) : muted(c.bare ? c.value : contactLine(c), { size: pt(7.5) }),
  ]
  const contactRows = []
  for (let i = 0; i < profile.contacts.length; i += 2) {
    const pair = profile.contacts.slice(i, i + 2)
    const runs = await contactRun(pair[0])
    if (pair[1]) runs.push(run('\t'), ...(await contactRun(pair[1])))
    const last = i + 2 >= profile.contacts.length
    contactRows.push(
      new Paragraph({
        spacing: { after: last ? 60 : 30 },
        tabStops: [{ type: TabStopType.LEFT, position: 5000 }],
        ...(last ? { border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.rule, space: 8 } } } : {}),
        children: runs,
      })
    )
  }

  const children = [
    prompt('whoami'),
    new Paragraph({ spacing: { after: 80 }, children: [white(profile.name, { size: pt(22) })] }),
    prompt('cat role.txt'),
    new Paragraph({ spacing: { after: 140 }, children: [accent(profile.role, { size: pt(9) })] }),
    ...contactRows,

    await section('Summary', 'terminal'),
    new Paragraph({ children: [run(profile.summary)] }),

    await section('Core Stack', 'layer-group'),
    ...skills.map(
      (s) => new Paragraph({ spacing: { after: 50 }, children: [white(`${s.cat}: `), muted(s.list, { size: pt(8) })] })
    ),

    await section('Experience', 'briefcase'),
  ]

  for (const exp of experience) {
    children.push(
      new Paragraph({
        spacing: { before: 180, after: 30 },
        keepNext: true,
        ...rightTab,
        children: [white(exp.title, { size: pt(9.5) }), accent(` · ${exp.company}`, { size: pt(9.5) }), run('\t'), dim(`\u00a0\u00a0\u00a0${dateLine(exp)}`)],
      }),
      new Paragraph({ spacing: { after: 70 }, keepNext: true, children: [muted(exp.desc, { size: pt(8) })] }),
      ...exp.bullets.map(([label, text]) => bullet(label, text))
    )
  }

  children.push(await section('Selected Projects', 'diagram-project'))
  for (const proj of projects) {
    const marks = []
    for (const t of resolveIcons(proj.icons)) marks.push(...(await brand(t.path, 9)))
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 30 },
        keepNext: true,
        ...rightTab,
        children: [white(proj.name, { size: pt(9.5) }), run('  '), ...marks, run('\t'), link(`\u00a0\u00a0\u00a0${projectRepoLine(proj)}`, proj.href, { size: pt(7) })],
      }),
      new Paragraph({ spacing: { after: 40 }, keepNext: true, children: [accent(proj.stack, { bold: false, size: pt(7.5) })] }),
      new Paragraph({ spacing: { after: 80 }, children: [run(proj.desc)] })
    )
  }

  children.push(await section('Education', 'graduation-cap'))
  for (const ed of education) {
    children.push(
      new Paragraph({
        spacing: { after: 30 },
        keepNext: true,
        children: [white(ed.degree, { size: pt(9.5) }), accent(` · ${ed.school}`, { size: pt(9.5) })],
      }),
      new Paragraph({ spacing: { after: 100 }, children: [dim(eduMeta(ed))] })
    )
  }

  children.push(
    await section('Certifications', 'award'),
    ...certifications.map(
      (c) =>
        new Paragraph({
          indent: { left: 340, hanging: 200 },
          spacing: { after: 40 },
          children: [run('› ', { color: COLOR.ok, bold: true }), run(certLine(c))],
        })
    ),
    await section('Interests', 'heart'),
    new Paragraph({ children: [muted(interests)] })
  )

  const email = profile.contacts.find((c) => c.label === 'Email')?.value
  const site = profile.contacts.find((c) => c.label === 'Website')?.value

  const doc = new Document({
    creator: profile.name,
    title: `${profile.name} - CV`,
    description: 'Curriculum Vitae',
    // Word draws the page colour on screen; printing it is a per-user setting
    // ("Print background colors and images"), so the PDF remains the print copy.
    background: { color: COLOR.bg },
    styles: {
      default: { document: { run: { font: FONT, size: pt(8.5), color: COLOR.text } } },
    },
    sections: [
      {
        properties: { page: { margin: { top: 900, bottom: 860, left: 1000, right: 1000 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: COLOR.rule, space: 6 } },
                ...rightTab,
                children: [
                  dim(`${profile.name} · ${email}`),
                  run('\t'),
                  dim(`${site} · `),
                  new TextRun({ children: [PageNumber.CURRENT], font: FONT, color: COLOR.dim, size: pt(7) }),
                  dim('/'),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, color: COLOR.dim, size: pt(7) }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, `${BASENAME}.docx`)
}

// ---------------------------------------------------------------------------
// XLSX — exceljs, which unlike the community SheetJS build can style cells.
// ---------------------------------------------------------------------------

async function exportXlsx() {
  const mod = await import('exceljs')
  const Workbook = mod.Workbook ?? mod.default?.Workbook
  const wb = new Workbook()
  wb.creator = profile.name
  wb.title = `${profile.name} - CV`

  const argb = (c) => ({ argb: `FF${c}` })
  const fill = (c) => ({ type: 'pattern', pattern: 'solid', fgColor: argb(c) })
  const font = (opts = {}) => ({ name: FONT, size: 9, color: argb(COLOR.text), ...opts })
  const hair = { style: 'thin', color: argb(COLOR.rule) }

  /**
   * Builds one dark "card" sheet: styled header row, alternating row ground,
   * every cell in the used rectangle filled so no white shows through, and
   * gridlines off so the card edge is the only line.
   */
  const sheet = (name, tabColor, columns, rows, colStyles = {}) => {
    const ws = wb.addWorksheet(name, {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
      properties: { tabColor: argb(tabColor) },
    })
    ws.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }))
    rows.forEach((r) => ws.addRow(r))

    const head = ws.getRow(1)
    head.height = 22
    head.eachCell((cell) => {
      cell.font = font({ bold: true, size: 9.5, color: argb(COLOR.white) })
      cell.fill = fill(COLOR.panel)
      cell.alignment = { vertical: 'middle' }
      cell.border = { bottom: { style: 'medium', color: argb(tabColor) } }
    })

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r)
      const ground = r % 2 === 0 ? COLOR.bg : COLOR.panelAlt
      for (let c = 1; c <= columns.length; c++) {
        const cell = row.getCell(c)
        const style = colStyles[columns[c - 1].key] ?? {}
        cell.font = font(style.font)
        cell.fill = fill(ground)
        cell.alignment = { vertical: 'top', wrapText: true, ...style.alignment }
        cell.border = { bottom: hair }
        if (style.link && typeof cell.value === 'string' && /^https?:/.test(cell.value)) {
          cell.value = { text: cell.value, hyperlink: cell.value }
          cell.font = font({ color: argb(COLOR.dir), underline: true })
        }
      }
    }
    return ws
  }

  sheet(
    'Profile',
    COLOR.ok,
    [
      { header: 'Field', key: 'field', width: 16 },
      { header: 'Value', key: 'value', width: 96 },
    ],
    [
      ['Name', profile.name],
      ['Role', profile.role],
      ['Summary', profile.summary],
      ...profile.contacts.map((c) => [c.label, c.value]),
      ['Interests', interests],
    ],
    { field: { font: { bold: true, color: argb(COLOR.dim) } } }
  )

  sheet(
    'Skills',
    COLOR.accent,
    [
      { header: 'Category', key: 'cat', width: 20 },
      { header: 'Skills', key: 'list', width: 70 },
    ],
    skills.map((s) => [s.cat, s.list]),
    { cat: { font: { bold: true, color: argb(COLOR.white) } } }
  )

  sheet(
    'Experience',
    COLOR.dir,
    [
      { header: 'Period', key: 'period', width: 24 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Title', key: 'title', width: 34 },
      { header: 'Company', key: 'company', width: 26 },
      { header: 'Description', key: 'desc', width: 60 },
      { header: 'Achievements', key: 'bullets', width: 84 },
    ],
    experience.map((exp) => [
      exp.date,
      exp.type ?? '',
      exp.title,
      exp.company,
      exp.desc,
      exp.bullets.map(([label, text]) => `› ${label} ${text}`).join('\n'),
    ]),
    {
      period: { font: { color: argb(COLOR.dim) } },
      type: { font: { color: argb(COLOR.dim) } },
      title: { font: { bold: true, color: argb(COLOR.white) } },
      company: { font: { bold: true, color: argb(COLOR.accent) } },
      desc: { font: { color: argb(COLOR.muted) } },
    }
  )

  sheet(
    'Projects',
    COLOR.cyan,
    [
      { header: 'Project', key: 'name', width: 34 },
      { header: 'Stack', key: 'stack', width: 54 },
      { header: 'Description', key: 'desc', width: 90 },
      { header: 'Repository', key: 'href', width: 56 },
    ],
    projects.map((p) => [p.name, p.stack, p.desc, p.href]),
    {
      name: { font: { bold: true, color: argb(COLOR.white) } },
      stack: { font: { color: argb(COLOR.accent) } },
      href: { link: true },
    }
  )

  sheet(
    'Education',
    COLOR.ok,
    [
      { header: 'Period', key: 'period', width: 16 },
      { header: 'Degree', key: 'degree', width: 34 },
      { header: 'Institution', key: 'school', width: 44 },
      { header: 'Status', key: 'status', width: 14 },
    ],
    education.map((ed) => [ed.date, ed.degree, ed.school, ed.note ?? '']),
    {
      period: { font: { color: argb(COLOR.dim) } },
      degree: { font: { bold: true, color: argb(COLOR.white) } },
      school: { font: { color: argb(COLOR.accent) } },
    }
  )

  sheet(
    'Certifications',
    COLOR.accent,
    [
      { header: 'Certification', key: 'name', width: 46 },
      { header: 'Issuer', key: 'issuer', width: 20 },
      { header: 'Year', key: 'year', width: 10 },
    ],
    certifications.map((c) => [c.name, c.issuer ?? '', c.year ?? '']),
    { name: { font: { color: argb(COLOR.white) } }, issuer: { font: { color: argb(COLOR.muted) } } }
  )

  const buffer = await wb.xlsx.writeBuffer()
  triggerDownload(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${BASENAME}.xlsx`
  )
}

// ---------------------------------------------------------------------------
// CSV — data only; there is nothing to style.
// ---------------------------------------------------------------------------

function csvEscape(value) {
  const str = String(value ?? '')
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function exportCsv() {
  const rows = [
    ['Section', 'Field', 'Value'],
    ['Profile', 'Name', profile.name],
    ['Profile', 'Role', profile.role],
    ['Profile', 'Summary', profile.summary],
    ...profile.contacts.map((c) => ['Contact', c.label, c.value]),
    ...skills.map((s) => ['Skills', s.cat, s.list]),
    ...experience.flatMap((exp) => [
      ['Experience', `${exp.title} · ${exp.company}`, dateLine(exp)],
      ['Experience', 'Description', exp.desc],
      ...exp.bullets.map(([label, text]) => ['Experience', label.replace(/:$/, ''), text]),
    ]),
    ...projects.flatMap((proj) => [
      ['Projects', proj.name, proj.stack],
      ['Projects', 'Description', proj.desc],
      ['Projects', 'Repository', proj.href],
    ]),
    ...education.map((ed) => ['Education', `${ed.degree} · ${ed.school}`, eduMeta(ed)]),
    ...certifications.map((c) => ['Certifications', c.name, certLine(c)]),
    ['Extras', 'Interests', interests],
  ]
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
  triggerDownload(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `${BASENAME}.csv`)
}

// ---------------------------------------------------------------------------
// Markdown — kept purely semantic: it is the format most likely to be pasted
// into someone else's system, where decoration only gets in the way.
// ---------------------------------------------------------------------------

function buildMarkdown() {
  const lines = [
    `# ${profile.name}`,
    '',
    `**${profile.role}**`,
    '',
    profile.contacts.map(contactLine).join(' · '),
    '',
    '## Summary',
    '',
    profile.summary,
    '',
    '## Core Stack',
    '',
    ...skills.map((s) => `- **${s.cat}:** ${s.list}`),
    '',
    '## Experience',
    '',
  ]
  experience.forEach((exp) => {
    lines.push(`### ${exp.title} · ${exp.company}`, '', `*${dateLine(exp)}*`, '', exp.desc, '')
    exp.bullets.forEach(([label, text]) => lines.push(`- **${label}** ${text}`))
    lines.push('')
  })
  lines.push('## Selected Projects', '')
  projects.forEach((proj) => {
    lines.push(`### [${proj.name}](${proj.href})`, '', `*${proj.stack}*`, '', proj.desc, '')
  })
  lines.push('## Education', '')
  education.forEach((ed) => {
    lines.push(`### ${ed.degree} · ${ed.school}`, '', `*${eduMeta(ed)}*`, '')
  })
  lines.push(
    '## Certifications',
    '',
    ...certifications.map((c) => `- ${certLine(c)}`),
    '',
    '## Interests',
    '',
    interests,
    ''
  )
  return lines.join('\n')
}

function exportMd() {
  triggerDownload(new Blob([buildMarkdown()], { type: 'text/markdown;charset=utf-8' }), `${BASENAME}.md`)
}

// ---------------------------------------------------------------------------
// Plain text — the one format that is *natively* the site's terminal: the
// same prompt as the social card, box-drawing rules, and › bullets, wrapped to
// a classic 78 columns so it reads the same in Notepad, less, or an email.
// ---------------------------------------------------------------------------

const COLS = 78

function wrap(text, width = COLS, indent = '') {
  const out = []
  let line = indent
  for (const word of String(text).split(/\s+/)) {
    if (line.length + word.length + (line.length > indent.length ? 1 : 0) > width && line.length > indent.length) {
      out.push(line)
      line = indent + word
    } else {
      line += (line.length > indent.length ? ' ' : '') + word
    }
  }
  if (line.length > indent.length) out.push(line)
  return out
}

/** Wrap with a hanging indent: the marker on the first line, continuations indented under the text. */
function hang(text, first, rest) {
  return wrap(text, COLS, rest).map((line, i) => (i ? line : first + line.slice(rest.length)))
}

function rule(title) {
  const head = `── ${title.toUpperCase()} `
  return head + '─'.repeat(Math.max(0, COLS - head.length))
}

/** "Title · Company" on the left, the date flush right, on one line if it fits. */
function headline(left, right) {
  const gap = COLS - left.length - right.length
  return gap >= 2 ? left + ' '.repeat(gap) + right : [left, ' '.repeat(Math.max(0, COLS - right.length)) + right]
}

function buildTxt() {
  const lines = [
    promptLine('whoami'),
    profile.name,
    '',
    promptLine('cat role.txt'),
    ...wrap(profile.role),
    '',
    promptLine('cat contacts'),
    ...profile.contacts.map((c) => `  ${contactLine(c)}`),
    '',
    rule('Summary'),
    ...wrap(profile.summary),
    '',
    rule('Core Stack'),
    ...skills.flatMap((s) => hang(`› ${s.cat}: ${s.list}`, '  ', '    ')),
    '',
    rule('Experience'),
  ]
  experience.forEach((exp, i) => {
    if (i) lines.push('')
    lines.push(...[].concat(headline(`${exp.title} · ${exp.company}`, dateLine(exp))))
    lines.push(...wrap(exp.desc, COLS, '  '))
    exp.bullets.forEach(([label, text]) => lines.push(...hang(`› ${label} ${text}`, '  ', '    ')))
  })
  lines.push('', rule('Selected Projects'))
  projects.forEach((proj, i) => {
    if (i) lines.push('')
    lines.push(...[].concat(headline(proj.name, projectRepoLine(proj))))
    lines.push(...wrap(proj.stack, COLS, '  '))
    lines.push(...wrap(proj.desc, COLS, '  '))
  })
  lines.push('', rule('Education'))
  education.forEach((ed) => {
    lines.push(...[].concat(headline(`${ed.degree} · ${ed.school}`, eduMeta(ed))))
  })
  lines.push('', rule('Certifications'), ...certifications.map((c) => `  › ${certLine(c)}`))
  lines.push('', rule('Interests'), ...wrap(interests), '')
  return lines.join('\n')
}

function exportTxt() {
  triggerDownload(new Blob([buildTxt()], { type: 'text/plain;charset=utf-8' }), `${BASENAME}.txt`)
}

export const CV_FORMATS = [
  { id: 'pdf', label: 'PDF', hint: 'Print-ready document', icon: 'file-pdf', run: exportPdf },
  { id: 'docx', label: 'DOCX', hint: 'Microsoft Word', icon: 'file-word', run: exportDocx },
  { id: 'xlsx', label: 'XLSX', hint: 'Excel spreadsheet', icon: 'file-excel', run: exportXlsx },
  { id: 'csv', label: 'CSV', hint: 'Structured data', icon: 'file-csv', run: exportCsv },
  { id: 'md', label: 'MD', hint: 'Markdown', icon: 'markdown', run: exportMd },
  { id: 'txt', label: 'TXT', hint: 'Plain text', icon: 'file-lines', run: exportTxt },
]
