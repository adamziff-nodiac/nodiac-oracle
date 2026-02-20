'use client'

import { Source, Layer } from 'react-map-gl/mapbox'

interface OutlineHullsLayerProps {
  hullsGeojson: GeoJSON.FeatureCollection
  regionsGeojson: GeoJSON.FeatureCollection
  visible?: boolean
}

/**
 * Outline view: renders a muted county background with convex hull polygon
 * outlines drawn on top. Counties inside hulls are subtly visible; counties
 * outside are very dark. The primary visual is the glowing neon teal hull borders.
 */
export function OutlineHullsLayer({ hullsGeojson, regionsGeojson, visible = true }: OutlineHullsLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  return (
    <>
      {/* Muted county background for outline mode */}
      <Source id="outline-counties-source" type="geojson" data={regionsGeojson}>
        {/* County fills: dark outside, subtly visible inside hulls */}
        <Layer
          id="outline-counties-fill"
          type="fill"
          layout={{ visibility }}
          paint={{
            'fill-color': [
              'match', ['get', 'clusterStatus'],
              2, '#1a1520',   // member counties: very subtle dark purple
              1, '#160f1e',   // fill counties: slightly lighter than outside
              '#0a0810',      // outside: nearly black
            ] as unknown as string,
            'fill-opacity': [
              'match', ['get', 'clusterStatus'],
              2, 0.9,
              1, 0.85,
              0.95,
            ] as unknown as number,
          }}
        />
        {/* Subtle county borders inside clusters */}
        <Layer
          id="outline-counties-borders"
          type="line"
          layout={{ visibility }}
          filter={['>', ['get', 'clusterStatus'], 0]}
          paint={{
            'line-color': 'rgba(199, 125, 186, 0.1)',
            'line-width': 0.5,
          }}
        />
      </Source>

      {/* Hull outlines with glow effect */}
      <Source id="outline-hulls-source" type="geojson" data={hullsGeojson}>
        {/* Semi-transparent fill inside hulls — eggplant tint */}
        <Layer
          id="outline-hulls-fill"
          type="fill"
          layout={{ visibility }}
          paint={{
            'fill-color': '#490f42',
            'fill-opacity': 0.18,
          }}
        />

        {/* Outer glow: wide translucent orchid line behind the main border */}
        <Layer
          id="outline-hulls-glow-outer"
          type="line"
          layout={{ visibility }}
          paint={{
            'line-color': '#c77dba',
            'line-width': 14,
            'line-opacity': 0.08,
            'line-blur': 10,
          }}
        />

        {/* Mid glow: medium translucent orchid line */}
        <Layer
          id="outline-hulls-glow-mid"
          type="line"
          layout={{ visibility }}
          paint={{
            'line-color': '#c77dba',
            'line-width': 7,
            'line-opacity': 0.22,
            'line-blur': 4,
          }}
        />

        {/* Main border: crisp orchid line */}
        <Layer
          id="outline-hulls-border"
          type="line"
          layout={{ visibility }}
          paint={{
            'line-color': '#c77dba',
            'line-width': 2.5,
            'line-opacity': 0.9,
          }}
        />
      </Source>
    </>
  )
}
