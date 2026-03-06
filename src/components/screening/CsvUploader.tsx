'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface CsvUploaderProps {
  onUpload: (file: File, partnerName?: string) => void
  isUploading: boolean
}

export function CsvUploader({ onUpload, isUploading }: CsvUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [partnerName, setPartnerName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }, [])

  const handleSubmit = useCallback(() => {
    if (selectedFile) onUpload(selectedFile, partnerName.trim() || undefined)
  }, [selectedFile, partnerName, onUpload])

  return (
    <div className="max-w-xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer
          ${dragActive
            ? 'border-nodiac-secondary bg-nodiac-secondary/5'
            : 'border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30 bg-gray-100 dark:bg-white/5'
          }
        `}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload className="w-10 h-10 text-gray-500 dark:text-gray-400 mx-auto mb-4" />
        <p className="text-gray-900 dark:text-white font-medium mb-1">
          Drop a CSV file here or click to browse
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Supports Fleet CIR Validated and consolidated CSV formats
        </p>
      </div>

      {selectedFile && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between bg-gray-100 dark:bg-white/5 rounded-lg px-4 py-3 border border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-nodiac-secondary" />
              <div>
                <p className="text-sm text-gray-900 dark:text-white font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Partner Name field */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Partner Name <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
              placeholder="e.g. Greenbacker, Hexagon Energy"
              className="mt-1 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              onClick={e => e.stopPropagation()}
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); handleSubmit() }}
            disabled={isUploading}
            className="w-full py-2.5 bg-nodiac-secondary text-nodiac-dark text-sm font-semibold rounded-lg hover:bg-nodiac-secondary/90 transition-colors disabled:opacity-50"
          >
            {isUploading ? 'Processing...' : 'Score Sites'}
          </button>
        </div>
      )}
    </div>
  )
}
