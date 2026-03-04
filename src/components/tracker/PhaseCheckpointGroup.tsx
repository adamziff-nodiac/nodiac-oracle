'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { OWNER_OPTIONS, type CheckpointStatus, type AmountStatus } from '@/lib/tracker/constants'
import type { Checkpoint } from '@/lib/tracker/constants'
import type { TrackerSiteOverview } from '@/lib/tracker/types'
import { CheckpointStatusBadge } from './CheckpointStatusBadge'
import { AmountStatusBadge } from './AmountStatusBadge'
import { ChevronRight } from 'lucide-react'

interface PhaseCheckpointGroupProps {
  phase: { key: string; label: string; abbrev: string }
  checkpoints: Checkpoint[]
  site: TrackerSiteOverview
  onUpdate: (prefix: string, field: string, value: unknown) => void
}

function getVal(site: Record<string, unknown>, prefix: string, suffix: string): unknown {
  return site[`${prefix}_${suffix}`]
}

function computePhaseStatus(checkpoints: Checkpoint[], site: TrackerSiteOverview): string {
  const statuses = checkpoints.map(c => getVal(site as unknown as Record<string, unknown>, c.prefix, 'status') as string || 'Not Started')
  if (statuses.some(s => s === 'Blocked')) return 'Blocked'
  if (statuses.every(s => s === 'Complete' || s === 'N/A')) return 'Complete'
  if (statuses.some(s => s === 'In Progress')) return 'In Progress'
  return 'Not Started'
}

function shouldDefaultOpen(checkpoints: Checkpoint[], site: TrackerSiteOverview): boolean {
  const statuses = checkpoints.map(c => getVal(site as unknown as Record<string, unknown>, c.prefix, 'status') as string || 'Not Started')
  return statuses.some(s => s === 'In Progress' || s === 'Blocked')
}

export function PhaseCheckpointGroup({ phase, checkpoints, site, onUpdate }: PhaseCheckpointGroupProps) {
  const [open, setOpen] = useState(() => shouldDefaultOpen(checkpoints, site))
  const phaseStatus = computePhaseStatus(checkpoints, site)
  const siteRecord = site as unknown as Record<string, unknown>

  return (
    <div className="border border-zinc-200 dark:border-[#2a2a40] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 bg-zinc-50 dark:bg-[#1a1a2e] cursor-pointer select-none hover:bg-zinc-100 dark:hover:bg-[#1c1c34] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {phase.label}
          <span className={cn(
            'text-[11px] font-medium px-2 py-0.5 rounded-full',
            phaseStatus === 'Complete' && 'bg-emerald-200 text-emerald-800 dark:bg-emerald-700/50 dark:text-emerald-200',
            phaseStatus === 'In Progress' && 'bg-amber-200 text-amber-800 dark:bg-amber-700/50 dark:text-amber-200',
            phaseStatus === 'Blocked' && 'bg-red-200 text-red-800 dark:bg-red-700/50 dark:text-red-200',
            phaseStatus === 'Not Started' && 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400',
          )}>
            {phaseStatus}
          </span>
        </span>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-zinc-400 transition-transform duration-200',
            open && 'rotate-90'
          )}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {checkpoints.map(checkpoint => {
            const status = (getVal(siteRecord, checkpoint.prefix, 'status') as CheckpointStatus) || 'Not Started'
            const forecast = getVal(siteRecord, checkpoint.prefix, 'forecast') as string | null
            const completed = getVal(siteRecord, checkpoint.prefix, 'completed') as string | null
            const owner = getVal(siteRecord, checkpoint.prefix, 'owner') as string | null
            const amount = checkpoint.financial ? getVal(siteRecord, checkpoint.prefix, 'amount') as number | null : null
            const amountStatus = checkpoint.financial ? (getVal(siteRecord, checkpoint.prefix, 'amount_status') as AmountStatus) || 'Estimated' : null

            return (
              <div
                key={checkpoint.prefix}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-2.5 border-t border-zinc-100 dark:border-[#22223a]"
              >
                {/* Label */}
                <span className="text-[13px] text-zinc-700 dark:text-zinc-300 w-full sm:w-[200px] sm:shrink-0 font-medium sm:font-normal">
                  {checkpoint.label}
                </span>

                {/* Fields */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
                  {/* Status */}
                  <div className="sm:hidden text-[11px] text-zinc-400 w-full">Status</div>
                  <CheckpointStatusBadge
                    status={status}
                    editable
                    onStatusChange={(s) => onUpdate(checkpoint.prefix, 'status', s)}
                  />

                  {/* Forecast */}
                  <div>
                    <div className="sm:hidden text-[11px] text-zinc-400">Forecast</div>
                    <input
                      type="date"
                      value={forecast ?? ''}
                      onChange={e => onUpdate(checkpoint.prefix, 'forecast', e.target.value || null)}
                      className="text-[13px] bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-nodiac-secondary focus:outline-none py-0.5 transition-colors duration-100 tabular-nums w-[110px] text-zinc-700 dark:text-zinc-300 dark:[color-scheme:dark]"
                    />
                  </div>

                  {/* Completed */}
                  <div>
                    <div className="sm:hidden text-[11px] text-zinc-400">Completed</div>
                    <input
                      type="date"
                      value={completed ?? ''}
                      onChange={e => onUpdate(checkpoint.prefix, 'completed', e.target.value || null)}
                      className="text-[13px] bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-nodiac-secondary focus:outline-none py-0.5 transition-colors duration-100 tabular-nums w-[110px] text-zinc-700 dark:text-zinc-300 dark:[color-scheme:dark]"
                    />
                  </div>

                  {/* Owner */}
                  <div>
                    <div className="sm:hidden text-[11px] text-zinc-400">Owner</div>
                    <select
                      value={owner ?? ''}
                      onChange={e => onUpdate(checkpoint.prefix, 'owner', e.target.value || null)}
                      className="text-[13px] bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-nodiac-secondary focus:outline-none py-0.5 cursor-pointer appearance-none w-[80px] text-zinc-700 dark:text-zinc-300"
                    >
                      <option value="">--</option>
                      {OWNER_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount (financial only) */}
                  {checkpoint.financial && (
                    <div>
                      <div className="sm:hidden text-[11px] text-zinc-400">Amount</div>
                      <div className="flex items-center">
                        <span className="text-[13px] text-zinc-400">$</span>
                        <input
                          type="text"
                          value={amount != null ? amount.toLocaleString() : ''}
                          onBlur={e => {
                            const val = parseFloat(e.target.value.replace(/,/g, ''))
                            onUpdate(checkpoint.prefix, 'amount', isNaN(val) ? null : val)
                          }}
                          onChange={() => {}} // controlled via onBlur
                          className="text-[13px] bg-transparent border-b border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-nodiac-secondary focus:outline-none py-0.5 transition-colors duration-100 tabular-nums w-[90px] text-right text-zinc-700 dark:text-zinc-300"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Amount Status (financial only) */}
                  {checkpoint.financial && amountStatus && (
                    <div>
                      <div className="sm:hidden text-[11px] text-zinc-400">Status</div>
                      <AmountStatusBadge
                        status={amountStatus}
                        editable
                        onStatusChange={(s) => onUpdate(checkpoint.prefix, 'amount_status', s)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
