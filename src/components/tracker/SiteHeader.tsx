'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { TrackerSiteOverview } from '@/lib/tracker/types'
import { PriorityIndicator } from './PriorityIndicator'

interface SiteHeaderProps {
  site: TrackerSiteOverview
  backHref?: string
}

export function SiteHeader({ site, backHref = '/tracker' }: SiteHeaderProps) {
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
        <PriorityIndicator priority={site.priority ?? 'Pipeline'} />
        <span className="px-2.5 py-1 rounded-md bg-nodiac-primary-dark/10 dark:bg-nodiac-primary/20 text-[13px] font-semibold text-nodiac-primary dark:text-nodiac-secondary tabular-nums">
          {site.mw_current ?? '--'} MW
        </span>
      </div>
    </div>
  )
}
