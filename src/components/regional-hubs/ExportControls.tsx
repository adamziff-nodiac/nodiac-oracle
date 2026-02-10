'use client'

import { useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { Download } from 'lucide-react'

interface ExportControlsProps {
  targetRef: React.RefObject<HTMLDivElement | null>
}

export function ExportControls({ targetRef }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    if (!targetRef.current || isExporting) return

    setIsExporting(true)
    try {
      const dataUrl = await toPng(targetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        width: 1920,
        height: 1080,
        backgroundColor: '#0f0f1a',
      })

      const link = document.createElement('a')
      link.download = `nodiac-regional-hubs-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }, [targetRef, isExporting])

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
    >
      <Download className="w-3.5 h-3.5" />
      {isExporting ? 'Exporting...' : 'Export PNG'}
    </button>
  )
}
