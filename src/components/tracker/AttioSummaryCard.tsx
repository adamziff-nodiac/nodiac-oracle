'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { AttioSummary } from '@/lib/tracker/types'

function connectionStrengthColor(strength: string | null): string {
  switch (strength?.toLowerCase()) {
    case 'very strong':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'strong':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'good':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'weak':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'very weak':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '--'
  }
}

interface AttioSummaryCardProps {
  partnerId: string
  attioRecordId: string | null
  relationshipStage: string | null
}

export function AttioSummaryCard({ partnerId, attioRecordId, relationshipStage }: AttioSummaryCardProps) {
  const [summary, setSummary] = useState<AttioSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!attioRecordId) {
      setLoading(false)
      return
    }

    async function fetchSummary() {
      try {
        const res = await fetch(`/api/tracker/attio-summary?partner_id=${partnerId}`)
        if (res.ok) {
          const data: AttioSummary = await res.json()
          setSummary(data)
        }
      } catch {
        // Graceful degradation
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [partnerId, attioRecordId])

  // Don't render if no attio_record_id
  if (!attioRecordId) return null

  const attioUrl = `https://app.attio.com/companies/${attioRecordId}`

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-[#2a2a40] bg-zinc-50 dark:bg-[#1a1a2e]">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          <div className="h-8 w-full bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // Unavailable state
  if (!summary || !summary.available) {
    return (
      <div className="p-4 rounded-lg border border-zinc-200 dark:border-[#2a2a40] bg-zinc-50 dark:bg-[#1a1a2e]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Attio CRM Summary
          </span>
          <a
            href={attioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-nodiac-secondary/15 text-nodiac-secondary hover:bg-nodiac-secondary/25 transition-colors"
          >
            Open in Attio
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 italic">
          Unable to load CRM data. View this partner&apos;s full record in Attio.
        </p>
      </div>
    )
  }

  // Check for deal stage discrepancy
  const dealStage = summary.deal?.stage
  const hasDiscrepancy = dealStage && relationshipStage && dealStage.toLowerCase() !== relationshipStage.toLowerCase()

  return (
    <div className="p-4 rounded-lg border border-zinc-200 dark:border-[#2a2a40] bg-zinc-50 dark:bg-[#1a1a2e]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Attio CRM Summary
        </span>
        <a
          href={attioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-nodiac-secondary/15 text-nodiac-secondary hover:bg-nodiac-secondary/25 transition-colors"
        >
          Open in Attio
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Connection & Interaction Info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Connection:</span>
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', connectionStrengthColor(summary.connection_strength))}>
            {summary.connection_strength ?? 'Unknown'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Contacts:</span>
          <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">{summary.contacts.length}</span>
        </div>
        {summary.strongest_connection_user && (
          <div className="col-span-2 flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Strongest:</span>
            <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">{summary.strongest_connection_user}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Last:</span>
          <span className="text-[12px] text-zinc-700 dark:text-zinc-300">{formatDate(summary.last_interaction)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Next:</span>
          <span className="text-[12px] text-zinc-700 dark:text-zinc-300">{formatDate(summary.next_interaction)}</span>
        </div>
      </div>

      {/* Deal Stage with Discrepancy Flag */}
      {summary.deal && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Deal:</span>
          <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
            {summary.deal.stage ?? 'No stage'}
          </span>
          {summary.deal.type && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">({summary.deal.type})</span>
          )}
          {hasDiscrepancy && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              title={`Attio shows "${dealStage}" but tracker shows "${relationshipStage}". These should be reconciled.`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Stage mismatch
            </span>
          )}
        </div>
      )}

      {/* Key Contacts */}
      {summary.contacts.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1.5">
            Key Contacts
          </div>
          <div className="space-y-1.5">
            {summary.contacts.map((contact, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">{contact.name}</span>
                  {contact.title && (
                    <span className="text-zinc-400 dark:text-zinc-500 truncate hidden sm:inline">{contact.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-[11px] text-nodiac-secondary hover:text-nodiac-secondary/80 truncate max-w-[140px]"
                    >
                      {contact.email}
                    </a>
                  )}
                  {contact.connection_strength && (
                    <span className={cn('px-1 py-0.5 rounded text-[9px] font-medium shrink-0', connectionStrengthColor(contact.connection_strength))}>
                      {contact.connection_strength}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps from Attio Utilities list */}
      {summary.next_steps && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 mb-1">
            Next Steps (from Attio)
          </div>
          <p className="text-[12px] text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
            &ldquo;{summary.next_steps}&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
