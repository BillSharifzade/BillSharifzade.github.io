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

const BASENAME = 'Sharifzoda_Bilol_CV'

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Synchronous revocation can abort the download on Safari/iOS before the
  // browser has opened the blob; 40s is FileSaver.js's battle-tested delay.
  setTimeout(() => URL.revokeObjectURL(url), 40_000)
}

async function exportPdf() {
  const [{ pdf }, { default: CvDocument }, { createElement }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/CvDocument.jsx'),
    import('react'),
  ])
  const blob = await pdf(createElement(CvDocument)).toBlob()
  triggerDownload(blob, `${BASENAME}.pdf`)
}

async function exportDocx() {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx')

  const heading = (text) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, color: '1a1a1a' })],
    })

  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: profile.name, bold: true })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: profile.role, color: '5b63c7', bold: true })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '818cf8' } },
      children: [new TextRun({ text: profile.contacts.map(contactLine).join('   ·   '), color: '555555', size: 18 })],
    }),
    heading('Summary'),
    new Paragraph({ children: [new TextRun(profile.summary)] }),
    heading('Core Stack'),
    ...skills.map(
      (s) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: `${s.cat}: `, bold: true }), new TextRun(s.list)],
        })
    ),
    heading('Experience'),
    ...experience.flatMap((exp) => [
      new Paragraph({
        spacing: { before: 200, after: 40 },
        children: [
          new TextRun({ text: exp.title, bold: true }),
          new TextRun({ text: ` · ${exp.company}`, bold: true, color: '5b63c7' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: dateLine(exp), italics: true, color: '777777', size: 18 })],
      }),
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun(exp.desc)] }),
      ...exp.bullets.map(
        ([label, text]) =>
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: `${label} `, bold: true }), new TextRun(text)],
          })
      ),
    ]),
    heading('Selected Projects'),
    ...projects.flatMap((proj) => [
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: proj.name, bold: true })] }),
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: proj.stack, color: '5b63c7', size: 18 })],
      }),
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun(proj.desc)] }),
      new Paragraph({
        spacing: { after: 140 },
        children: [new TextRun({ text: projectRepoLine(proj), italics: true, color: '777777', size: 18 })],
      }),
    ]),
    heading('Education'),
    ...education.flatMap((ed) => [
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: ed.degree, bold: true }),
          new TextRun({ text: ` · ${ed.school}`, bold: true, color: '5b63c7' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: ed.note ? `${ed.date} · ${ed.note}` : ed.date,
            italics: true,
            color: '777777',
            size: 18,
          }),
        ],
      }),
    ]),
    heading('Certifications'),
    ...certifications.map(
      (c) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun(certLine(c))] })
    ),
    heading('Interests'),
    new Paragraph({ children: [new TextRun(interests)] }),
  ]

  const doc = new Document({
    creator: profile.name,
    title: `${profile.name} - CV`,
    sections: [{ children }],
  })

  const blob = await Packer.toBlob(doc)
  triggerDownload(blob, `${BASENAME}.docx`)
}

async function exportXlsx() {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  const profileRows = [
    ['Name', profile.name],
    ['Role', profile.role],
    ['Summary', profile.summary],
    ...profile.contacts.map((c) => [c.label, c.value]),
    ['Interests', interests],
  ]
  const wsProfile = XLSX.utils.aoa_to_sheet(profileRows)
  wsProfile['!cols'] = [{ wch: 16 }, { wch: 100 }]
  XLSX.utils.book_append_sheet(wb, wsProfile, 'Profile')

  const skillRows = [['Category', 'Skills'], ...skills.map((s) => [s.cat, s.list])]
  const wsSkills = XLSX.utils.aoa_to_sheet(skillRows)
  wsSkills['!cols'] = [{ wch: 20 }, { wch: 70 }]
  XLSX.utils.book_append_sheet(wb, wsSkills, 'Skills')

  const expRows = [['Period', 'Type', 'Title', 'Company', 'Description', 'Achievements']]
  experience.forEach((exp) => {
    expRows.push([
      exp.date,
      exp.type ?? '',
      exp.title,
      exp.company,
      exp.desc,
      exp.bullets.map(([label, text]) => `${label} ${text}`).join('\n'),
    ])
  })
  const wsExp = XLSX.utils.aoa_to_sheet(expRows)
  wsExp['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 34 }, { wch: 26 }, { wch: 60 }, { wch: 80 }]
  XLSX.utils.book_append_sheet(wb, wsExp, 'Experience')

  const projRows = [
    ['Project', 'Stack', 'Description', 'Repository'],
    ...projects.map((proj) => [proj.name, proj.stack, proj.desc, proj.href]),
  ]
  const wsProj = XLSX.utils.aoa_to_sheet(projRows)
  wsProj['!cols'] = [{ wch: 34 }, { wch: 54 }, { wch: 90 }, { wch: 56 }]
  XLSX.utils.book_append_sheet(wb, wsProj, 'Projects')

  const eduRows = [
    ['Period', 'Degree', 'Institution', 'Status'],
    ...education.map((ed) => [ed.date, ed.degree, ed.school, ed.note ?? '']),
  ]
  const wsEdu = XLSX.utils.aoa_to_sheet(eduRows)
  wsEdu['!cols'] = [{ wch: 16 }, { wch: 34 }, { wch: 44 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsEdu, 'Education')

  const certRows = [
    ['Certification', 'Issuer', 'Year'],
    ...certifications.map((c) => [c.name, c.issuer ?? '', c.year ?? '']),
  ]
  const wsCerts = XLSX.utils.aoa_to_sheet(certRows)
  wsCerts['!cols'] = [{ wch: 46 }, { wch: 20 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, wsCerts, 'Certifications')

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  triggerDownload(
    new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${BASENAME}.xlsx`
  )
}

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
    ...education.map((ed) => [
      'Education',
      `${ed.degree} · ${ed.school}`,
      ed.note ? `${ed.date} · ${ed.note}` : ed.date,
    ]),
    ...certifications.map((c) => ['Certifications', c.name, certLine(c)]),
    ['Extras', 'Interests', interests],
  ]
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
  triggerDownload(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `${BASENAME}.csv`)
}

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
    lines.push(`### ${ed.degree} · ${ed.school}`, '', `*${ed.note ? `${ed.date} · ${ed.note}` : ed.date}*`, '')
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

function buildTxt() {
  const rule = '='.repeat(64)
  const sub = '-'.repeat(64)
  const lines = [
    profile.name.toUpperCase(),
    profile.role,
    rule,
    '',
    ...profile.contacts.map((c) => `  ${contactLine(c)}`),
    '',
    'SUMMARY',
    sub,
    profile.summary,
    '',
    'CORE STACK',
    sub,
    ...skills.map((s) => `  * ${s.cat}: ${s.list}`),
    '',
    'EXPERIENCE',
    sub,
  ]
  experience.forEach((exp) => {
    lines.push('', `${exp.title} - ${exp.company}`, `(${dateLine(exp)})`, '', exp.desc)
    exp.bullets.forEach(([label, text]) => lines.push(`  > ${label} ${text}`))
  })
  lines.push('', 'SELECTED PROJECTS', sub)
  projects.forEach((proj) => {
    lines.push('', proj.name, `(${proj.stack})`, '', proj.desc, `  ${proj.href}`)
  })
  lines.push('', 'EDUCATION', sub)
  education.forEach((ed) => {
    lines.push(`${ed.degree} - ${ed.school}`, `(${ed.note ? `${ed.date} · ${ed.note}` : ed.date})`)
  })
  lines.push(
    '',
    'CERTIFICATIONS',
    sub,
    ...certifications.map((c) => `  * ${certLine(c)}`),
    '',
    'INTERESTS',
    sub,
    interests,
    ''
  )
  return lines.join('\n')
}

function exportTxt() {
  triggerDownload(new Blob([buildTxt()], { type: 'text/plain;charset=utf-8' }), `${BASENAME}.txt`)
}

export const CV_FORMATS = [
  { id: 'pdf', label: 'PDF', hint: 'Print-ready document', icon: 'fas fa-file-pdf', run: exportPdf },
  { id: 'docx', label: 'DOCX', hint: 'Microsoft Word', icon: 'fas fa-file-word', run: exportDocx },
  { id: 'xlsx', label: 'XLSX', hint: 'Excel spreadsheet', icon: 'fas fa-file-excel', run: exportXlsx },
  { id: 'csv', label: 'CSV', hint: 'Structured data', icon: 'fas fa-file-csv', run: exportCsv },
  { id: 'md', label: 'MD', hint: 'Markdown', icon: 'fab fa-markdown', run: exportMd },
  { id: 'txt', label: 'TXT', hint: 'Plain text', icon: 'fas fa-file-lines', run: exportTxt },
]
