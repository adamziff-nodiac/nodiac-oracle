'use client'

import { COLOR_LOW, COLOR_MID, COLOR_HIGH, COLOR_PEAK } from './CountyChoropleth'

interface MapLegendProps {
  scoreRange: readonly [number, number]
}

export function MapLegend({ scoreRange }: MapLegendProps) {
  const [min, max] = scoreRange

  return (
    <div className="absolute bottom-4 right-4 bg-nodiac-dark/80 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-3 z-10">
      <p className="text-xs text-gray-400 mb-2 font-medium tracking-wide uppercase">
        Composite Score
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 tabular-nums">{min.toFixed(1)}</span>
        <div
          className="h-3 w-32 rounded-sm"
          style={{
            background: `linear-gradient(to right, ${COLOR_LOW}, ${COLOR_MID}, ${COLOR_HIGH}, ${COLOR_PEAK})`,
          }}
        />
        <span className="text-xs text-gray-400 tabular-nums">{max.toFixed(1)}</span>
      </div>
    </div>
  )
}
