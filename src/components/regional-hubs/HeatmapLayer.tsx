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
          // Weight each point by its curved, area-dampened score
          'heatmap-weight': ['get', 'weight'],

          // Wider radius for regional blending — fills gaps between
          // neighboring counties to form cohesive hub zones
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 35,
            5, 22,
            7, 15,
            9, 10,
          ],

          // Moderate intensity — the power curve does the selectivity
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.8,
            5, 1.0,
            7, 1.2,
            9, 1.4,
          ],

          // Color ramp: faint purple appears early for regional wash,
          // bright colors reserved for true hotspots
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,    'rgba(0, 0, 0, 0)',
            0.1,  'rgba(26, 21, 32, 0.4)',   // very faint dark purple
            0.25, '#2d2233',                   // dark purple wash
            0.4,  '#5c2d55',                   // medium purple
            0.6,  '#8b3578',                   // bright purple
            0.8,  '#b48fc1',                   // orchid
            1.0,  '#4de2e4',                   // neon teal
          ],

          // Opacity
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.85,
            7, 0.75,
            10, 0.65,
          ],
        }}
      />
    </Source>
  )
}
