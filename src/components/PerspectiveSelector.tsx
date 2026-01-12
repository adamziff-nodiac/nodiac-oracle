'use client'

import { Perspective, PERSPECTIVES } from '@/types'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type PerspectiveSelectorProps = {
  selectedPerspectives: Perspective[]
  onPerspectiveToggle: (perspective: Perspective) => void
  disabled?: boolean
}

const perspectiveIcons: Record<string, string> = {
  hyperscaler: '🏢',
  techvc: '💰',
  utility: '⚡',
  renewables: '🌱',
  gridoperator: '🔌',
  aiinfrastructure: '🤖',
  dcdeveloper: '🏗️',
  energypolicy: '📜',
  siteselection: '📍',
  equipmentsupplier: '⚙️',
}

export function PerspectiveSelector({
  selectedPerspectives,
  onPerspectiveToggle,
  disabled,
}: PerspectiveSelectorProps) {
  const isSelected = (perspective: Perspective) =>
    selectedPerspectives.some(p => p.id === perspective.id)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Perspectives <span className="text-gray-400 dark:text-gray-500 font-normal">(select one or more)</span>
      </label>
      <div className="space-y-2">
        {PERSPECTIVES.map((perspective) => {
          const selected = isSelected(perspective)
          return (
            <button
              key={perspective.id}
              data-testid={`perspective-${perspective.id}`}
              onClick={() => onPerspectiveToggle(perspective)}
              disabled={disabled}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all',
                'text-left text-sm',
                selected
                  ? 'border-nodiac-primary bg-nodiac-primary/5 dark:bg-nodiac-primary/10'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5',
                  selected
                    ? 'bg-nodiac-primary border-nodiac-primary'
                    : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'
                )}
              >
                {selected && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{perspectiveIcons[perspective.id]}</span>
                  <span className={cn('font-medium', selected ? 'text-nodiac-primary' : 'text-gray-700 dark:text-gray-300')}>
                    {perspective.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{perspective.description}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
