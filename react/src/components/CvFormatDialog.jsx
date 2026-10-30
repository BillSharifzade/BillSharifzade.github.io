import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon.jsx'
import { CV_FORMATS, downloadCv } from '../data/cvFormats.js'
import './CvFormatDialog.css'

function CvFormatDialog({ open, onClose, onDownloaded }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement
    panelRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const items = panelRef.current?.querySelectorAll('button, a[href]')
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

  // Each format is a file cvgen built ahead of time, so the links work as
  // plain links (open in a tab, copy the address). A click starts the download
  // from a detached link instead, because closing the dialog removes this one
  // before the browser would follow it.
  function handlePick(e, format) {
    e.preventDefault()
    downloadCv(format)
    onDownloaded?.()
    onClose()
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
          <Icon name="times" />
        </button>
        <h3 className="cv-dialog-title">Choose Format</h3>
        <p className="cv-dialog-subtitle">Pick how you'd like the CV delivered</p>
        <div className="cv-dialog-grid">
          {CV_FORMATS.map((format) => (
            <a
              key={format.id}
              className="cv-format-btn"
              href={format.href}
              download={format.file}
              onClick={(e) => handlePick(e, format)}
            >
              <Icon name={format.icon} />
              <span className="cv-format-label">{format.label}</span>
              <span className="cv-format-hint">{format.hint}</span>
            </a>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default CvFormatDialog
