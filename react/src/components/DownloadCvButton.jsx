import { useState } from 'react'
import CvFormatDialog from './CvFormatDialog.jsx'
import { burst } from '../utils/burst.js'

const BTN_BURST = { count: 10, distances: [58, 10], time: 420 }

function DownloadCvButton({ className = '', onDownloaded }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`download-cv-btn cursor-target ${className}`}
        onClick={() => setDialogOpen(true)}
        onMouseEnter={(e) => burst(e.currentTarget, BTN_BURST)}
        onFocus={(e) => burst(e.currentTarget, BTN_BURST)}
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
