'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { STATUS_OPTIONS, type CheckpointStatus } from '@/lib/tracker/constants'

const STATUS_BG: Record<string, string> = {
  'Not Started': 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500',
  'In Progress': 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  'Complete': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  'Waiting': 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  'N/A': 'bg-transparent text-zinc-400 dark:text-zinc-600',
}

const DOT_COLORS: Record<string, string> = {
  'Not Started': 'bg-zinc-400',
  'In Progress': 'bg-amber-500',
  'Complete': 'bg-emerald-500',
  'Waiting': 'bg-amber-500',
  'N/A': 'bg-zinc-300 dark:bg-zinc-600',
}

interface CheckpointStatusBadgeProps {
  status: CheckpointStatus
  editable?: boolean
  onStatusChange?: (newStatus: CheckpointStatus) => void
}

export function CheckpointStatusBadge({ status, editable, onStatusChange }: CheckpointStatusBadgeProps) {
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
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors duration-150',
          STATUS_BG[status],
          editable && 'cursor-pointer hover:ring-1 hover:ring-zinc-300 dark:hover:ring-zinc-600'
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full', DOT_COLORS[status])} />
        {status}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-40 py-1 bg-white dark:bg-[#1c1c34] border border-zinc-200 dark:border-[#2a2a40] rounded-lg shadow-lg shadow-black/10 dark:shadow-black/40"
          style={{ top: pos.top, left: pos.left }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onStatusChange?.(opt)
                setOpen(false)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-[13px] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] cursor-pointer transition-colors duration-100 text-left"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', DOT_COLORS[opt])} />
              <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
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
