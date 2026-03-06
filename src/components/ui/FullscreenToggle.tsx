'use client'

import { useState, useEffect, useCallback } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FullscreenToggleProps {
  targetRef: React.RefObject<HTMLElement | null>
  className?: string
}

export function FullscreenToggle({ targetRef, className }: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = useCallback(() => {
    if (!targetRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      targetRef.current.requestFullscreen()
    }
  }, [targetRef])

  return (
    <button
      onClick={toggle}
      className={cn("p-2 rounded-lg bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm backdrop-blur-sm", className)}
      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
    >
      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </button>
  )
}
