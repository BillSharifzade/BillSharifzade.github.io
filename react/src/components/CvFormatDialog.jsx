import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CV_FORMATS } from '../utils/cvExporters.js'
import './CvFormatDialog.css'

function CvFormatDialog({ open, onClose, onDownloaded }) {
  const [busyFormat, setBusyFormat] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Freeze both native scroll and Lenis while the dialog is open.
    const lenis = window.__appLenis
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      lenis?.start()
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  async function handlePick(format) {
    if (busyFormat) return
    setBusyFormat(format.id)
    try {
      await format.run()
      onDownloaded?.()
      onClose()
    } catch (err) {
      console.error(`Failed to generate CV as ${format.id}`, err)
    } finally {
      setBusyFormat(null)
    }
  }

  return createPortal(
    <div
      className="cv-dialog-overlay"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target)) onClose()
      }}
    >
      <div
        className="cv-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Choose CV format"
        ref={panelRef}
      >
        <button type="button" className="cv-dialog-close" aria-label="Close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <h3 className="cv-dialog-title">Choose Format</h3>
        <p className="cv-dialog-subtitle">Pick how you'd like the CV delivered</p>
        <div className="cv-dialog-grid">
          {CV_FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              className={`cv-format-btn${busyFormat === format.id ? ' is-busy' : ''}`}
              onClick={() => handlePick(format)}
              disabled={busyFormat !== null}
              aria-busy={busyFormat === format.id}
            >
              <i className={busyFormat === format.id ? 'fas fa-spinner fa-spin' : format.icon}></i>
              <span className="cv-format-label">{format.label}</span>
              <span className="cv-format-hint">{format.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CvFormatDialog
