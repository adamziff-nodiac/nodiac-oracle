'use client'

import { Source, Layer } from 'react-map-gl/mapbox'
import type { HubRegion } from '@/types/regional-hubs'

interface HubRegionOverlayProps {
  regions: HubRegion[]
}

export function HubRegionOverlay({ regions }: HubRegionOverlayProps) {
  return (
    <>
      {regions.map((region) => (
        <Source
          key={region.id}
          id={`hub-region-${region.id}`}
          type="geojson"
          data={region.geojson as GeoJSON.Feature | GeoJSON.FeatureCollection}
        >
          <Layer
            id={`hub-region-fill-${region.id}`}
            type="fill"
            paint={{
              'fill-color': region.color,
              'fill-opacity': 0.12,
            }}
          />
          <Layer
            id={`hub-region-border-${region.id}`}
            type="line"
            paint={{
              'line-color': region.color,
              'line-width': 2,
              'line-dasharray': [4, 2],
            }}
          />
        </Source>
      ))}
    </>
  )
}
