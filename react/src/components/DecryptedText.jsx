import { useEffect, useRef, useState } from 'react'

const RANDOM_CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[]<>?/\\|~'

export default function DecryptedText({ text, play = true, intervalMs = 12, step = 2, className, ...rest }) {
  const [output, setOutput] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    if (!play) {
      setOutput(text)
      return
    }

    const length = text.length
    let frame = 0

    function tick() {
      frame += 1
      const revealCount = Math.min(length, Math.floor(frame / step))
      let result = ''
      for (let i = 0; i < length; i++) {
        if (i < revealCount || text[i] === ' ') {
          result += text[i]
        } else {
          result += RANDOM_CHAR_SET[Math.floor(Math.random() * RANDOM_CHAR_SET.length)]
        }
      }
      setOutput(result)
      if (revealCount < length) {
        timerRef.current = setTimeout(tick, intervalMs)
      }
    }

    tick()
    return () => timerRef.current && clearTimeout(timerRef.current)
  }, [text, play, intervalMs, step])

  return (
    <span className={className} {...rest}>{output}</span>
  )
}


