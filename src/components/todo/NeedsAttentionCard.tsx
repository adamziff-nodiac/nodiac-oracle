'use client'

import { AlertTriangle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
  stalled: 'text-zinc-400',
  stale: 'text-amber-500',
  deadline: 'text-red-400',
}

export function NeedsAttentionCard({ type, title, description, link }: NeedsAttentionCardProps) {
  const Icon = icons[type]

  return (
    <Link
      href={link}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 transition-colors duration-75',
        'hover:bg-zinc-50/80 dark:hover:bg-white/[0.03]',
        'border-b border-zinc-100 dark:border-[#1e1e36] last:border-b-0',
      )}
    >
      <Icon className={cn('w-3.5 h-3.5 flex-shrink-0', colors[type])} />
      <span className="text-[13px] text-zinc-700 dark:text-zinc-300 truncate min-w-0">{title}</span>
      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex-shrink-0 ml-auto">{description}</span>
    </Link>
  )
}
