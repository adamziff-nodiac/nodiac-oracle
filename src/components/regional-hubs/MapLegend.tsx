'use client'

import { ChevronDown } from 'lucide-react'
import { COLOR_LOW, COLOR_MID_LOW, COLOR_MID, COLOR_HIGH, COLOR_ORCHID, COLOR_PEAK } from './CountyChoropleth'
import type { ColorMode } from './CountyChoropleth'
import type { ViewMode } from './HubMap'

interface ProspectiveSitesLegendInfo {
  ippCount: number
  substationCount: number
  radiusMiles: number
}

interface MapLegendProps {
  scoreRange: readonly [number, number]
  highlightThreshold?: number
  colorMode?: ColorMode
  viewMode?: ViewMode
  clusterCount?: number
  showGoogleDC?: boolean
  prospectiveSites?: ProspectiveSitesLegendInfo | null
  onCollapse?: () => void
}

const legendBox = "absolute bottom-4 right-4 bg-white/80 dark:bg-nodiac-dark/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 z-10"

function CollapseButton({ onCollapse }: { onCollapse?: () => void }) {
  if (!onCollapse) return null
  return (
    <button
      onClick={onCollapse}
      className="absolute top-2 right-2 p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      title="Collapse legend"
    >
      <ChevronDown className="w-3.5 h-3.5" />
    </button>
  )
}

export function MapLegend({ scoreRange, highlightThreshold = 6.5, colorMode = 'percentile', viewMode = 'county', clusterCount, showGoogleDC, prospectiveSites, onCollapse }: MapLegendProps) {
  // Overlay items shown across all view modes
  const overlayItems = (
    <>
      {showGoogleDC && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#4285F4] w-3 text-center">G</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Google DC</span>
        </div>
      )}
      {prospectiveSites && (
        <>
          {prospectiveSites.ippCount > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FFB800]" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Solar ({prospectiveSites.ippCount > 0 ? 'IPP' : ''})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#00B4D8]" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Wind</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#7B2FBE]" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Storage</span>
              </div>
            </>
          )}
          {prospectiveSites.substationCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Substation</span>
            </div>
          )}
          <p className="text-[10px] text-gray-500">
            {(prospectiveSites.ippCount + prospectiveSites.substationCount).toLocaleString()} sites within {prospectiveSites.radiusMiles}mi
          </p>
        </>
      )}
    </>
  )

  const hasOverlays = showGoogleDC || prospectiveSites
  const overlaySection = hasOverlays ? (
    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 flex flex-col gap-1.5">
      {overlayItems}
    </div>
  ) : null

  // --- Plain/Default mode ---
  if (viewMode === 'plain') {
    if (!hasOverlays) return null
    return (
      <div className={legendBox}>
        <CollapseButton onCollapse={onCollapse} />
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase pr-4">
          Map Overlays
        </p>
        {overlayItems}
      </div>
    )
  }

  // --- Outline mode ---
  if (viewMode === 'outline') {
    return (
      <div className={legendBox}>
        <CollapseButton onCollapse={onCollapse} />
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase pr-4">
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
        {overlaySection}
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
        <CollapseButton onCollapse={onCollapse} />
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase pr-4">
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
        {overlaySection}
      </div>
    )
  }

  // --- Regions mode ---
  if (viewMode === 'regions') {
    return (
      <div className={legendBox}>
        <CollapseButton onCollapse={onCollapse} />
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase pr-4">
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
        {overlaySection}
      </div>
    )
  }

  // --- County mode (default): percentile or absolute ---
  if (colorMode === 'percentile') {
    return (
      <div className={legendBox}>
        <CollapseButton onCollapse={onCollapse} />
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase pr-4">
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
        {overlaySection}
      </div>
    )
  }

  // Absolute mode
  const thresholdPct = (highlightThreshold / 10) * 100

  return (
    <div className={legendBox}>
      <CollapseButton onCollapse={onCollapse} />
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium tracking-wide uppercase pr-4">
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
      {overlaySection}
    </div>
  )
}
