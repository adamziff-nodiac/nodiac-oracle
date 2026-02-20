'use client'

import { COLOR_LOW, COLOR_MID_LOW, COLOR_MID, COLOR_HIGH, COLOR_ORCHID, COLOR_PEAK } from './CountyChoropleth'
import type { ColorMode } from './CountyChoropleth'
import type { ViewMode } from './HubMap'

interface MapLegendProps {
  scoreRange: readonly [number, number]
  highlightThreshold?: number
  colorMode?: ColorMode
  viewMode?: ViewMode
  clusterCount?: number
}

const legendBox = "absolute bottom-4 right-4 bg-white/80 dark:bg-nodiac-dark/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 z-10"

export function MapLegend({ scoreRange, highlightThreshold = 6.5, colorMode = 'percentile', viewMode = 'county', clusterCount }: MapLegendProps) {
  // --- Outline mode ---
  if (viewMode === 'outline') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Hub Outlines
        </p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border-2 border-[#c77dba] bg-[#490f42]/30" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Hub region</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#0a0810]" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Outside</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          {clusterCount != null ? `${clusterCount} hub region${clusterCount !== 1 ? 's' : ''} detected` : 'Convex hull outlines'}
        </p>
      </div>
    )
  }

  // --- Gradient mode ---
  if (viewMode === 'gradient') {
    const GRAD_LOW = '#1e1e24'
    const GRAD_MID_LOW = '#1a2040'
    const GRAD_HIGH = '#6b1f5a'
    const GRAD_PEAK = '#c77dba'
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Hub Gradient
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">Low</span>
          <div
            className="h-3 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${GRAD_LOW}, ${GRAD_MID_LOW}, ${GRAD_HIGH}, ${GRAD_PEAK})`,
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">High</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-3 h-3 rounded-sm bg-[#0d0b12]" />
          <span className="text-xs text-gray-500 dark:text-gray-400">Outside hubs</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          {clusterCount != null ? `${clusterCount} hub region${clusterCount !== 1 ? 's' : ''}` : 'Score gradient within hubs'}
        </p>
      </div>
    )
  }

  // --- Regions mode ---
  if (viewMode === 'regions') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Hub Regions
        </p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#c77dba]" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Top county</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#3a2050]" />
            <span className="text-xs text-gray-500 dark:text-gray-400">In region</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#0d0b12]" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Outside</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          {clusterCount != null ? `${clusterCount} hub region${clusterCount !== 1 ? 's' : ''} detected` : 'County-level cluster membership'}
        </p>
      </div>
    )
  }

  // --- County mode (default): percentile or absolute ---
  if (colorMode === 'percentile') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Composite Score
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">Low</span>
          <div
            className="h-3 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${COLOR_LOW}, ${COLOR_MID_LOW}, ${COLOR_HIGH}, ${COLOR_PEAK})`,
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">High</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          Quantile scale · Top 10% in <span className="text-[#c77dba] font-medium">orchid</span>
        </p>
      </div>
    )
  }

  // Absolute mode
  const thresholdPct = (highlightThreshold / 10) * 100

  return (
    <div className={legendBox}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
        Composite Score
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">0</span>
        <div className="relative">
          <div
            className="h-3 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${COLOR_LOW}, ${COLOR_MID_LOW}, ${COLOR_MID}, ${COLOR_HIGH}, ${COLOR_ORCHID} ${thresholdPct}%, ${COLOR_PEAK})`,
            }}
          />
          {/* Threshold tick mark */}
          <div
            className="absolute top-0 h-3 w-px bg-black/30 dark:bg-white/60"
            style={{ left: `${thresholdPct}%` }}
          />
          <div
            className="absolute top-3.5 text-[9px] text-gray-500 dark:text-gray-400 tabular-nums -translate-x-1/2"
            style={{ left: `${thresholdPct}%` }}
          >
            {highlightThreshold}
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">10</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-3">
        Threshold: {highlightThreshold} · Above glows <span className="text-[#c77dba] font-medium">orchid</span>
      </p>
    </div>
  )
}
