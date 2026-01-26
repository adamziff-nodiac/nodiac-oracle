'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface TimelineSettingsModalProps {
  startYear: number
  endYear: number
  onSave: (startYear: number, endYear: number) => void
  onClose: () => void
}

export function TimelineSettingsModal({
  startYear: initialStartYear,
  endYear: initialEndYear,
  onSave,
  onClose,
}: TimelineSettingsModalProps) {
  const [startYear, setStartYear] = useState(initialStartYear)
  const [endYear, setEndYear] = useState(initialEndYear)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    if (startYear >= endYear) {
      setError('Start year must be before end year')
      return
    }
    if (endYear - startYear > 20) {
      setError('Timeline cannot span more than 20 years')
      return
    }
    onSave(startYear, endYear)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Timeline Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Start Year
            </label>
            <input
              type="number"
              value={startYear}
              onChange={(e) => {
                setStartYear(parseInt(e.target.value) || 2020)
                setError(null)
              }}
              min={2000}
              max={2050}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              End Year
            </label>
            <input
              type="number"
              value={endYear}
              onChange={(e) => {
                setEndYear(parseInt(e.target.value) || 2030)
                setError(null)
              }}
              min={2000}
              max={2050}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-nodiac-primary hover:bg-nodiac-primary/80 text-white rounded-lg font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
