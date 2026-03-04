'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { TrackerSiteOverview } from '@/lib/tracker/types'
import { CHECKPOINTS, type AmountStatus } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { AmountStatusBadge } from './AmountStatusBadge'
import { CheckpointStatusBadge } from './CheckpointStatusBadge'
import { MetricCard } from './MetricCard'
import { ToastContainer } from './Toast'

interface DepositItem {
  siteId: string
  siteName: string
  checkpointLabel: string
  amount: number | null
  amountStatus: AmountStatus
  checkpointStatus: string
  providerName: string | null
}

function extractDeposits(sites: TrackerSiteOverview[]): DepositItem[] {
  const financialCheckpoints = CHECKPOINTS.filter(c => c.financial)
  const items: DepositItem[] = []

  for (const site of sites) {
    const record = site as unknown as Record<string, unknown>
    for (const cp of financialCheckpoints) {
      const status = (record[`${cp.prefix}_status`] as string) || 'Not Started'
      const amount = record[`${cp.prefix}_amount`] as number | null
      const amountStatus = (record[`${cp.prefix}_amount_status`] as AmountStatus) || 'Estimated'

      if (amount || status !== 'Not Started') {
        items.push({
          siteId: site.id,
          siteName: site.name ?? 'Unknown',
          checkpointLabel: cp.label,
          amount,
          amountStatus,
          checkpointStatus: status,
          providerName: site.utility_name,
        })
      }
    }
  }

  return items
}

interface DepositsClientProps {
  initialSites: TrackerSiteOverview[]
}

export function DepositsClient({ initialSites }: DepositsClientProps) {
  const router = useRouter()
  const [sites] = useState(initialSites)

  const handleRealtime = useCallback(() => {
    router.refresh()
  }, [router])

  useTrackerRealtime(handleRealtime)

  const deposits = useMemo(() => extractDeposits(sites), [sites])

  const quotedOrApproved = deposits.filter(d => d.amountStatus === 'Quoted' || d.amountStatus === 'Approved')
  const readyToSend = quotedOrApproved.filter(d => d.checkpointStatus !== 'Blocked')
  const blocked = quotedOrApproved.filter(d => d.checkpointStatus === 'Blocked')
  const pending = deposits.filter(d => d.amountStatus === 'Estimated')
  const paid = deposits.filter(d => d.amountStatus === 'Paid')

  const readyTotal = readyToSend.reduce((s, d) => s + (d.amount ?? 0), 0)
  const blockedTotal = blocked.reduce((s, d) => s + (d.amount ?? 0), 0)
  const pendingTotal = pending.reduce((s, d) => s + (d.amount ?? 0), 0)
  const paidTotal = paid.reduce((s, d) => s + (d.amount ?? 0), 0)

  function formatCurrency(val: number) {
    if (val === 0) return '$0'
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
    return `$${val.toLocaleString()}`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <MetricCard label="Ready to Send" value={formatCurrency(readyTotal)} sublabel={`${readyToSend.length} deposits`} />
        <MetricCard label="Blocked" value={formatCurrency(blockedTotal)} sublabel={`${blocked.length} deposits`} />
        <MetricCard label="Pending" value={formatCurrency(pendingTotal)} sublabel={`${pending.length} deposits`} />
        <MetricCard label="Total Paid" value={formatCurrency(paidTotal)} sublabel={`${paid.length} deposits`} />
      </div>

      {/* Groups */}
      <DepositGroup
        title="Ready to Send"
        total={readyTotal}
        items={readyToSend}
        formatCurrency={formatCurrency}
        accent
      />
      <DepositGroup
        title="Blocked"
        total={blockedTotal}
        items={blocked}
        formatCurrency={formatCurrency}
        blocked
      />
      <DepositGroup
        title="Pending"
        total={pendingTotal}
        items={pending}
        formatCurrency={formatCurrency}
      />
      <DepositGroup
        title="Paid"
        total={paidTotal}
        items={paid}
        formatCurrency={formatCurrency}
        muted
      />

      <ToastContainer />
    </div>
  )
}

function DepositGroup({
  title,
  total,
  items,
  formatCurrency,
  accent,
  blocked,
  muted,
}: {
  title: string
  total: number
  items: DepositItem[]
  formatCurrency: (v: number) => string
  accent?: boolean
  blocked?: boolean
  muted?: boolean
}) {
  return (
    <div className={`${accent ? 'border-l-2 border-nodiac-secondary pl-4' : ''} ${blocked ? 'border-l-2 border-red-400 dark:border-red-500 pl-4' : ''} ${muted ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <span className="text-sm font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatCurrency(total)}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-zinc-400 dark:text-zinc-600 italic py-4">
          No deposits in this category
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead className="border-b border-zinc-200 dark:border-[#2a2a40]">
                <tr>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-left">Site</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-left">Checkpoint</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-right">Amount</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-center">Status</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-left">Provider</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-center">Phase Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={`${item.siteId}-${item.checkpointLabel}-${i}`} className="border-b border-zinc-100 dark:border-[#22223a]">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tracker/${item.siteId}`}
                        className="text-[13px] font-medium text-nodiac-primary dark:text-nodiac-secondary hover:underline"
                      >
                        {item.siteName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-zinc-600 dark:text-zinc-400">
                      {item.checkpointLabel}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium tabular-nums text-right text-zinc-900 dark:text-zinc-100">
                      {item.amount != null ? formatCurrency(item.amount) : '--'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AmountStatusBadge status={item.amountStatus} />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">
                      {item.providerName ?? '--'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CheckpointStatusBadge status={item.checkpointStatus as 'Not Started' | 'In Progress' | 'Complete' | 'Blocked' | 'N/A'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden flex flex-col gap-2">
            {items.map((item, i) => (
              <div key={`${item.siteId}-${item.checkpointLabel}-${i}`} className="p-3 border border-zinc-200 dark:border-[#2a2a40] rounded-lg">
                <Link
                  href={`/tracker/${item.siteId}`}
                  className="text-[13px] font-medium text-nodiac-primary dark:text-nodiac-secondary"
                >
                  {item.siteName}
                </Link>
                <div className="text-[13px] text-zinc-600 dark:text-zinc-400">{item.checkpointLabel}</div>
                <div className="text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 mt-1">
                  {item.amount != null ? formatCurrency(item.amount) : '--'}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <AmountStatusBadge status={item.amountStatus} />
                  <CheckpointStatusBadge status={item.checkpointStatus as 'Not Started' | 'In Progress' | 'Complete' | 'Blocked' | 'N/A'} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
