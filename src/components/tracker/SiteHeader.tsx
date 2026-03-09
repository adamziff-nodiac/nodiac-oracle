'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrackerSiteOverview } from '@/lib/tracker/types'
import { PRIORITY_OPTIONS } from '@/lib/tracker/constants'
import { PriorityIndicator } from './PriorityIndicator'

interface SiteHeaderProps {
  site: TrackerSiteOverview
  backHref?: string
  onPriorityChange?: (priority: string) => void
}

export function SiteHeader({ site, backHref = '/tracker', onPriorityChange }: SiteHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Link
          href={backHref}
          className="flex items-center gap-1 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Portfolio
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {site.name}
        </h1>
        <div className="flex items-center gap-2 mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          {site.hub_name && <span>{site.hub_name}</span>}
          {site.utility_name && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
              <span>{site.utility_name}</span>
            </>
          )}
          {site.asset_owner_name && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
              <span>{site.asset_owner_name}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {onPriorityChange ? (
          <PriorityDropdown
            priority={site.priority ?? 'Pipeline'}
            onChange={onPriorityChange}
          />
        ) : (
          <PriorityIndicator priority={site.priority ?? 'Pipeline'} />
        )}
        <span className="px-2.5 py-1 rounded-md bg-nodiac-primary-dark/10 dark:bg-nodiac-primary/20 text-[13px] font-semibold text-nodiac-primary dark:text-nodiac-secondary tabular-nums">
          {site.mw_current ?? '--'} MW
        </span>
      </div>
    </div>
  )
}

function PriorityDropdown({ priority, onChange }: { priority: string; onChange: (p: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] px-2 py-1 rounded-md transition-colors cursor-pointer"
        title="Change priority"
      >
        <PriorityIndicator priority={priority} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-zinc-200 dark:border-[#2a2a40] bg-white dark:bg-[#16162a] shadow-xl shadow-black/10 dark:shadow-black/40 py-1">
          {PRIORITY_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors cursor-pointer',
                p === priority
                  ? 'bg-nodiac-secondary/5'
                  : 'hover:bg-zinc-50 dark:hover:bg-white/5'
              )}
            >
              <PriorityIndicator priority={p} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
