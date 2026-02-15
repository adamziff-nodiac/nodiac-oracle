'use client'

import { COLOR_P0, COLOR_P20, COLOR_P40, COLOR_P60, COLOR_P80, COLOR_P95 } from './CountyChoropleth'
import type { QuantileBreaks } from '@/hooks/useWeightedScores'

interface MapLegendProps {
  scoreRange: readonly [number, number]
  quantileBreaks?: QuantileBreaks | null
}

export function MapLegend({ scoreRange, quantileBreaks }: MapLegendProps) {
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
            background: `linear-gradient(to right, ${COLOR_P0}, ${COLOR_P20}, ${COLOR_P40}, ${COLOR_P60}, ${COLOR_P80}, ${COLOR_P95})`,
          }}
        />
        <span className="text-xs text-gray-400 tabular-nums">{max.toFixed(1)}</span>
      </div>
      {quantileBreaks && (
        <p className="text-[10px] text-gray-500 mt-1.5">
          Quantile scale &middot; Top 5% in <span className="text-[#4de2e4] font-medium">teal</span>
        </p>
      )}
    </div>
  )
}
