import { useState } from 'react'
import Icon from './Icon.jsx'
import CvFormatDialog from './CvFormatDialog.jsx'

function DownloadCvButton({ className = '', onDownloaded }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`download-cv-btn cursor-target ${className}`}
        onClick={() => setDialogOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={dialogOpen}
      >
        <Icon name="download" />
        {/* Rolls up on hover like the header links beside it. */}
        <span className="download-cv-btn__label">
          <span className="nav-link-roll" data-text="Download CV">Download CV</span>
        </span>
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
