'use client'

import { AlertTriangle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface NeedsAttentionCardProps {
  type: 'stalled' | 'stale' | 'deadline'
  title: string
  description: string
  link: string
}

const icons = {
  stalled: AlertCircle,
  stale: Clock,
  deadline: AlertTriangle,
}

const colors = {
  stalled: 'text-zinc-500 bg-zinc-500/10',
  stale: 'text-amber-500 bg-amber-500/10',
  deadline: 'text-red-500 bg-red-500/10',
}

export function NeedsAttentionCard({ type, title, description, link }: NeedsAttentionCardProps) {
  const Icon = icons[type]

  return (
    <Link
      href={link}
      className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-[#2a2a40] hover:bg-zinc-50 dark:hover:bg-[#1a1a30] transition-colors"
    >
      <div className={`flex-shrink-0 p-1.5 rounded-md ${colors[type]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 truncate">{title}</div>
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</div>
      </div>
    </Link>
  )
}
