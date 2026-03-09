'use client'

import { googleDataCenters } from '@/data/googleDataCenters'
import type { GoogleDCDisplayMode } from './GoogleDataCentersLayer'

interface MapOverlayTogglesProps {
  // Portfolio
  showPortfolio: boolean
  onTogglePortfolio: () => void
  portfolioCount: number
  // Google DCs
  showGoogleDC: boolean
  onToggleGoogleDC: () => void
  googleDCDisplayMode: GoogleDCDisplayMode
  onGoogleDCDisplayMode: (mode: GoogleDCDisplayMode) => void
  // Prospective Sites
  showProspectiveSites: boolean
  onToggleProspectiveSites: () => void
  showIPP: boolean
  onToggleIPP: () => void
  showSubstations: boolean
  onToggleSubstations: () => void
  includeTransmission: boolean
  onToggleTransmission: () => void
  prospectiveRadius: number
  onProspectiveRadiusChange: (radius: number) => void
  prospectiveLoading: boolean
  ippCount: number
  substationCount: number
}

export function MapOverlayToggles({
  showPortfolio,
  onTogglePortfolio,
  portfolioCount,
  showGoogleDC,
  onToggleGoogleDC,
  googleDCDisplayMode,
  onGoogleDCDisplayMode,
  showProspectiveSites,
  onToggleProspectiveSites,
  showIPP,
  onToggleIPP,
  showSubstations,
  onToggleSubstations,
  includeTransmission,
  onToggleTransmission,
  prospectiveRadius,
  onProspectiveRadiusChange,
  prospectiveLoading,
  ippCount,
  substationCount,
}: MapOverlayTogglesProps) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 space-y-1.5">
      {/* Portfolio Sites */}
      <button
        onClick={onTogglePortfolio}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
          showPortfolio
            ? 'bg-[#c77dba]/20 text-[#c77dba]'
            : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white'
        }`}
      >
        <span>Portfolio Sites</span>
        <span className="tabular-nums font-mono text-[10px]">{portfolioCount} sites</span>
      </button>

      {/* Google DCs */}
      <button
        onClick={onToggleGoogleDC}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
          showGoogleDC
            ? 'bg-[#4285F4]/20 text-[#4285F4]'
            : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-[#4285F4]">G</span>
          Data Centers
        </span>
        <span className="tabular-nums font-mono text-[10px]">{googleDataCenters.length}</span>
      </button>

      {showGoogleDC && (
        <>
          <div className="flex gap-1">
            <button
              onClick={() => onGoogleDCDisplayMode('logo')}
              className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                googleDCDisplayMode === 'logo'
                  ? 'bg-[#4285F4]/20 text-[#4285F4]'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Logo only
            </button>
            <button
              onClick={() => onGoogleDCDisplayMode('logo-label')}
              className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                googleDCDisplayMode === 'logo-label'
                  ? 'bg-[#4285F4]/20 text-[#4285F4]'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Logo + Name
            </button>
          </div>
          <p className="text-[10px] text-gray-500 px-1">Click a DC marker to explore nearby power</p>
        </>
      )}

      {/* Prospective Sites */}
      <button
        onClick={onToggleProspectiveSites}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
          showProspectiveSites
            ? 'bg-[#FFB800]/20 text-[#FFB800]'
            : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white'
        }`}
      >
        <span>Prospective Sites</span>
        {showProspectiveSites && (
          <span className="tabular-nums font-mono text-[10px]">
            {prospectiveLoading ? '...' : `${(ippCount + substationCount).toLocaleString()}`}
          </span>
        )}
      </button>

      {showProspectiveSites && (
        <div className="space-y-2 pl-1">
          <div className="flex gap-1">
            <button
              onClick={onToggleIPP}
              className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                showIPP
                  ? 'bg-[#FFB800]/20 text-[#FFB800]'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              IPP Sites {showIPP && !prospectiveLoading && <span className="opacity-60">({ippCount.toLocaleString()})</span>}
            </button>
            <button
              onClick={onToggleSubstations}
              className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                showSubstations
                  ? 'bg-[#22C55E]/20 text-[#22C55E]'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Substations {showSubstations && !prospectiveLoading && <span className="opacity-60">({substationCount.toLocaleString()})</span>}
            </button>
          </div>
          <button
            onClick={onToggleTransmission}
            className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              includeTransmission
                ? 'bg-[#FFB800]/15 text-[#FFB800]'
                : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>Include Transmission</span>
            <span className="text-gray-500">{includeTransmission ? 'All IPP' : 'Dist. only'}</span>
          </button>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Radius</span>
              <span className="text-xs text-[#FFB800] tabular-nums font-mono font-semibold">
                {prospectiveRadius}mi
              </span>
            </div>
            <input
              type="range"
              min={25}
              max={300}
              step={25}
              value={prospectiveRadius}
              onChange={(e) => onProspectiveRadiusChange(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                bg-gray-200 dark:bg-white/10
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-[#FFB800]
                [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,184,0,0.4)]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
