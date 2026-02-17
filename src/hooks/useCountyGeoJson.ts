'use client'

import { useState, useEffect } from 'react'

const COUNTIES_GEOJSON_URL = '/data/us-counties.json'

let cachedGeojson: GeoJSON.FeatureCollection | null = null

export function useCountyGeoJson() {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(cachedGeojson)
  const [isLoading, setIsLoading] = useState(!cachedGeojson)

  useEffect(() => {
    if (cachedGeojson) return

    fetch(COUNTIES_GEOJSON_URL)
      .then(res => res.json())
      .then(data => {
        cachedGeojson = data
        setGeojson(data)
      })
      .catch(err => console.error('Failed to load county boundaries:', err))
      .finally(() => setIsLoading(false))
  }, [])

  return { geojson, isLoading }
}
