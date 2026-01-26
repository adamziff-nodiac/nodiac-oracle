'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Quarter, dateToQuarter, quarterToDate, formatQuarter } from '@/types/timeline'

interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
  minYear?: number
  maxYear?: number
  className?: string
}

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

export function DatePicker({
  value,
  onChange,
  minYear = 2020,
  maxYear = 2040,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { year: currentYear, quarter: currentQuarter } = dateToQuarter(value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  const handleSelect = (year: number, quarter: Quarter) => {
    onChange(quarterToDate(year, quarter))
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)} data-edit-control>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
      >
        {formatQuarter(value)}
        <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 max-h-64 overflow-auto">
          <div className="p-2 min-w-[180px]">
            {years.map((year) => (
              <div key={year} className="mb-2">
                <div className="text-xs text-gray-500 px-2 py-1">{year}</div>
                <div className="grid grid-cols-4 gap-1">
                  {QUARTERS.map((quarter) => (
                    <button
                      key={`${year}-${quarter}`}
                      onClick={() => handleSelect(year, quarter)}
                      className={cn(
                        'px-2 py-1 text-xs rounded transition-colors',
                        currentYear === year && currentQuarter === quarter
                          ? 'bg-nodiac-primary text-white'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {quarter}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
