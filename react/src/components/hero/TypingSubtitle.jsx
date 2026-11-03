import { useEffect, useState } from 'react'

const TYPING_TEXTS = ['Backend Architect', 'Founder of Mintaka']

/** Types each title out, holds it, deletes it, and moves on to the next. */
export default function TypingSubtitle({ texts = TYPING_TEXTS }) {
  const [textIndex, setTextIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentText = texts[textIndex]
    let timeoutId

    if (!isDeleting && charIndex === currentText.length) {
      timeoutId = setTimeout(() => setIsDeleting(true), 1500)
    } else if (isDeleting && charIndex === 0) {
      timeoutId = setTimeout(() => {
        setIsDeleting(false)
        setTextIndex((idx) => (idx + 1) % texts.length)
      }, 300)
    } else {
      const delay = isDeleting ? 50 : 100
      timeoutId = setTimeout(() => {
        setCharIndex((i) => i + (isDeleting ? -1 : 1))
      }, delay)
    }

    return () => clearTimeout(timeoutId)
  }, [charIndex, isDeleting, textIndex, texts])

  return <span className="typing-text">{texts[textIndex].substring(0, charIndex)}</span>
}
