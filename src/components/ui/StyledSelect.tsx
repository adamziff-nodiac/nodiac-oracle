'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface StyledSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  size?: 'xs' | 'sm' | 'md'
  variant?: 'default' | 'ghost' | 'inline'
  className?: string
  align?: 'left' | 'right'
}

const sizeStyles = {
  xs: 'text-[11px] px-1.5 py-0.5 gap-1',
  sm: 'text-[12px] px-2 py-1 gap-1.5',
  md: 'text-[13px] px-3 py-1.5 gap-2',
}

const variantStyles = {
  default:
    'bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg hover:border-zinc-300 dark:hover:border-[#3a3a50]',
  ghost:
    'bg-transparent border border-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.04] rounded-lg',
  inline:
    'bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 rounded-none',
}

export function StyledSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  size = 'sm',
  variant = 'default',
  className,
  align = 'left',
}: StyledSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between w-full font-medium transition-colors cursor-pointer whitespace-nowrap',
          sizeStyles[size],
          variantStyles[variant],
          open && variant === 'default' && 'border-nodiac-secondary/50 dark:border-nodiac-secondary/30',
          open && variant === 'inline' && 'border-nodiac-secondary',
          selected ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-500'
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          className={cn(
            'w-3 h-3 text-zinc-400 dark:text-zinc-500 flex-shrink-0 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-full w-max max-h-56 overflow-y-auto',
            'bg-white dark:bg-[#1e1e30] rounded-lg',
            'border border-zinc-200/80 dark:border-white/[0.08]',
            'shadow-lg dark:shadow-2xl',
            'py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors cursor-pointer',
                  size === 'xs' ? 'text-[11px]' : size === 'sm' ? 'text-[12px]' : 'text-[13px]',
                  isSelected
                    ? 'text-nodiac-secondary bg-nodiac-secondary/5'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
                )}
              >
                <Check
                  className={cn(
                    'w-3 h-3 flex-shrink-0',
                    isSelected ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
