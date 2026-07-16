import { profile, skills, experience, interests, certifications } from '../data/cv.js'

const BASENAME = 'Sharifzoda_Bilol_CV'

function contactLine(c) {
  return c.label === 'Phone' ? c.value : `${c.label}: ${c.value}`
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
    heading('Technical Arsenal'),
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
        children: [new TextRun({ text: exp.date, italics: true, color: '777777', size: 18 })],
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
    heading('Interests'),
    new Paragraph({ children: [new TextRun(interests)] }),
    heading('Certifications'),
    new Paragraph({ children: [new TextRun(certifications)] }),
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
    ['Certifications', certifications],
  ]
  const wsProfile = XLSX.utils.aoa_to_sheet(profileRows)
  wsProfile['!cols'] = [{ wch: 16 }, { wch: 100 }]
  XLSX.utils.book_append_sheet(wb, wsProfile, 'Profile')

  const skillRows = [['Category', 'Skills'], ...skills.map((s) => [s.cat, s.list])]
  const wsSkills = XLSX.utils.aoa_to_sheet(skillRows)
  wsSkills['!cols'] = [{ wch: 20 }, { wch: 70 }]
  XLSX.utils.book_append_sheet(wb, wsSkills, 'Skills')

  const expRows = [['Period', 'Title', 'Company', 'Description', 'Achievements']]
  experience.forEach((exp) => {
    expRows.push([
      exp.date,
      exp.title,
      exp.company,
      exp.desc,
      exp.bullets.map(([label, text]) => `${label} ${text}`).join('\n'),
    ])
  })
  const wsExp = XLSX.utils.aoa_to_sheet(expRows)
  wsExp['!cols'] = [{ wch: 24 }, { wch: 34 }, { wch: 26 }, { wch: 60 }, { wch: 80 }]
  XLSX.utils.book_append_sheet(wb, wsExp, 'Experience')

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
      ['Experience', `${exp.title} · ${exp.company}`, exp.date],
      ['Experience', 'Description', exp.desc],
      ...exp.bullets.map(([label, text]) => ['Experience', label.replace(/:$/, ''), text]),
    ]),
    ['Extras', 'Interests', interests],
    ['Extras', 'Certifications', certifications],
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
    '## Technical Arsenal',
    '',
    ...skills.map((s) => `- **${s.cat}:** ${s.list}`),
    '',
    '## Experience',
    '',
  ]
  experience.forEach((exp) => {
    lines.push(`### ${exp.title} · ${exp.company}`, '', `*${exp.date}*`, '', exp.desc, '')
    exp.bullets.forEach(([label, text]) => lines.push(`- **${label}** ${text}`))
    lines.push('')
  })
  lines.push('## Interests', '', interests, '', '## Certifications', '', certifications, '')
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
    'TECHNICAL ARSENAL',
    sub,
    ...skills.map((s) => `  * ${s.cat}: ${s.list}`),
    '',
    'EXPERIENCE',
    sub,
  ]
  experience.forEach((exp) => {
    lines.push('', `${exp.title} - ${exp.company}`, `(${exp.date})`, '', exp.desc)
    exp.bullets.forEach(([label, text]) => lines.push(`  > ${label} ${text}`))
  })
  lines.push('', 'INTERESTS', sub, interests, '', 'CERTIFICATIONS', sub, certifications, '')
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
