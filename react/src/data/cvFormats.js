/**
 * The CV downloads. cvgen (../cvgen, Rust) builds every file into public/cv/
 * before Vite runs, so a download is a plain static file: nothing is generated
 * in the visitor's browser.
 *
 * Kept free of asset imports: scripts/cv-json.mjs reads CV_BASENAME in Node.
 */
export const CV_BASENAME = 'Sharifzoda_Bilol_CV'

export const CV_FORMATS = [
  { id: 'pdf', label: 'PDF', hint: 'To read or print' },
  { id: 'docx', label: 'DOCX', hint: 'To edit in Word' },
  { id: 'xlsx', label: 'XLSX', hint: 'A sheet per section' },
  { id: 'csv', label: 'CSV', hint: 'A row per field' },
  { id: 'md', label: 'MD', hint: 'For notes and wikis' },
  { id: 'txt', label: 'TXT', hint: 'Pastes into any form' },
].map((f) => ({ ...f, file: `${CV_BASENAME}.${f.id}`, href: `/cv/${CV_BASENAME}.${f.id}` }))

/** Starts the download of one format. */
export function downloadCv(format) {
  const link = document.createElement('a')
  link.href = format.href
  link.download = format.file
  document.body.appendChild(link)
  link.click()
  link.remove()
}
