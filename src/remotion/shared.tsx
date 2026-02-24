// Shared utilities for all Remotion video compositions
import React from 'react';
import { Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { US_STATES, HIGHLIGHT_STATES } from './us-states-data';
import type { Site } from './data';

// ─── Colors ────────────────────────────────────────────────────────────────────
export const C = {
  bg: '#0a0a14',
  bg2: '#1a1a2e',
  eggplant: '#490f42',
  multiply: '#250721',
  teal: '#4de2e4',
  orchid: '#b48fc1',
  magenta: '#e86df7',
  lilac: '#928a97',
  white: '#ffffff',
  muted: '#888888',
  mn: '#6366f1',
  ia: '#22d3ee',
  wi: '#f43f5e',
};

export const FONT = 'Inter, system-ui, sans-serif';

// ─── Projection helpers ────────────────────────────────────────────────────────
export const REGION_BOUNDS = { minLat: 41.5, maxLat: 46.0, minLng: -96.5, maxLng: -87.5 };
export const MAP_VP = { x: 100, y: 120, w: 1720, h: 840 };

export const US_BOUNDS = { minLat: 24.5, maxLat: 49.5, minLng: -125.0, maxLng: -66.5 };
export const US_VP = { x: 60, y: 80, w: 1800, h: 920 };

export function regionProj(lat: number, lng: number) {
  return {
    x: MAP_VP.x + ((lng - REGION_BOUNDS.minLng) / (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng)) * MAP_VP.w,
    y: MAP_VP.y + (1 - (lat - REGION_BOUNDS.minLat) / (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat)) * MAP_VP.h,
  };
}

export function siteProj(site: Site) {
  return regionProj(site.lat, site.lng);
}

export function usProj(lat: number, lng: number) {
  return {
    x: US_VP.x + ((lng - US_BOUNDS.minLng) / (US_BOUNDS.maxLng - US_BOUNDS.minLng)) * US_VP.w,
    y: US_VP.y + (1 - (lat - US_BOUNDS.minLat) / (US_BOUNDS.maxLat - US_BOUNDS.minLat)) * US_VP.h,
  };
}

// Upper midwest center in US projection (for zoom targeting)
export const MW_CENTER_US = usProj(44.3, -92.5);
// To zoom from screen center (960, 540) onto upper midwest:
// translate needed: (960 - MW_CENTER_US.x, 540 - MW_CENTER_US.y)
export const ZOOM_TO_MW = {
  tx: 960 - MW_CENTER_US.x,  // approximately -100
  ty: 540 - MW_CENTER_US.y,  // approximately +269
};

// ─── SVG path helpers ──────────────────────────────────────────────────────────
export function polyToPath(
  coordStr: string,
  projFn: (lat: number, lng: number) => { x: number; y: number }
) {
  const pairs = coordStr.split(' ').map(p => p.split(',').map(Number));
  if (pairs.length < 3) return '';
  return pairs.map(([lat, lng], i) => {
    const { x, y } = projFn(lat, lng);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

// ─── US Map SVG (full US) ──────────────────────────────────────────────────────
export function USMap({ projFn, accentColor = C.teal, mutedColor = C.lilac, highlightFill = true }: {
  projFn: (lat: number, lng: number) => { x: number; y: number };
  accentColor?: string;
  mutedColor?: string;
  highlightFill?: boolean;
}) {
  return (
    <>
      {US_STATES.map(state => {
        const hl = HIGHLIGHT_STATES.includes(state.abbr);
        return state.polygons.map((poly, pi) => {
          const d = polyToPath(poly, projFn);
          if (!d) return null;
          return (
            <path
              key={`${state.abbr}-${pi}`}
              d={d}
              fill={hl && highlightFill ? `${accentColor}15` : 'transparent'}
              stroke={hl ? accentColor : mutedColor}
              strokeWidth={hl ? 1.5 : 0.5}
              strokeOpacity={hl ? 0.6 : 0.2}
            />
          );
        });
      })}
    </>
  );
}

// ─── Regional Map SVG (MN/IA/WI + neighbors) ──────────────────────────────────
export function RegionalStates({ accentColor = C.teal, mutedColor = C.lilac }: {
  accentColor?: string;
  mutedColor?: string;
}) {
  const show = ['MN', 'IA', 'WI', 'ND', 'SD', 'NE', 'MO', 'IL', 'MI', 'IN', 'OH'];
  return (
    <>
      {US_STATES.filter(s => show.includes(s.abbr)).map(state => {
        const hl = HIGHLIGHT_STATES.includes(state.abbr);
        return state.polygons.map((poly, pi) => {
          const d = polyToPath(poly, regionProj);
          if (!d) return null;
          return (
            <path
              key={`r-${state.abbr}-${pi}`}
              d={d}
              fill={hl ? `${accentColor}12` : 'transparent'}
              stroke={hl ? `${accentColor}60` : `${mutedColor}25`}
              strokeWidth={hl ? 2 : 0.8}
            />
          );
        });
      })}
    </>
  );
}

// ─── Nodiac Logo ───────────────────────────────────────────────────────────────
export function NodiacLogo({ dark = true, width = 400 }: { dark?: boolean; width?: number }) {
  const src = dark ? staticFile('nodiac-logo-white-text.png') : staticFile('logo-dark.png');
  return <Img src={src} style={{ width, height: 'auto' }} />;
}

// ─── State dot color ───────────────────────────────────────────────────────────
export function stateColor(state: string) {
  return state === 'MN' ? C.mn : state === 'IA' ? C.ia : C.wi;
}

// ─── Subtitles ──────────────────────────────────────────────────────────────────
export interface SubSegment { start: number; end: number; text: string }

export function Subtitles({ segments, enabled = true }: { segments: SubSegment[]; enabled?: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  if (!enabled) return null;
  const seg = segments.find(s => sec >= s.start && sec < s.end);
  if (!seg || !seg.text) return null;
  const p = (sec - seg.start) / (seg.end - seg.start);
  const fi = interpolate(p, [0, 0.08], [0, 1], { extrapolateRight: 'clamp' });
  const fo = interpolate(p, [0.88, 1], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center', opacity: fi * fo, zIndex: 100, fontFamily: FONT }}>
      <div style={{ display: 'inline-block', background: 'rgba(0,0,0,0.8)', borderRadius: 8, padding: '10px 28px', maxWidth: 1200 }}>
        <span style={{ color: C.white, fontSize: 22, fontWeight: 500 }}>{seg.text}</span>
      </div>
    </div>
  );
}
