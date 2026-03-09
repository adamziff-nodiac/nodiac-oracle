'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface FilterDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

function pluralize(word: string): string {
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies'
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') || word.endsWith('ch') || word.endsWith('sh')) return word + 'es'
  return word + 's'
}

export function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const plural = pluralize(label)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  const allSelected = selected.length === 0
  const buttonLabel = allSelected
    ? `All ${plural}`
    : selected.length === 1
      ? selected[0]
      : `${selected.length} ${plural}`

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  function clearAll() {
    onChange([])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-all duration-150 cursor-pointer',
          'border',
          !allSelected
            ? 'border-nodiac-secondary/40 bg-nodiac-secondary/8 text-nodiac-secondary dark:text-nodiac-secondary'
            : 'border-zinc-300 dark:border-[#2a2a40] text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
        )}
      >
        <span className="truncate max-w-[120px]">{buttonLabel}</span>
        <svg
          className={cn(
            'w-3 h-3 shrink-0 transition-transform duration-150',
            open && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] max-h-[280px] overflow-y-auto rounded-lg border border-zinc-200 dark:border-[#2a2a40] bg-white dark:bg-[#16162a] shadow-xl shadow-black/10 dark:shadow-black/40">
          {/* Clear / All option */}
          <button
            type="button"
            onClick={clearAll}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-left transition-colors',
              allSelected
                ? 'text-nodiac-secondary font-medium bg-nodiac-secondary/5'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
            )}
          >
            <span className={cn(
              'flex items-center justify-center w-3.5 h-3.5 rounded border transition-colors',
              allSelected
                ? 'border-nodiac-secondary bg-nodiac-secondary'
                : 'border-zinc-300 dark:border-zinc-600'
            )}>
              {allSelected && (
                <svg className="w-2.5 h-2.5 text-white dark:text-nodiac-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </span>
            All {plural}
          </button>

          <div className="h-px bg-zinc-100 dark:bg-[#2a2a40]" />

          {options.map(option => {
            const checked = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-left transition-colors',
                  checked
                    ? 'text-zinc-900 dark:text-zinc-100 bg-nodiac-secondary/5'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5'
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-3.5 h-3.5 rounded border transition-colors shrink-0',
                  checked
                    ? 'border-nodiac-secondary bg-nodiac-secondary'
                    : 'border-zinc-300 dark:border-zinc-600'
                )}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white dark:text-nodiac-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </span>
                <span className="truncate">{option}</span>
              </button>
            )
          })}

          {options.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-zinc-400 dark:text-zinc-600">
              No options
            </div>
          )}
        </div>
      )}
    </div>
  )
}
