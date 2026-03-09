'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

const LEGEND_ITEMS: { label: string; color: string | null; isGoogle?: boolean }[] = [
  { label: 'Google DC', color: null, isGoogle: true },
  { label: 'Solar (IPP)', color: '#FFB800' },
  { label: 'Wind', color: '#00B4D8' },
  { label: 'Storage', color: '#7B2FBE' },
  { label: 'Substation', color: '#22C55E' },
]

interface DCMapLegendProps {
  siteCount: number
  radiusMiles: number
}

export function DCMapLegend({ siteCount, radiusMiles }: DCMapLegendProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-nodiac-dark/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 z-10 select-none">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
      >
        Map Overlays
        {open
          ? <ChevronDown className="w-3 h-3" />
          : <ChevronRight className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              {item.isGoogle ? (
                <span className="text-[10px] font-bold text-[#4285F4] w-3 text-center">G</span>
              ) : (
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color! }} />
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
          <p className="text-[10px] text-gray-500 mt-0.5">
            {siteCount.toLocaleString()} sites within {radiusMiles}mi
          </p>
        </div>
      )}
    </div>
  )
}
