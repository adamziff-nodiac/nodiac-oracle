'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, ExternalLink, Mail, User } from 'lucide-react'
import type { TrackerIPP, TrackerSiteOverview } from '@/lib/tracker/types'
import type { PortfolioUpload } from '@/types/screening'
import { cn } from '@/lib/utils'

interface IppPortfolioViewProps {
  ippId: string
}

export function IppPortfolioView({ ippId }: IppPortfolioViewProps) {
  const [ipp, setIPP] = useState<TrackerIPP | null>(null)
  const [portfolios, setPortfolios] = useState<PortfolioUpload[]>([])
  const [sites, setSites] = useState<TrackerSiteOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/ipp/${ippId}`)
      .then(r => {
        if (!r.ok) throw new Error('IPP not found')
        return r.json()
      })
      .then(data => {
        setIPP(data.ipp)
        setPortfolios(data.portfolios ?? [])
        setSites(data.sites ?? [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [ippId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nodiac-secondary animate-spin" />
      </div>
    )
  }

  if (error || !ipp) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 dark:text-gray-400">{error || 'IPP not found'}</p>
        <Link href="/screening" className="text-sm text-nodiac-secondary hover:underline">
          &larr; Back to Screening
        </Link>
      </div>
    )
  }

  const phaseCounts = (site: TrackerSiteOverview) => {
    const phases = [
      site.site_qualification_phase, site.site_control_phase, site.power_phase,
      site.permitting_phase, site.fiber_phase, site.engineering_phase, site.construction_phase,
    ]
    return phases.filter(p => p === 'Complete').length
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/screening"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {ipp.name}
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          {ipp.contact_name && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {ipp.contact_name}
            </span>
          )}
          {ipp.contact_email && (
            <a href={`mailto:${ipp.contact_email}`} className="flex items-center gap-1.5 hover:text-nodiac-secondary transition-colors">
              <Mail className="w-3.5 h-3.5" />
              {ipp.contact_email}
            </a>
          )}
          {ipp.attio_link && (
            <a href={ipp.attio_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-nodiac-secondary transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Attio
            </a>
          )}
        </div>

        {ipp.notes && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{ipp.notes}</p>
        )}
      </div>

      {/* Upload History */}
      {portfolios.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Portfolio Uploads
          </h3>
          <div className="space-y-2">
            {portfolios.map(p => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {p.site_count} sites
                  </span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Sites */}
      <div className="px-4 sm:px-6 py-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Sites in Pipeline ({sites.length})
        </h3>

        {sites.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No sites promoted to pipeline yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[600px] sm:min-w-0">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Site</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tier</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hub</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(site => {
                  const completed = phaseCounts(site)
                  return (
                    <tr key={site.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/tracker/${site.id}`}
                          className="text-gray-900 dark:text-white font-medium hover:text-nodiac-secondary transition-colors"
                        >
                          {site.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                          site.priority === 'Lead' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                          site.priority === 'Active' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
                          site.priority === 'Pipeline' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
                          (site.priority === 'On Hold' || site.priority === 'Deprioritized') && 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                        )}>
                          {site.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-900 dark:text-white tabular-nums font-mono">
                        {site.screening_score != null ? Number(site.screening_score).toFixed(1) : '\u2014'}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                        {site.screening_tier || '\u2014'}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-nodiac-secondary"
                              style={{ width: `${(completed / 7) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{completed}/7</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                        {site.hub_name || '\u2014'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
