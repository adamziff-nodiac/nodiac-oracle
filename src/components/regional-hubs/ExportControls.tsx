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
  /** Elements to hide when "Include panel" is unchecked */
  hideOnExportRefs?: React.RefObject<HTMLElement | null>[]
}

export function ExportControls({ targetRef, viewMode = 'county', hideOnExportRefs = [] }: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showPresets, setShowPresets] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [customWidth, setCustomWidth] = useState('')
  const [customHeight, setCustomHeight] = useState('')
  const [includePanel, setIncludePanel] = useState(false)
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

    // Hide elements that shouldn't appear in the export
    const hidden: HTMLElement[] = []
    // Always hide export button itself
    if (popoverRef.current) {
      popoverRef.current.style.display = 'none'
      hidden.push(popoverRef.current)
    }
    if (!includePanel) {
      for (const ref of hideOnExportRefs) {
        if (ref.current) {
          ref.current.style.display = 'none'
          hidden.push(ref.current)
        }
      }
    }

    try {
      const { width: targetW, height: targetH } = getExportDimensions()
      const el = targetRef.current
      const elRect = el.getBoundingClientRect()

      // Scale so the capture covers the target dimensions (may overshoot one axis)
      const scale = Math.max(targetW / elRect.width, targetH / elRect.height)
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: scale,
        backgroundColor: '#0f0f1a',
      })

      // Crop to exact target dimensions (center-crop the oversized axis)
      const img = new Image()
      img.src = dataUrl
      await new Promise<void>((resolve) => { img.onload = () => resolve() })

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')!
      const sx = Math.round((img.width - targetW) / 2)
      const sy = Math.round((img.height - targetH) / 2)
      ctx.drawImage(img, sx, sy, targetW, targetH, 0, 0, targetW, targetH)
      const croppedUrl = canvas.toDataURL('image/png')

      const link = document.createElement('a')
      link.download = `nodiac-regional-hubs-${viewMode}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = croppedUrl
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      // Restore hidden elements
      for (const el of hidden) {
        el.style.display = ''
      }
      setIsExporting(false)
    }
  }, [targetRef, isExporting, getExportDimensions, viewMode, includePanel, hideOnExportRefs])

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
                  ? 'bg-[#c77dba]/10 text-[#c77dba]'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <div className="border-t border-gray-200 dark:border-white/10 px-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={includePanel}
                onChange={e => setIncludePanel(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-white/20 text-[#c77dba] focus:ring-[#c77dba]/30 bg-transparent"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">Include side panel</span>
            </label>
          </div>
          <div className="border-t border-gray-200 dark:border-white/10 px-3 py-2">
            <button
              onClick={() => setSelectedPreset(-1)}
              className={`text-xs mb-1.5 ${
                selectedPreset === -1
                  ? 'text-[#c77dba] font-medium'
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
