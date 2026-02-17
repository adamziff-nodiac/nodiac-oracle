'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toPng } from 'html-to-image'
import { Download, ChevronDown } from 'lucide-react'
import type { ViewMode } from './HubMap'

interface DimensionPreset {
  label: string
  width: number
  height: number
}

const DIMENSION_PRESETS: DimensionPreset[] = [
  { label: '1920 × 1080 (16:9)', width: 1920, height: 1080 },
  { label: '2560 × 1440 (QHD)', width: 2560, height: 1440 },
  { label: '3840 × 2160 (4K)', width: 3840, height: 2160 },
  { label: '1280 × 720 (Small)', width: 1280, height: 720 },
]

interface ExportControlsProps {
  targetRef: React.RefObject<HTMLDivElement | null>
  viewMode?: ViewMode
}

export function ExportControls({ targetRef, viewMode = 'county' }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!showPresets) return
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPresets(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPresets])

  const getExportDimensions = useCallback(() => {
    if (selectedPreset === -1) {
      const w = parseInt(customWidth) || 1920
      const h = parseInt(customHeight) || 1080
      return { width: w, height: h }
    }
    const preset = DIMENSION_PRESETS[selectedPreset]
    return { width: preset.width, height: preset.height }
  }, [selectedPreset, customWidth, customHeight])

  const handleExport = useCallback(async () => {
    if (!targetRef.current || isExporting) return

    setIsExporting(true)
    setShowPresets(false)
    try {
      const { width, height } = getExportDimensions()
      const dataUrl = await toPng(targetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        width,
        height,
        backgroundColor: '#0f0f1a',
      })

      const link = document.createElement('a')
      link.download = `nodiac-regional-hubs-${viewMode}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }, [targetRef, isExporting, getExportDimensions, viewMode])

  const currentLabel = selectedPreset === -1
    ? `${customWidth || 1920} × ${customHeight || 1080}`
    : DIMENSION_PRESETS[selectedPreset].label

  return (
    <div className="relative" ref={popoverRef}>
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-l-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 border-r-0 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {isExporting ? 'Exporting...' : 'Export PNG'}
        </button>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center px-1.5 py-1.5 rounded-r-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {showPresets && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-nodiac-dark border border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
          <p className="px-3 pt-2 pb-1 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">
            Export Size
          </p>
          {DIMENSION_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => { setSelectedPreset(i); setShowPresets(false) }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                selectedPreset === i
                  ? 'bg-nodiac-secondary/10 text-nodiac-secondary'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <div className="border-t border-gray-200 dark:border-white/10 px-3 py-2">
            <button
              onClick={() => setSelectedPreset(-1)}
              className={`text-xs mb-1.5 ${
                selectedPreset === -1
                  ? 'text-nodiac-secondary font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Custom
            </button>
            {selectedPreset === -1 && (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="1920"
                  value={customWidth}
                  onChange={e => setCustomWidth(e.target.value)}
                  className="w-16 px-1.5 py-1 text-xs rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-gray-400">×</span>
                <input
                  type="number"
                  placeholder="1080"
                  value={customHeight}
                  onChange={e => setCustomHeight(e.target.value)}
                  className="w-16 px-1.5 py-1 text-xs rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
