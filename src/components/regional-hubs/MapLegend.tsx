'use client'

import { COLOR_LOW, COLOR_MID_LOW, COLOR_MID, COLOR_HIGH, COLOR_ORCHID, COLOR_PEAK } from './CountyChoropleth'

interface MapLegendProps {
  scoreRange: readonly [number, number]
  highlightThreshold?: number
}

export function MapLegend({ scoreRange, highlightThreshold = 6.5 }: MapLegendProps) {
  // Position of the threshold tick mark as a percentage of the bar width (0-10 scale)
  const thresholdPct = (highlightThreshold / 10) * 100

  return (
    <div className="absolute bottom-4 right-4 bg-nodiac-dark/80 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-3 z-10">
      <p className="text-xs text-gray-400 mb-2 font-medium tracking-wide uppercase">
        Composite Score
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 tabular-nums">0</span>
        <div className="relative">
          <div
            className="h-3 w-32 rounded-sm"
            style={{
              background: `linear-gradient(to right, ${COLOR_LOW}, ${COLOR_MID_LOW}, ${COLOR_MID}, ${COLOR_HIGH}, ${COLOR_ORCHID} ${thresholdPct}%, ${COLOR_PEAK})`,
            }}
          />
          {/* Threshold tick mark */}
          <div
            className="absolute top-0 h-3 w-px bg-white/60"
            style={{ left: `${thresholdPct}%` }}
          />
          <div
            className="absolute top-3.5 text-[9px] text-gray-400 tabular-nums -translate-x-1/2"
            style={{ left: `${thresholdPct}%` }}
          >
            {highlightThreshold}
          </div>
        </div>
        <span className="text-xs text-gray-400 tabular-nums">10</span>
      </div>
      <p className="text-[10px] text-gray-500 mt-3">
        Threshold: {highlightThreshold} &middot; Above glows <span className="text-[#4de2e4] font-medium">teal</span>
      </p>
    </div>
  )
}
