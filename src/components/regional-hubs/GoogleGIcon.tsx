'use client'

import { useEffect } from 'react'
import { useMap } from 'react-map-gl/mapbox'

const deg2rad = (d: number) => d * Math.PI / 180

function drawGoogleG(ctx: CanvasRenderingContext2D, s: number) {
  const cx = s / 2, cy = s / 2
  const outerR = s / 2, innerR = s * 0.27
  const barH = outerR - innerR

  function sector(startDeg: number, endDeg: number, color: string) {
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, deg2rad(startDeg), deg2rad(endDeg))
    ctx.arc(cx, cy, innerR, deg2rad(endDeg), deg2rad(startDeg), true)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  sector(1, 90, '#34A853')
  sector(90, 180, '#FBBC05')
  sector(180, 270, '#EA4335')
  sector(270, 330, '#4285F4')

  ctx.beginPath()
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.fillStyle = '#4285F4'
  ctx.fillRect(cx, cy - barH / 2, outerR, barH)
}

function addIcons(m: mapboxgl.Map) {
  if (m.hasImage('google-g-icon')) return

  const dpr = 2

  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size * dpr
  canvas.height = size * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  drawGoogleG(ctx, size)
  const imgData = ctx.getImageData(0, 0, size * dpr, size * dpr)
  m.addImage('google-g-icon', { width: size * dpr, height: size * dpr, data: new Uint8Array(imgData.data) }, { pixelRatio: dpr })

  const cSize = 40
  const cCanvas = document.createElement('canvas')
  cCanvas.width = cSize * dpr
  cCanvas.height = cSize * dpr
  const cCtx = cCanvas.getContext('2d')!
  cCtx.scale(dpr, dpr)
  drawGoogleG(cCtx, cSize)
  const cImgData = cCtx.getImageData(0, 0, cSize * dpr, cSize * dpr)
  m.addImage('google-g-cluster', { width: cSize * dpr, height: cSize * dpr, data: new Uint8Array(cImgData.data) }, { pixelRatio: dpr })
}

/**
 * Renderless component that registers the Google "G" logo as a Mapbox icon.
 * Must be rendered inside a <Map> from react-map-gl.
 * Registers both `google-g-icon` (32px) and `google-g-cluster` (40px).
 */
export function GoogleGIcon() {
  const { current: map } = useMap()

  useEffect(() => {
    if (!map) return
    const m = map.getMap()

    const handler = () => addIcons(m)
    if (m.isStyleLoaded()) handler()
    m.on('style.load', handler)

    return () => { m.off('style.load', handler) }
  }, [map])

  return null
}
