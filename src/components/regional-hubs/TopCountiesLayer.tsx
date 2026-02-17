'use client'

import { Layer } from 'react-map-gl/mapbox'

interface TopCountiesLayerProps {
  threshold: number
  visible?: boolean
}

/**
 * Binary threshold layer: counties above the score cutoff glow teal,
 * rest stay dark. Rendered on top of the county-boundaries source.
 */
export function TopCountiesLayer({ threshold, visible = true }: TopCountiesLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  return (
    <>
      <Layer
        id="top-counties-fill"
        source="county-boundaries"
        type="fill"
        layout={{ visibility }}
        filter={['>=', ['get', 'compositeScore'], threshold]}
        paint={{
          'fill-color': '#4de2e4',
          'fill-opacity': 0.6,
        }}
      />
      <Layer
        id="top-counties-outline"
        source="county-boundaries"
        type="line"
        layout={{ visibility }}
        filter={['>=', ['get', 'compositeScore'], threshold]}
        paint={{
          'line-color': 'rgba(255, 255, 255, 0.3)',
          'line-width': 0.8,
        }}
      />
    </>
  )
}
