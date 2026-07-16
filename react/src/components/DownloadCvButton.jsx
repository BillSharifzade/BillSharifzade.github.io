import { useState } from 'react'
import CvFormatDialog from './CvFormatDialog.jsx'

function DownloadCvButton({ className = '', onDownloaded }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`download-cv-btn ${className}`}
        onClick={() => setDialogOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={dialogOpen}
      >
        <i className="fas fa-download"></i>
        <span>Download CV</span>
      </button>
      <CvFormatDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onDownloaded={onDownloaded}
      />
    </>
  )
}

export default DownloadCvButton
