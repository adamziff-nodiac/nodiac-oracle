'use client'

import { useCallback } from 'react'
import type { CriterionKey } from '@/types/regional-hubs'
import { ALL_CRITERIA, CRITERION_LABELS, CRITERION_DESCRIPTIONS } from '@/types/regional-hubs'

interface WeightControlsProps {
  weights: Record<CriterionKey, number>
  onWeightChange: (weights: Record<CriterionKey, number>) => void
}

export function WeightControls({ weights, onWeightChange }: WeightControlsProps) {
  const handleChange = useCallback(
    (key: CriterionKey, value: number) => {
      onWeightChange({ ...weights, [key]: value })
    },
    [weights, onWeightChange]
  )

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wide uppercase">
        Criteria Weights
      </h3>

      {ALL_CRITERIA.map((key) => (
        <div key={key} className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs text-gray-600 dark:text-gray-300 font-medium" title={CRITERION_DESCRIPTIONS[key]}>
              {CRITERION_LABELS[key]}
            </label>
            <span className="text-xs text-[#c77dba] tabular-nums font-mono">
              {weights[key].toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={weights[key]}
            onChange={(e) => handleChange(key, parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
              bg-gray-200 dark:bg-white/10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[#c77dba]
              [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(199,125,186,0.4)]
              [&::-webkit-slider-thumb]:transition-shadow
              [&::-webkit-slider-thumb]:hover:shadow-[0_0_10px_rgba(199,125,186,0.6)]"
          />
        </div>
      ))}
    </div>
  )
}
