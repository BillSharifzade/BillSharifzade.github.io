import { useEffect, useState } from 'react'

/**
 * False while React renders the pre-rendered first frame (at build time, and
 * again when it hydrates that markup in the browser); true once mounted.
 * Gates the parts that only make sense live, so they never reach the HTML.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
