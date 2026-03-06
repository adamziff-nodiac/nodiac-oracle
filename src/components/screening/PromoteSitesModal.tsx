'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { PortfolioSite } from '@/types/screening'
import { cn } from '@/lib/utils'

interface Hub { id: string; name: string }
interface Partner { id: string; name: string }

interface PromoteSitesModalProps {
  sites: PortfolioSite[]
  onClose: () => void
  onPromoted: () => void
}

export function PromoteSitesModal({ sites, onClose, onPromoted }: PromoteSitesModalProps) {
  const [hubs, setHubs] = useState<Hub[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [selectedHub, setSelectedHub] = useState('')
  const [selectedPartner, setSelectedPartner] = useState('')
  const [priority, setPriority] = useState('Pipeline')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ promoted: number; skipped: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/tracker/hubs').then(r => r.json()).catch(() => []),
      fetch('/api/ipp').then(r => r.json()).catch(() => []),
    ]).then(([hubData, partnerData]) => {
      setHubs(Array.isArray(hubData) ? hubData : [])
      setPartners(Array.isArray(partnerData) ? partnerData : [])
    })
  }, [])

  const handlePromote = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/screening/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_site_ids: sites.map(s => s.id),
          partner_id: selectedPartner || undefined,
          hub_id: selectedHub || undefined,
          priority,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Promotion failed')

      setResult({ promoted: data.promoted, skipped: data.skipped })
      onPromoted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add to Pipeline
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {result.promoted} site{result.promoted !== 1 ? 's' : ''} added to pipeline.
              {result.skipped > 0 && ` ${result.skipped} already in pipeline.`}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg bg-nodiac-secondary text-nodiac-dark text-sm font-semibold hover:bg-nodiac-secondary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sites.length} site{sites.length !== 1 ? 's' : ''} selected
            </p>

            {/* Partner selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Partner
              </label>
              <select
                value={selectedPartner}
                onChange={e => setSelectedPartner(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">None</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Hub selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Hub
              </label>
              <select
                value={selectedHub}
                onChange={e => setSelectedHub(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">None</option>
                {hubs.map(hub => (
                  <option key={hub.id} value={hub.id}>{hub.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                {['Lead', 'Active', 'Pipeline', 'On Hold', 'Deprioritized'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={loading}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
                  loading
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                    : 'bg-nodiac-secondary text-nodiac-dark hover:bg-nodiac-secondary/90'
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Promoting...
                  </span>
                ) : (
                  `Add ${sites.length} to Pipeline`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
