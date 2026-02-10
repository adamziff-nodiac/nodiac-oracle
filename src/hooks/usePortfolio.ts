'use client'

import { useState, useCallback } from 'react'
import type { PortfolioUpload, PortfolioSite } from '@/types/screening'

type ScreeningState = 'idle' | 'uploading' | 'scoring' | 'done' | 'error'

export function usePortfolio() {
  const [state, setState] = useState<ScreeningState>('idle')
  const [upload, setUpload] = useState<PortfolioUpload | null>(null)
  const [sites, setSites] = useState<PortfolioSite[]>([])
  const [error, setError] = useState<string | null>(null)

  const uploadCSV = useCallback(async (file: File) => {
    setState('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', file.name)

      const res = await fetch('/api/upload-csv', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { upload_id } = await res.json()

      // Start scoring
      setState('scoring')
      const scoreRes = await fetch(`/api/portfolio/${upload_id}/score`, { method: 'POST' })
      if (!scoreRes.ok) {
        const data = await scoreRes.json()
        throw new Error(data.error || 'Scoring failed')
      }

      // Fetch final results
      const detailRes = await fetch(`/api/portfolio/${upload_id}`)
      if (!detailRes.ok) throw new Error('Failed to load results')

      const { upload: uploadData, sites: sitesData } = await detailRes.json()
      setUpload(uploadData)
      setSites(sitesData)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setUpload(null)
    setSites([])
    setError(null)
  }, [])

  return { state, upload, sites, error, uploadCSV, reset }
}
