'use client'

import { X } from 'lucide-react'
import type { WeightedCountyScore, CriterionKey, PermittingCitation } from '@/types/regional-hubs'
import { ALL_CRITERIA, CRITERION_LABELS } from '@/types/regional-hubs'
import { PermittingCitations } from '@/components/shared/PermittingCitations'
import { cn } from '@/lib/utils'

interface CountyDetailPanelProps {
  county: WeightedCountyScore | null
  citationRegistry?: PermittingCitation[]
  onClose: () => void
}

function getScoreValue(county: WeightedCountyScore, key: CriterionKey): number {
  const map: Record<CriterionKey, number> = {
    coop_density: county.coop_density_score,
    grid_reliability: county.grid_reliability_score,
    clipped_curtailed: county.clipped_curtailed_score,
    permitting: county.permitting_score,
    labor: county.labor_score,
    fiber: county.fiber_score,
    queue_pressure: county.queue_pressure_score,
  }
  return map[key]
}

function scoreColor(score: number): string {
  if (score >= 0.7) return 'bg-nodiac-secondary'
  if (score >= 0.4) return 'bg-nodiac-soft-orchid'
  return 'bg-gray-500'
}

function getCountyCitations(
  county: WeightedCountyScore,
  registry: PermittingCitation[]
): PermittingCitation[] {
  const ids = county.permitting_citation_ids ?? []
  return ids
    .filter(id => id >= 0 && id < registry.length)
    .map(id => registry[id])
}

export function CountyDetailPanel({ county, citationRegistry = [], onClose }: CountyDetailPanelProps) {
  return (
    <div
      className={cn(
        'absolute top-0 right-0 h-full w-80 bg-nodiac-dark/90 backdrop-blur-xl border-l border-white/10 z-20 transition-transform duration-300 ease-out overflow-y-auto',
        county ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {county && (
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                {county.county_name}
              </h3>
              <p className="text-sm text-gray-400">{county.state_abbr}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center py-4 border-y border-white/10">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Composite Score
            </p>
            <p className="text-4xl font-black text-white tabular-nums">
              {county.composite_score.toFixed(1)}
              <span className="text-lg text-gray-500 font-normal">/10</span>
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Criteria Breakdown
            </h4>
            {ALL_CRITERIA.map((key) => {
              const value = getScoreValue(county, key)
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{CRITERION_LABELS[key]}</span>
                    <span className="text-white font-medium tabular-nums">
                      {(value * 10).toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', scoreColor(value))}
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  {key === 'grid_reliability' && county.grid_reliability_years && (
                    <p className={cn(
                      'text-[10px] mt-0.5',
                      county.grid_reliability_years >= 5 ? 'text-gray-500' :
                      county.grid_reliability_years >= 3 ? 'text-yellow-600' :
                      'text-orange-500'
                    )}>
                      {county.grid_reliability_years >= 5
                        ? `Based on ${county.grid_reliability_years} years of SAIDI data (${county.grid_reliability_data_range})`
                        : county.grid_reliability_years >= 3
                        ? `Based on ${county.grid_reliability_years} years of data (${county.grid_reliability_data_range})`
                        : `⚠️ Based on only ${county.grid_reliability_years} year${county.grid_reliability_years > 1 ? 's' : ''} of data`
                      }
                      {county.grid_reliability_avg_saidi != null && (
                        <> · Avg {county.grid_reliability_avg_saidi} min/yr</>
                      )}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Permitting Citations */}
          {citationRegistry.length > 0 && (
            <PermittingCitations
              citations={getCountyCitations(county, citationRegistry)}
            />
          )}

          <div className="text-xs text-gray-500">
            <p>FIPS: {county.fips_code}</p>
            {county.last_permitting_update && (
              <p>
                Permitting updated:{' '}
                {new Date(county.last_permitting_update).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
