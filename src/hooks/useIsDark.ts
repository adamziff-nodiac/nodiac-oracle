'use client'

import { useState, useEffect } from 'react'

export function useIsDark() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }
    return false
  })

  useEffect(() => {
    const root = document.documentElement
    setIsDark(root.classList.contains('dark'))

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'))
    })

    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return isDark
}
