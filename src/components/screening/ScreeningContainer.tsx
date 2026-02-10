'use client'

import { useState, useCallback } from 'react'
import { CsvUploader } from './CsvUploader'
import { ScreeningMap } from './ScreeningMap'
import { SiteTable } from './SiteTable'
import { usePortfolio } from '@/hooks/usePortfolio'
import { RotateCcw } from 'lucide-react'

export function ScreeningContainer() {
  const { state, upload, sites, error, uploadCSV, reset } = usePortfolio()
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)

  const handleSiteSelect = useCallback((siteId: string) => {
    setSelectedSiteId(prev => prev === siteId ? null : siteId)
  }, [])

  // Upload phase
  if (state === 'idle' || state === 'uploading' || state === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">
            Screen an IPP Portfolio
          </h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Upload a CSV of potential sites to score them against our regional hub criteria
          </p>
        </div>
        <CsvUploader
          onUpload={uploadCSV}
          isUploading={state === 'uploading'}
        />
        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }

  // Scoring phase
  if (state === 'scoring') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-nodiac-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Scoring sites...</p>
          <p className="text-sm text-gray-400 mt-1">
            Looking up county data and computing scores
          </p>
        </div>
      </div>
    )
  }

  // Results phase
  const tierCounts = {
    good: sites.filter(s => s.tier === 'good').length,
    okay: sites.filter(s => s.tier === 'okay').length,
    bad: sites.filter(s => s.tier === 'bad').length,
  }

  return (
    <div className="space-y-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {upload?.name || 'Portfolio Results'}
          </h2>
          <p className="text-sm text-gray-400">
            {sites.length} sites — {tierCounts.good} strong, {tierCounts.okay} moderate, {tierCounts.bad} weak
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          New Upload
        </button>
      </div>

      {/* Map */}
      <div className="h-[40vh] border-b border-white/10">
        <ScreeningMap
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSiteSelect={handleSiteSelect}
        />
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        <SiteTable
          sites={sites}
          selectedSiteId={selectedSiteId}
          onSiteSelect={handleSiteSelect}
        />
      </div>
    </div>
  )
}
