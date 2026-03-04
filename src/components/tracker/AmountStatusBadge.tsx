'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { AMOUNT_STATUS_OPTIONS, type AmountStatus } from '@/lib/tracker/constants'

const STATUS_COLORS: Record<string, string> = {
  'Estimated': 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  'Quoted': 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  'Approved': 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  'Paid': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
}

interface AmountStatusBadgeProps {
  status: AmountStatus
  editable?: boolean
  onStatusChange?: (newStatus: AmountStatus) => void
}

export function AmountStatusBadge({ status, editable, onStatusChange }: AmountStatusBadgeProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()

    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function handleScroll() {
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePosition])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => editable && setOpen(!open)}
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium transition-colors duration-150',
          STATUS_COLORS[status],
          editable && 'cursor-pointer hover:ring-1 hover:ring-zinc-300 dark:hover:ring-zinc-600'
        )}
      >
        {status}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-32 py-1 bg-white dark:bg-[#1c1c34] border border-zinc-200 dark:border-[#2a2a40] rounded-lg shadow-lg shadow-black/10 dark:shadow-black/40"
          style={{ top: pos.top, left: pos.left }}
        >
          {AMOUNT_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onStatusChange?.(opt)
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] cursor-pointer transition-colors duration-100 text-left"
            >
              <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-medium', STATUS_COLORS[opt])}>
                {opt}
              </span>
              {opt === status && (
                <svg className="w-3.5 h-3.5 ml-auto text-nodiac-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}
