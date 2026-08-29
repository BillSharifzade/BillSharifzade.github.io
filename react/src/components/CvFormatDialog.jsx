import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CV_FORMATS } from '../utils/cvExporters.js'
import './CvFormatDialog.css'

function CvFormatDialog({ open, onClose, onDownloaded }) {
  const [busyFormat, setBusyFormat] = useState(null)
  const [error, setError] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    const prevFocus = document.activeElement
    panelRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const items = panelRef.current?.querySelectorAll('button:not(:disabled)')
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        const inside = panelRef.current.contains(document.activeElement)
        if (!inside) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const lenis = window.__appLenis
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      lenis?.start()
      document.body.style.overflow = ''
      prevFocus?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  async function handlePick(format) {
    if (busyFormat) return
    setBusyFormat(format.id)
    setError(null)
    try {
      await format.run()
      onDownloaded?.()
      onClose()
    } catch (err) {
      console.error(`Failed to generate CV as ${format.id}`, err)
      setError(`Couldn't generate the ${format.label} file — check your connection and try again, or reload the page.`)
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
        tabIndex={-1}
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
        {error && (
          <p className="cv-dialog-error" role="alert">{error}</p>
        )}
      </div>
    </div>,
    document.body
  )
}

export default CvFormatDialog
