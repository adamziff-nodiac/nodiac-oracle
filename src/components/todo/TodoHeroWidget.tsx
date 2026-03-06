'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ListChecks, Clock, AlertTriangle } from 'lucide-react'
import type { ActionItemWithContext } from '@/lib/tracker/types'

interface TodoStats {
  next: number
  waiting: number
  stalled: number
  flaggedNext: ActionItemWithContext | null
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function TodoHeroWidget() {
  const [stats, setStats] = useState<TodoStats | null>(null)

  useEffect(() => {
    fetch('/api/todo/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  if (!stats || (stats.next === 0 && stats.waiting === 0)) {
    return (
      <div className="mb-20">
        <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
          Oracle
        </h1>
        <p className="text-zinc-400 dark:text-zinc-500 mt-1 text-sm">
          Development pipeline for distributed AI compute
        </p>
      </div>
    )
  }

  return (
    <div className="mb-20">
      <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight">
        {getGreeting()}
      </h1>

      <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5 text-nodiac-secondary" />
          {stats.next} action{stats.next !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          {stats.waiting} waiting
        </span>
        {stats.stalled > 0 && (
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            {stats.stalled} stale
          </span>
        )}
      </div>

      {stats.flaggedNext && (
        <div className="mt-4 p-3 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
          <div className="text-[11px] text-zinc-400 uppercase tracking-wide mb-1">Top priority</div>
          <div className="text-[13px] text-zinc-800 dark:text-zinc-200">{stats.flaggedNext.title}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">{stats.flaggedNext.site_name}</div>
        </div>
      )}

      <Link
        href="/todo"
        className="inline-flex items-center gap-1.5 mt-4 text-sm text-nodiac-secondary hover:text-nodiac-secondary/80 transition-colors"
      >
        See all on /todo
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
