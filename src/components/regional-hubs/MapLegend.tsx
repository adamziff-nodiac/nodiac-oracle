'use client'

import { COLOR_LOW, COLOR_MID_LOW, COLOR_MID, COLOR_HIGH, COLOR_ORCHID, COLOR_PEAK } from './CountyChoropleth'
import type { ColorMode } from './CountyChoropleth'
import type { ViewMode } from './HubMap'

interface MapLegendProps {
  scoreRange: readonly [number, number]
  highlightThreshold?: number
  colorMode?: ColorMode
  viewMode?: ViewMode
}

const legendBox = "absolute bottom-4 right-4 bg-white/80 dark:bg-nodiac-dark/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 z-10"

export function MapLegend({ scoreRange, highlightThreshold = 6.5, colorMode = 'percentile', viewMode = 'county' }: MapLegendProps) {
  // --- Hub (heatmap) mode ---
  if (viewMode === 'hub') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Hub Region Intensity
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">Low</span>
          <div
            className="h-3 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${COLOR_LOW}, ${COLOR_MID}, ${COLOR_HIGH}, ${COLOR_ORCHID}, ${COLOR_PEAK})`,
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">High</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          Blended from county scores
        </p>
      </div>
    )
  }

  // --- Top Counties mode ---
  if (viewMode === 'top-counties') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Top Counties
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#4de2e4] opacity-60" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Above threshold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: COLOR_LOW }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">Below</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          Top 20% of counties by composite score
        </p>
      </div>
    )
  }

  // --- Clusters mode ---
  if (viewMode === 'clusters') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Hub Clusters
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">Low</span>
          <div
            className="h-3 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${COLOR_MID}, ${COLOR_HIGH}, ${COLOR_ORCHID}, ${COLOR_PEAK})`,
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">High</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          Auto-detected clusters of top-scoring counties
        </p>
      </div>
    )
  }

  // --- Dots mode ---
  if (viewMode === 'dots') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Score Density
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">Low</span>
          <div
            className="h-3 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${COLOR_MID_LOW}, ${COLOR_MID}, ${COLOR_HIGH}, ${COLOR_ORCHID}, ${COLOR_PEAK})`,
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">High</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          Circle size + color encode score · Above median shown
        </p>
      </div>
    )
  }

  // --- Hex mode ---
  if (viewMode === 'hex') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Hex Grid Average
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">Low</span>
          <div
            className="h-3 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${COLOR_LOW}, ${COLOR_MID_LOW}, ${COLOR_MID}, ${COLOR_HIGH}, ${COLOR_ORCHID}, ${COLOR_PEAK})`,
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">High</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          ~50mi hexagons · Average of contained counties
        </p>
      </div>
    )
  }

  // --- Contours mode ---
  if (viewMode === 'contours') {
    return (
      <div className={legendBox}>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase">
          Score Contours
        </p>
        <div className="flex items-center gap-1.5">
          {[
            { color: '#3d2255', label: 'p50+' },
            { color: '#6b3580', label: 'p65+' },
            { color: '#b48fc1', label: 'p80+' },
            { color: '#4de2e4', label: 'p92+' },
          ].map(({ color, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <div className="w-6 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-[9px] text-gray-500 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          Nested bands · Brightest at score peaks
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
              background: `linear-gradient(to right, ${COLOR_LOW}, ${COLOR_MID_LOW}, ${COLOR_MID}, ${COLOR_HIGH}, ${COLOR_ORCHID}, ${COLOR_PEAK})`,
            }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">High</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-3">
          Quantile scale · Top 5% in <span className="text-[#4de2e4] font-medium">teal</span>
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
        Threshold: {highlightThreshold} · Above glows <span className="text-[#4de2e4] font-medium">teal</span>
      </p>
    </div>
  )
}
