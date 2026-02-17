'use client'

import { Source, Layer } from 'react-map-gl/mapbox'

interface HeatmapLayerProps {
  data: GeoJSON.FeatureCollection
  visible?: boolean
}

export function HeatmapLayer({ data, visible = true }: HeatmapLayerProps) {
  const visibility = visible ? 'visible' : 'none'

  return (
    <Source id="hub-heatmap-source" type="geojson" data={data}>
      <Layer
        id="hub-heatmap"
        type="heatmap"
        layout={{ visibility }}
        paint={{
          // Weight each point by its area-dampened normalized score
          'heatmap-weight': ['get', 'weight'],

          // Zoom-dependent radius: wide at low zoom, tight at high zoom
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 40,
            5, 25,
            7, 15,
            9, 10,
          ],

          // Zoom-dependent intensity
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.8,
            5, 1.0,
            7, 1.3,
            9, 1.5,
          ],

          // Brand color ramp: transparent → dark purple → purple → orchid → teal
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,    'rgba(0, 0, 0, 0)',
            0.15, '#1a1520',    // dark purple
            0.35, '#5c2d55',    // medium purple
            0.55, '#8b3578',    // bright purple
            0.75, '#b48fc1',    // orchid
            1.0,  '#4de2e4',    // neon teal
          ],

          // Opacity: slightly transparent at high zoom for cleaner overlays
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.9,
            7, 0.8,
            10, 0.7,
          ],
        }}
      />
    </Source>
  )
}
