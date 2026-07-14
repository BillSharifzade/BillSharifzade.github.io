import { useState } from 'react'

function DownloadCvButton({ className = '', onDownloaded }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (loading) return
    setLoading(true)
    try {
      const [{ pdf }, { default: CvDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./CvDocument.jsx'),
      ])
      const blob = await pdf(<CvDocument />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'Sharifzoda_Bilol_CV.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      if (onDownloaded) onDownloaded()
    } catch (err) {
      console.error('Failed to generate CV PDF', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className={`download-cv-btn ${className}`}
      onClick={handleDownload}
      disabled={loading}
      aria-busy={loading}
    >
      <i className={loading ? 'fas fa-spinner fa-spin' : 'fas fa-download'}></i>
      <span>{loading ? 'Preparing…' : 'Download CV'}</span>
    </button>
  )
}

export default DownloadCvButton
