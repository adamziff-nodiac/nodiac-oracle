'use client'

import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StyledCheckboxProps {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  className?: string
}

export function StyledCheckbox({ checked, indeterminate, onChange, className }: StyledCheckboxProps) {
  const isActive = checked || indeterminate
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={e => { e.stopPropagation(); onChange() }}
      className={cn(
        'w-4 h-4 rounded flex items-center justify-center transition-all border flex-shrink-0',
        isActive
          ? 'bg-nodiac-secondary border-nodiac-secondary'
          : 'bg-transparent border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/40',
        className,
      )}
    >
      {checked && <Check className="w-2.5 h-2.5 text-nodiac-dark" strokeWidth={3} />}
      {indeterminate && !checked && <Minus className="w-2.5 h-2.5 text-nodiac-dark" strokeWidth={3} />}
    </button>
  )
}
