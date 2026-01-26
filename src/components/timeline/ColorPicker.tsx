'use client'

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TIMELINE_ROW_COLORS } from '@/types/timeline'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)} data-edit-control>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-white/40 transition-colors flex-shrink-0"
        style={{ backgroundColor: value }}
        aria-label="Change color"
      />

      {isOpen && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-3 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-[100]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-4 gap-2" style={{ width: '140px' }}>
            {TIMELINE_ROW_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(color.value)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 flex-shrink-0',
                  value === color.value && 'ring-2 ring-white ring-offset-2 ring-offset-slate-800'
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {value === color.value && <Check className="w-3 h-3 text-white drop-shadow-md" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
