'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import {
  type PhaseKey,
  type CheckpointStatus,
  type SubStepInfo,
  getCheckpointsByPhase,
  getCheckpointValue,
} from '@/lib/tracker/constants'

const DOT_COLORS: Record<string, string> = {
  'Not Started': 'bg-zinc-400',
  'In Progress': 'bg-amber-500',
  'Complete': 'bg-emerald-500',
  'Waiting': 'bg-amber-500',
  'N/A': 'bg-zinc-300 dark:bg-zinc-600',
}

interface SubStepBadgeProps {
  phase: PhaseKey
  subStep: SubStepInfo
  site: Record<string, unknown>
}

export function SubStepBadge({ phase, subStep, site }: SubStepBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left + rect.width / 2 })
    }
  }, [])

  useEffect(() => {
    if (!showTooltip) return
    updatePosition()

    function handleScroll() {
      setShowTooltip(false)
    }

    window.addEventListener('scroll', handleScroll, true)
    return () => {
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [showTooltip, updatePosition])

  // Not Started: all checkpoints are Not Started
  if (subStep.status === 'Not Started' && subStep.ordinal === 0) {
    // Check if truly not started (first checkpoint is Not Started)
    return (
      <span
        ref={badgeRef}
        className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-medium min-w-[56px] max-w-[84px] text-zinc-400 dark:text-zinc-600"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        --
        {showTooltip && <SubStepTooltip phase={phase} site={site} subStep={subStep} pos={pos} tooltipRef={tooltipRef} />}
      </span>
    )
  }

  // Complete: all checkpoints done
  if (subStep.checkpoint === null && subStep.status === 'Complete') {
    return (
      <span
        ref={badgeRef}
        className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-medium min-w-[56px] max-w-[84px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {showTooltip && <SubStepTooltip phase={phase} site={site} subStep={subStep} pos={pos} tooltipRef={tooltipRef} />}
      </span>
    )
  }

  // In Progress or Waiting
  const isWaiting = subStep.status === 'Waiting'
  const isFinancial = subStep.checkpoint?.financial ?? false

  return (
    <span
      ref={badgeRef}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium min-w-[56px] max-w-[84px] truncate transition-colors duration-150',
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        isWaiting && 'border-l-2 border-amber-500'
      )}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_COLORS[subStep.status])} />
      <span className="truncate">
        {isFinancial && <span className="text-amber-500/70 dark:text-amber-400/70 mr-0.5">$</span>}
        {subStep.checkpoint?.gridLabel}
      </span>
      {showTooltip && <SubStepTooltip phase={phase} site={site} subStep={subStep} pos={pos} tooltipRef={tooltipRef} />}
    </span>
  )
}

// Tooltip component showing all checkpoints in the phase
function SubStepTooltip({
  phase,
  site,
  subStep,
  pos,
  tooltipRef,
}: {
  phase: PhaseKey
  site: Record<string, unknown>
  subStep: SubStepInfo
  pos: { top: number; left: number }
  tooltipRef: React.RefObject<HTMLDivElement | null>
}) {
  const checkpoints = getCheckpointsByPhase(phase)

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[9999] py-1.5 px-1 bg-white dark:bg-[#1c1c34] border border-zinc-200 dark:border-[#2a2a40] rounded-lg shadow-lg shadow-black/10 dark:shadow-black/40 min-w-[180px] max-w-[240px]"
      style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
    >
      {checkpoints.map((cp) => {
        const status = (getCheckpointValue(site, cp.prefix, 'status') as CheckpointStatus) ?? 'Not Started'
        const isCurrent = subStep.checkpoint?.prefix === cp.prefix
        const amount = cp.financial ? getCheckpointValue(site, cp.prefix, 'amount') as number | null : null

        return (
          <div
            key={cp.prefix}
            className={cn(
              'flex items-center gap-2 px-2 py-1 rounded text-[11px]',
              isCurrent && 'bg-amber-50 dark:bg-amber-950/30'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_COLORS[status])} />
            <span className={cn(
              'text-zinc-600 dark:text-zinc-400 truncate flex-1',
              isCurrent && 'font-medium text-zinc-900 dark:text-zinc-200'
            )}>
              {cp.gridLabel}
            </span>
            {cp.financial && amount != null && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">
                ${amount.toLocaleString()}
              </span>
            )}
          </div>
        )
      })}
    </div>,
    document.body
  )
}
