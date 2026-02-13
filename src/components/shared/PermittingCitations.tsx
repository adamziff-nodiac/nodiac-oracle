'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import type { PermittingCitation } from '@/types/regional-hubs'
import { cn } from '@/lib/utils'

interface PermittingCitationsProps {
  citations: PermittingCitation[]
  compact?: boolean
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  state_policy: { label: 'Policy', color: 'bg-blue-500/20 text-blue-300' },
  incentive: { label: 'Incentive', color: 'bg-emerald-500/20 text-emerald-300' },
  regulatory: { label: 'Regulatory', color: 'bg-amber-500/20 text-amber-300' },
  opposition: { label: 'Opposition', color: 'bg-red-500/20 text-red-300' },
  moratorium: { label: 'Moratorium', color: 'bg-rose-500/20 text-rose-300' },
}

function TypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] ?? { label: type, color: 'bg-gray-500/20 text-gray-300' }
  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider whitespace-nowrap', config.color)}>
      {config.label}
    </span>
  )
}

export function PermittingCitations({ citations, compact = false }: PermittingCitationsProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!citations.length) return null

  // Group by type for organized display
  const byType = citations.reduce<Record<string, PermittingCitation[]>>((acc, c) => {
    const t = c.type ?? 'state_policy'
    ;(acc[t] ??= []).push(c)
    return acc
  }, {})

  // Display order
  const typeOrder = ['incentive', 'state_policy', 'regulatory', 'opposition', 'moratorium']
  const sortedCitations = typeOrder.flatMap(t => byType[t] ?? [])
  // Add any uncategorized
  const categorized = new Set(sortedCitations)
  citations.forEach(c => { if (!categorized.has(c)) sortedCitations.push(c) })

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-white/5 transition-colors"
      >
        <span>Permitting Sources ({citations.length})</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {isOpen && (
        <div className={cn('px-3 pb-3 space-y-1.5', compact && 'max-h-48 overflow-y-auto')}>
          {sortedCitations.map((c, i) => (
            <a
              key={i}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 group py-1 hover:bg-white/5 rounded px-1 -mx-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3 mt-0.5 text-gray-500 group-hover:text-nodiac-secondary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <TypeBadge type={c.type} />
                  <span className="text-xs text-gray-300 group-hover:text-white transition-colors truncate">
                    {c.title}
                  </span>
                </div>
                {!compact && c.relevance && (
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{c.relevance}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
