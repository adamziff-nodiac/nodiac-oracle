'use client'

import { Perspective, PERSPECTIVES } from '@/types'
import { cn } from '@/lib/utils'

type PerspectiveSelectorProps = {
  selectedPerspective: Perspective
  onPerspectiveChange: (perspective: Perspective) => void
  disabled?: boolean
}

const perspectiveIcons: Record<string, string> = {
  hyperscaler: '🏢',
  techvc: '💰',
  utility: '⚡',
  renewables: '🌱',
}

export function PerspectiveSelector({
  selectedPerspective,
  onPerspectiveChange,
  disabled,
}: PerspectiveSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Perspective
      </label>
      <div className="grid grid-cols-2 gap-2">
        {PERSPECTIVES.map((perspective) => (
          <button
            key={perspective.id}
            data-testid={`perspective-${perspective.id}`}
            onClick={() => onPerspectiveChange(perspective)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-start p-3 rounded-lg border-2 transition-all',
              'text-left text-sm',
              selectedPerspective.id === perspective.id
                ? 'border-nodiac-primary bg-nodiac-primary/5 text-nodiac-primary'
                : 'border-gray-200 hover:border-gray-300 text-gray-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span className="text-lg mb-1">{perspectiveIcons[perspective.id]}</span>
            <span className="font-medium leading-tight">{perspective.name}</span>
            <span className="text-xs text-gray-500 mt-0.5">{perspective.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
