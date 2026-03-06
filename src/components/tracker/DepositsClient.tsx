'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { TrackerSiteOverview } from '@/lib/tracker/types'
import { CHECKPOINTS, type AmountStatus, type CheckpointStatus } from '@/lib/tracker/constants'
import { useTrackerRealtime } from '@/lib/tracker/realtime'
import { AmountStatusBadge } from './AmountStatusBadge'
import { CheckpointStatusBadge } from './CheckpointStatusBadge'
import { MetricCard } from './MetricCard'
import { ToastContainer, showToast } from './Toast'

interface DepositItem {
  siteId: string
  siteName: string
  checkpointPrefix: string
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
          checkpointPrefix: cp.prefix,
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
  const [sites, setSites] = useState(initialSites)

  const handleRealtime = useCallback(() => {
    router.refresh()
  }, [router])

  useTrackerRealtime(handleRealtime)

  const deposits = useMemo(() => extractDeposits(sites), [sites])

  const quotedOrApproved = deposits.filter(d => d.amountStatus === 'Quoted' || d.amountStatus === 'Approved')
  const readyToSend = quotedOrApproved.filter(d => d.checkpointStatus !== 'Waiting')
  const waiting = quotedOrApproved.filter(d => d.checkpointStatus === 'Waiting')
  const pending = deposits.filter(d => d.amountStatus === 'Estimated')
  const paid = deposits.filter(d => d.amountStatus === 'Paid')

  const readyTotal = readyToSend.reduce((s, d) => s + (d.amount ?? 0), 0)
  const waitingTotal = waiting.reduce((s, d) => s + (d.amount ?? 0), 0)
  const pendingTotal = pending.reduce((s, d) => s + (d.amount ?? 0), 0)
  const paidTotal = paid.reduce((s, d) => s + (d.amount ?? 0), 0)

  function formatCurrency(val: number) {
    if (val === 0) return '$0'
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
    return `$${val.toLocaleString()}`
  }

  async function handleAmountStatusChange(item: DepositItem, newStatus: AmountStatus) {
    const columnName = `${item.checkpointPrefix}_amount_status`
    const prev = [...sites]

    // Optimistic update
    setSites(ss => ss.map(s =>
      s.id === item.siteId
        ? { ...s, [columnName]: newStatus } as TrackerSiteOverview
        : s
    ))

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_sites')
        .update({ [columnName]: newStatus })
        .eq('id', item.siteId)

      if (error) throw error
      showToast('Saved', 'success')
    } catch {
      setSites(prev)
      showToast('Failed to save', 'error')
    }
  }

  async function handleAmountChange(item: DepositItem, newAmount: number | null) {
    const columnName = `${item.checkpointPrefix}_amount`
    const prev = [...sites]

    setSites(ss => ss.map(s =>
      s.id === item.siteId
        ? { ...s, [columnName]: newAmount } as TrackerSiteOverview
        : s
    ))

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_sites')
        .update({ [columnName]: newAmount })
        .eq('id', item.siteId)

      if (error) throw error
      showToast('Saved', 'success')
    } catch {
      setSites(prev)
      showToast('Failed to save', 'error')
    }
  }

  async function handleCheckpointStatusChange(item: DepositItem, newStatus: CheckpointStatus) {
    const columnName = `${item.checkpointPrefix}_status`
    const prev = [...sites]

    setSites(ss => ss.map(s =>
      s.id === item.siteId
        ? { ...s, [columnName]: newStatus } as TrackerSiteOverview
        : s
    ))

    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('tracker_sites')
        .update({ [columnName]: newStatus })
        .eq('id', item.siteId)

      if (error) throw error
      showToast('Saved', 'success')
    } catch {
      setSites(prev)
      showToast('Failed to save', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <MetricCard label="Ready to Send" value={formatCurrency(readyTotal)} sublabel={`${readyToSend.length} deposits`} />
        <MetricCard label="Waiting" value={formatCurrency(waitingTotal)} sublabel={`${waiting.length} deposits`} />
        <MetricCard label="Pending" value={formatCurrency(pendingTotal)} sublabel={`${pending.length} deposits`} />
        <MetricCard label="Total Paid" value={formatCurrency(paidTotal)} sublabel={`${paid.length} deposits`} />
      </div>

      {/* Groups */}
      <DepositGroup
        title="Ready to Send"
        total={readyTotal}
        items={readyToSend}
        formatCurrency={formatCurrency}
        onAmountStatusChange={handleAmountStatusChange}
        onAmountChange={handleAmountChange}
        onCheckpointStatusChange={handleCheckpointStatusChange}
        accent
      />
      <DepositGroup
        title="Waiting"
        total={waitingTotal}
        items={waiting}
        formatCurrency={formatCurrency}
        onAmountStatusChange={handleAmountStatusChange}
        onAmountChange={handleAmountChange}
        onCheckpointStatusChange={handleCheckpointStatusChange}
        waiting
      />
      <DepositGroup
        title="Pending"
        total={pendingTotal}
        items={pending}
        formatCurrency={formatCurrency}
        onAmountStatusChange={handleAmountStatusChange}
        onAmountChange={handleAmountChange}
        onCheckpointStatusChange={handleCheckpointStatusChange}
      />
      <DepositGroup
        title="Paid"
        total={paidTotal}
        items={paid}
        formatCurrency={formatCurrency}
        onAmountStatusChange={handleAmountStatusChange}
        onAmountChange={handleAmountChange}
        onCheckpointStatusChange={handleCheckpointStatusChange}
        muted
      />

      <ToastContainer />
    </div>
  )
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex ml-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-600 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-400 transition-colors cursor-pointer leading-none"
      >
        i
      </button>
      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 rounded-lg bg-zinc-800 dark:bg-zinc-700 text-[11px] text-zinc-100 leading-relaxed shadow-lg normal-case tracking-normal font-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-zinc-800 dark:border-t-zinc-700" />
        </div>
      )}
    </div>
  )
}

function EditableAmount({
  amount,
  formatCurrency,
  onSave,
}: {
  amount: number | null
  formatCurrency: (v: number) => string
  onSave: (newAmount: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(amount?.toString() ?? '')

  function handleSave() {
    const parsed = value.trim() === '' ? null : parseFloat(value.replace(/[,$]/g, ''))
    if (parsed !== null && isNaN(parsed)) return
    onSave(parsed)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus
        className="w-24 px-2 py-1 text-[13px] font-medium tabular-nums text-right bg-zinc-50 dark:bg-[#1a1a2e] border border-zinc-300 dark:border-[#2a2a40] rounded focus:outline-none focus:ring-1 focus:ring-nodiac-secondary text-zinc-900 dark:text-zinc-100"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => { setValue(amount?.toString() ?? ''); setEditing(true) }}
      className="text-[13px] font-medium tabular-nums text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] px-2 py-1 rounded transition-colors cursor-pointer"
    >
      {amount != null ? formatCurrency(amount) : '--'}
    </button>
  )
}

function DepositGroup({
  title,
  total,
  items,
  formatCurrency,
  onAmountStatusChange,
  onAmountChange,
  onCheckpointStatusChange,
  accent,
  waiting,
  muted,
}: {
  title: string
  total: number
  items: DepositItem[]
  formatCurrency: (v: number) => string
  onAmountStatusChange: (item: DepositItem, newStatus: AmountStatus) => void
  onAmountChange: (item: DepositItem, newAmount: number | null) => void
  onCheckpointStatusChange: (item: DepositItem, newStatus: CheckpointStatus) => void
  accent?: boolean
  waiting?: boolean
  muted?: boolean
}) {
  return (
    <div className={`${accent ? 'border-l-2 border-nodiac-secondary pl-4' : ''} ${waiting ? 'border-l-2 border-amber-400 dark:border-amber-500 pl-4' : ''} ${muted ? 'opacity-70' : ''}`}>
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
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-center">
                    Payment Status
                    <InfoTooltip text="Where the money is in its lifecycle: Estimated → Quoted → Approved → Paid." />
                  </th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-left">Provider</th>
                  <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 text-center">
                    Phase Status
                    <InfoTooltip text="The checkpoint's overall progress: Not Started → In Progress → Complete. A deposit can be Quoted but Waiting if something else needs to happen first." />
                  </th>
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
                    <td className="px-4 py-3 text-right">
                      <EditableAmount
                        amount={item.amount}
                        formatCurrency={formatCurrency}
                        onSave={(newAmount) => onAmountChange(item, newAmount)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <AmountStatusBadge
                        status={item.amountStatus}
                        editable
                        onStatusChange={(newStatus) => onAmountStatusChange(item, newStatus)}
                      />
                    </td>
                    <td className="px-4 py-3 text-[13px] text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">
                      {item.providerName ?? '--'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CheckpointStatusBadge
                        status={item.checkpointStatus as CheckpointStatus}
                        editable
                        onStatusChange={(newStatus) => onCheckpointStatusChange(item, newStatus)}
                      />
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
                <div className="mt-1">
                  <EditableAmount
                    amount={item.amount}
                    formatCurrency={formatCurrency}
                    onSave={(newAmount) => onAmountChange(item, newAmount)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <AmountStatusBadge
                    status={item.amountStatus}
                    editable
                    onStatusChange={(newStatus) => onAmountStatusChange(item, newStatus)}
                  />
                  <CheckpointStatusBadge
                    status={item.checkpointStatus as CheckpointStatus}
                    editable
                    onStatusChange={(newStatus) => onCheckpointStatusChange(item, newStatus)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
