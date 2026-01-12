'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('nodiac-oracle-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('nodiac-oracle-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('nodiac-oracle-theme', 'light')
    }
  }

  // Avoid hydration mismatch
  if (!isMounted) {
    return (
      <button
        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        aria-label="Toggle theme"
      >
        <div className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  )
}
