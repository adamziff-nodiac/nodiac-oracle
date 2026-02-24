import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
  Img,
  staticFile,
} from 'remotion';
import {
  UPPER_MIDWEST_SITES,
  MN_SITES,
  IA_SITES,
  WI_SITES,
  type Site,
} from './data';
import { US_STATES, HIGHLIGHT_STATES } from './us-states-data';
import type { VideoTheme } from './themes';
import type { ScriptSegment } from './scripts';

const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
const TOTAL_CAPACITY = Math.round(
  UPPER_MIDWEST_SITES.reduce((s, site) => s + site.capacityMW, 0)
);

// ─── Projection helpers ────────────────────────────────────────────────────────
const REGION_BOUNDS = { minLat: 41.5, maxLat: 46.0, minLng: -96.5, maxLng: -87.5 };
const MAP_VP = { x: 100, y: 120, w: 1720, h: 840 };

// Full US bounds for the zoomed-out view
const US_BOUNDS = { minLat: 24.5, maxLat: 49.5, minLng: -125.0, maxLng: -66.5 };
const US_VP = { x: 60, y: 80, w: 1800, h: 920 };

function proj(site: Site) {
  const xPct = (site.lng - REGION_BOUNDS.minLng) / (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng);
  const yPct = 1 - (site.lat - REGION_BOUNDS.minLat) / (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat);
  return { x: MAP_VP.x + xPct * MAP_VP.w, y: MAP_VP.y + yPct * MAP_VP.h };
}

function lngToX(lng: number) {
  return MAP_VP.x + ((lng - REGION_BOUNDS.minLng) / (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng)) * MAP_VP.w;
}
function latToY(lat: number) {
  return MAP_VP.y + (1 - (lat - REGION_BOUNDS.minLat) / (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat)) * MAP_VP.h;
}

// Project a lat/lng to the US-level viewport
function usProj(lat: number, lng: number) {
  const x = US_VP.x + ((lng - US_BOUNDS.minLng) / (US_BOUNDS.maxLng - US_BOUNDS.minLng)) * US_VP.w;
  const y = US_VP.y + (1 - (lat - US_BOUNDS.minLat) / (US_BOUNDS.maxLat - US_BOUNDS.minLat)) * US_VP.h;
  return { x, y };
}

// Convert a polygon coordinate string ("lat,lng lat,lng ...") to SVG path points
function polyToSvgPath(coordStr: string, projFn: (lat: number, lng: number) => { x: number; y: number }) {
  const pairs = coordStr.split(' ').map(p => p.split(',').map(Number));
  if (pairs.length < 3) return '';
  return pairs.map(([lat, lng], i) => {
    const { x, y } = projFn(lat, lng);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + ' Z';
}

// ─── US Map Component ──────────────────────────────────────────────────────────
function USMapBackground({ t, projFn, vp }: { t: VideoTheme; projFn: (lat: number, lng: number) => { x: number; y: number }; vp: { x: number; y: number; w: number; h: number } }) {
  return (
    <svg width="1920" height="1080" style={{ position: 'absolute' }}>
      {US_STATES.map(state => {
        const isHighlight = HIGHLIGHT_STATES.includes(state.abbr);
        return state.polygons.map((poly, pi) => {
          const d = polyToSvgPath(poly, projFn);
          if (!d) return null;
          return (
            <path
              key={`${state.abbr}-${pi}`}
              d={d}
              fill={isHighlight ? `${t.accent}15` : `${t.textMuted}08`}
              stroke={isHighlight ? t.accent : t.textMuted}
              strokeWidth={isHighlight ? 1.5 : 0.5}
              strokeOpacity={isHighlight ? 0.6 : 0.2}
            />
          );
        });
      })}
    </svg>
  );
}

// Regional map with state boundaries for MN/IA/WI
function RegionalMapBackground({ t }: { t: VideoTheme }) {
  const regionProj = (lat: number, lng: number) => {
    const x = MAP_VP.x + ((lng - REGION_BOUNDS.minLng) / (REGION_BOUNDS.maxLng - REGION_BOUNDS.minLng)) * MAP_VP.w;
    const y = MAP_VP.y + (1 - (lat - REGION_BOUNDS.minLat) / (REGION_BOUNDS.maxLat - REGION_BOUNDS.minLat)) * MAP_VP.h;
    return { x, y };
  };

  // Show MN, IA, WI and immediate neighbors for context
  const showStates = ['MN', 'IA', 'WI', 'ND', 'SD', 'NE', 'MO', 'IL', 'MI', 'IN', 'OH'];

  return (
    <svg width="1920" height="1080" style={{ position: 'absolute' }}>
      {US_STATES.filter(s => showStates.includes(s.abbr)).map(state => {
        const isHighlight = HIGHLIGHT_STATES.includes(state.abbr);
        return state.polygons.map((poly, pi) => {
          const d = polyToSvgPath(poly, regionProj);
          if (!d) return null;
          return (
            <path
              key={`r-${state.abbr}-${pi}`}
              d={d}
              fill={isHighlight ? `${t.accent}12` : 'transparent'}
              stroke={isHighlight ? `${t.accent}60` : `${t.textMuted}25`}
              strokeWidth={isHighlight ? 2 : 0.8}
            />
          );
        });
      })}
    </svg>
  );
}

// ─── Scene 1: Logo ─────────────────────────────────────────────────────────────
function Logo({ t }: { t: VideoTheme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const tagOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const glow = interpolate(frame, [0, 60, 90], [0, 30, 15]);

  const particles = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    const d = i * 2;
    const p = interpolate(frame, [d, d + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return { x: Math.cos(a) * p * 300, y: Math.sin(a) * p * 300, o: interpolate(p, [0, 0.3, 1], [0, 0.8, 0]), s: 2 + Math.random() * 3 };
  });

  // Use white logo for dark themes, dark logo for light themes
  const isDark = t.bg1 !== '#f8f8fa';
  const logoSrc = isDark ? staticFile('nodiac-logo-white-text.png') : staticFile('logo-dark.png');

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${t.bg2} 0%, ${t.bg1} 70%)`, justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {particles.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`, width: p.s, height: p.s, borderRadius: '50%', background: t.accent, opacity: p.o, filter: `blur(${p.s * 0.5}px)` }} />
      ))}
      <div style={{ transform: `scale(${sc})`, opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }), textAlign: 'center', filter: `drop-shadow(0 0 ${glow}px ${t.accent})` }}>
        <Img src={logoSrc} style={{ width: 500, height: 'auto', margin: '0 auto' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 200, opacity: tagOp, fontSize: 26, color: t.accent, fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase' as const, textAlign: 'center', left: 0, right: 0 }}>
        Distributed Power Infrastructure for AI Compute
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 2: Problem ───────────────────────────────────────────────────────────
function Problem({ t }: { t: VideoTheme }) {
  const frame = useCurrentFrame();
  const l1 = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const l2 = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const stOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  const isFast = t.pacing === 'fast';
  const stats = [
    { num: '100+ GW', label: 'AI demand by 2030' },
    { num: '5+ yrs', label: 'Interconnection queue' },
    { num: '$98B', label: 'Delayed data centers' },
  ];

  return (
    <AbsoluteFill style={{ background: t.bg1, justifyContent: 'center', alignItems: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.05 }}>
        {Array.from({ length: 20 }, (_, i) => <line key={i} x1="0" y1={i * 54} x2="1920" y2={i * 54} stroke={t.accent} strokeWidth="1" />)}
      </svg>

      <div style={{ textAlign: 'center', maxWidth: 1200 }}>
        <div style={{ fontSize: (isFast ? 72 : 56) * t.titleScale, fontWeight: t.fontWeight, color: t.text, opacity: l1, transform: `translateY(${(1 - l1) * 40}px)`, marginBottom: 20 }}>
          AI&apos;s bottleneck isn&apos;t chips.
        </div>
        <div style={{ fontSize: (isFast ? 96 : 72) * t.titleScale, fontWeight: t.fontWeight, color: t.accent, opacity: l2, transform: `translateY(${(1 - l2) * 40}px)`, marginBottom: 60 }}>
          It&apos;s speed to power.
        </div>
        <div style={{ display: 'flex', gap: 80, justifyContent: 'center', opacity: stOp }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44 * t.statScale, fontWeight: t.fontWeight, color: t.accent }}>{s.num}</div>
              <div style={{ fontSize: 18, color: t.textMuted, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 3: Solution Zoom (with US Map) ───────────────────────────────────────
function SolutionZoom({ t }: { t: VideoTheme }) {
  const frame = useCurrentFrame();
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const mapOp = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [50, 120], [1, 2.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const mx = interpolate(frame, [50, 120], [0, 280], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const my = interpolate(frame, [50, 120], [0, -100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Highlight pulse for the upper midwest region
  const regionPulse = interpolate(frame, [30, 60, 90, 120], [0, 0.4, 0.3, 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Calculate center of the upper midwest in US projection
  const mwCenter = usProj(44.3, -92.5);

  return (
    <AbsoluteFill style={{ background: t.bg1, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: `scale(${scale}) translate(${mx}px, ${my}px)`, transformOrigin: 'center', opacity: mapOp }}>
        {/* Full US map with state boundaries */}
        <USMapBackground t={t} projFn={usProj} vp={US_VP} />

        {/* Highlight circle around upper midwest */}
        <svg width="1920" height="1080" style={{ position: 'absolute' }}>
          <ellipse cx={mwCenter.x} cy={mwCenter.y} rx={120} ry={90} fill={t.accent} opacity={regionPulse * 0.15} />
          <ellipse cx={mwCenter.x} cy={mwCenter.y} rx={120} ry={90} fill="none" stroke={t.accent} strokeWidth={2} opacity={regionPulse} strokeDasharray="8 4" />
        </svg>
      </div>

      {/* Title overlay */}
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
        <div style={{ fontSize: 48 * t.titleScale, fontWeight: t.fontWeight, color: t.text, opacity: titleOp }}>
          Bring the load to the generation.
        </div>
        <div style={{ fontSize: 24, color: t.accent2, opacity: subOp, marginTop: 12 }}>
          Deploy AI compute where power already exists.
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 4: Regional Map (with state boundaries + sites) ──────────────────────
function RegionalMap({ t }: { t: VideoTheme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const sorted = [...UPPER_MIDWEST_SITES].sort((a, b) => b.lat - a.lat);
  const visCount = Math.min(TOTAL_SITES, Math.max(0, Math.floor((frame - 20) / 2.5)));
  const visCap = sorted.slice(0, visCount).reduce((s, si) => s + si.capacityMW, 0);
  const pulse = (frame % 60) / 60;
  const mapBgOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const dotColor = (state: string) => state === 'MN' ? t.mapDotMN : state === 'IA' ? t.mapDotIA : t.mapDotWI;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, ${t.bg2} 0%, ${t.bg1} 100%)`, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* State boundary outlines */}
      <div style={{ opacity: mapBgOp }}>
        <RegionalMapBackground t={t} />
      </div>

      {/* Title */}
      <div style={{ position: 'absolute', top: 40, left: 80, opacity: titleOp, zIndex: 10 }}>
        <div style={{ fontSize: 18, color: t.accent, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' as const }}>Upper Midwest Regional Hub</div>
        <div style={{ fontSize: 40 * t.titleScale, fontWeight: t.fontWeight, color: t.text, marginTop: 4 }}>Minnesota &bull; Iowa &bull; Wisconsin</div>
      </div>
      <div style={{ position: 'absolute', top: 40, right: 80, textAlign: 'right', opacity: titleOp, zIndex: 10 }}>
        <div style={{ fontSize: 56 * t.statScale, fontWeight: t.fontWeight, color: t.accent }}>{visCount}<span style={{ fontSize: 20, color: t.textMuted, marginLeft: 8 }}>sites</span></div>
        <div style={{ fontSize: 36 * t.statScale, fontWeight: 700, color: t.text }}>{Math.round(visCap)}<span style={{ fontSize: 18, color: t.textMuted, marginLeft: 8 }}>MW</span></div>
      </div>

      <svg width="1920" height="1080" style={{ position: 'absolute', zIndex: 5 }}>
        <defs><filter id="sg"><feGaussianBlur stdDeviation="8" /></filter></defs>

        {/* Pulse */}
        <circle cx={960} cy={540} r={300 + pulse * 100} fill="none" stroke={t.accent} strokeWidth={1} opacity={0.1 * (1 - pulse)} />

        {/* Connections */}
        {sorted.slice(0, visCount).map((site, i) => {
          const p = proj(site);
          return sorted.slice(0, visCount).filter((_, j) => j !== i)
            .map(n => ({ ...n, d: Math.hypot(n.lat - site.lat, n.lng - site.lng), pos: proj(n) }))
            .sort((a, b) => a.d - b.d).slice(0, t.mapStyle === 'network' ? 3 : 2)
            .map((n, ni) => <line key={`c${i}-${ni}`} x1={p.x} y1={p.y} x2={n.pos.x} y2={n.pos.y} stroke={t.accent} strokeWidth={t.mapStyle === 'network' ? 1 : 0.5} opacity={t.mapStyle === 'network' ? 0.25 : 0.15} />);
        })}

        {/* Sites */}
        {sorted.map((site, i) => {
          const vis = i < visCount;
          const ap = vis ? spring({ frame: frame - (20 + i * 2.5), fps, config: { damping: 10, mass: 0.5 } }) : 0;
          const p = proj(site);
          const r = (t.mapStyle === 'bold' ? 6 : 4) + Math.sqrt(site.capacityMW) * (t.mapStyle === 'bold' ? 2.2 : 1.8);
          const c = dotColor(site.state);
          return (
            <g key={site.name}>
              {vis && <circle cx={p.x} cy={p.y} r={r * 3 * ap} fill={c} opacity={(t.mapStyle === 'glow' ? 0.25 : 0.15) * ap} filter="url(#sg)" />}
              <circle cx={p.x} cy={p.y} r={r * ap} fill={c} opacity={ap} stroke={t.text} strokeWidth={site.isPilot ? 2 : 0.5} strokeOpacity={ap * 0.8} />
              {vis && site.capacityMW >= (t.mapStyle === 'bold' ? 6 : 8) && (
                <text x={p.x + r + 6} y={p.y + 4} fill={t.text} fontSize={t.mapStyle === 'bold' ? 13 : 11} fontWeight={600} opacity={ap * 0.9} fontFamily="Inter, system-ui, sans-serif">{site.name}</text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ position: 'absolute', bottom: 40, left: 80, display: 'flex', gap: 30, opacity: titleOp, zIndex: 10 }}>
        {[{ c: t.mapDotMN, l: `Minnesota (${MN_SITES.length})` }, { c: t.mapDotIA, l: `Iowa (${IA_SITES.length})` }, { c: t.mapDotWI, l: `Wisconsin (${WI_SITES.length})` }].map(it => (
          <div key={it.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: it.c }} />
            <span style={{ color: t.textMuted, fontSize: 14 }}>{it.l}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 5: Pilot Sites ───────────────────────────────────────────────────────
function PilotSites({ t }: { t: VideoTheme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const c1 = spring({ frame: frame - 15, fps, config: { damping: 12 } });
  const c2 = spring({ frame: frame - 30, fps, config: { damping: 12 } });
  const podOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' });

  const sites = [
    { label: 'Anchor Site', name: 'Hay River', loc: 'Boyceville, Wisconsin', mw: '2 MW', exp: '10 MW', detail: 'Dunn Energy Cooperative \u2022 IX application in progress\nStrategic grid capacity \u2022 Close fiber proximity', color: t.accent },
    { label: 'Pilot Site', name: 'Walleye', loc: 'Colfax, Wisconsin', mw: '1.8 MW', exp: '15 MW', detail: 'Dunn Energy Cooperative \u2022 IX application in progress\nNo substation upgrades needed \u2022 Considerable headroom', color: t.accent2 },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${t.gradientDirection}, ${t.bg1} 0%, ${t.bg2} 100%)`, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', opacity: titleOp }}>
        <div style={{ fontSize: 18, color: t.accent, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' as const }}>Pilot Sites Under Development</div>
        <div style={{ fontSize: 44 * t.titleScale, fontWeight: t.fontWeight, color: t.text, marginTop: 8 }}>First to energize. First to market.</div>
      </div>
      <div style={{ position: 'absolute', top: 220, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60 }}>
        {sites.map((s, i) => {
          const op = i === 0 ? c1 : c2;
          return (
            <div key={s.name} style={{ width: 500, padding: 40, borderRadius: 20, background: t.cardBg, border: `1px solid ${s.color}30`, transform: `translateY(${(1 - op) * 40}px)`, opacity: op }}>
              <div style={{ fontSize: 14, color: s.color, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' as const }}>{s.label}</div>
              <div style={{ fontSize: 36, fontWeight: t.fontWeight, color: t.text, marginTop: 8 }}>{s.name}</div>
              <div style={{ fontSize: 18, color: t.textMuted, marginTop: 4 }}>{s.loc}</div>
              <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
                <div><div style={{ fontSize: 32, fontWeight: t.fontWeight, color: t.accent }}>{s.mw}</div><div style={{ fontSize: 13, color: t.textMuted }}>Confirmed Power</div></div>
                <div><div style={{ fontSize: 32, fontWeight: t.fontWeight, color: t.accent2 }}>{s.exp}</div><div style={{ fontSize: 13, color: t.textMuted }}>Expansion Target</div></div>
              </div>
              <div style={{ marginTop: 20, fontSize: 14, color: t.textMuted, lineHeight: 1.6, whiteSpace: 'pre-line' as const }}>{s.detail}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', opacity: podOp }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{ width: 120, height: 50, borderRadius: 6, background: `linear-gradient(180deg, ${t.accent}30, ${t.bg2}60)`, border: `1px solid ${t.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: t.accent, fontWeight: 600 }}>ARMADA POD</div>
          ))}
        </div>
        <div style={{ fontSize: 16, color: t.textMuted, marginTop: 12 }}>Modular compute pods on trailers &mdash; no concrete, no permitting delays</div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 6: Reliability ───────────────────────────────────────────────────────
function Reliability({ t }: { t: VideoTheme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const netOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });
  const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;

  const tiers = [
    { name: 'Standard', up: '99.9%', cap: '153 MW', pct: '83%', delay: 20, color: t.accent },
    { name: 'Premium', up: '99.99%', cap: '127 MW', pct: '69%', delay: 35, color: t.accent2 },
    { name: 'Ultra', up: '99.999%', cap: '100 MW', pct: '54%', delay: 50, color: '#e86df7' },
  ];

  return (
    <AbsoluteFill style={{ background: t.bg1, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', left: 60, top: 120, width: 700, height: 840, opacity: netOp }}>
        <svg width="700" height="840">
          <circle cx={350} cy={420} r={40} fill={t.bg2} stroke={t.accent} strokeWidth={2} />
          <text x={350} y={425} fill={t.text} fontSize={14} fontWeight={700} textAnchor="middle" fontFamily="Inter, system-ui, sans-serif">HUB</text>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const x = 350 + Math.cos(a) * 250, y = 420 + Math.sin(a) * 250;
            const ap = interpolate(frame, [20 + i * 5, 35 + i * 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <g key={i}>
                <line x1={350} y1={420} x2={350 + (x - 350) * ap} y2={420 + (y - 420) * ap} stroke={t.accent} strokeWidth={1} opacity={0.3 * ap} />
                <circle cx={x} cy={y} r={12 * ap} fill={t.accent} opacity={ap * pulse} />
                {i > 0 && <line x1={x} y1={y} x2={350 + Math.cos(((i - 1) / 12) * Math.PI * 2 - Math.PI / 2) * 250} y2={420 + Math.sin(((i - 1) / 12) * Math.PI * 2 - Math.PI / 2) * 250} stroke={t.accent2} strokeWidth={1} opacity={0.2 * ap} strokeDasharray="4 4" />}
              </g>
            );
          })}
          <text x={350} y={750} fill={t.textMuted} fontSize={14} textAnchor="middle" fontFamily="Inter, system-ui, sans-serif">N+1 distributed redundancy across the fleet</text>
        </svg>
      </div>
      <div style={{ position: 'absolute', right: 80, top: 120, width: 800 }}>
        <div style={{ opacity: titleOp }}>
          <div style={{ fontSize: 18, color: t.accent, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' as const }}>Distributed Reliability</div>
          <div style={{ fontSize: 44 * t.titleScale, fontWeight: t.fontWeight, color: t.text, marginTop: 8 }}>99.999% uptime.<br />No backup generators.</div>
          <div style={{ fontSize: 18, color: t.textMuted, marginTop: 12, lineHeight: 1.6 }}>Geographic diversification replaces traditional redundancy.<br />Validated by 200K Monte Carlo simulations.</div>
        </div>
        <div style={{ marginTop: 60 }}>
          {tiers.map((tier) => {
            const op = spring({ frame: frame - tier.delay, fps, config: { damping: 12 } });
            return (
              <div key={tier.name} style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, opacity: op, transform: `translateX(${(1 - op) * 30}px)` }}>
                <div style={{ width: 8, height: 60, borderRadius: 4, background: tier.color }} />
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: t.text }}>{tier.name} <span style={{ color: tier.color, fontSize: 26, fontWeight: t.fontWeight }}>{tier.up}</span></div>
                  <div style={{ fontSize: 15, color: t.textMuted }}>{tier.cap} guaranteed &bull; {tier.pct} of fleet</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 7: Value Props ───────────────────────────────────────────────────────
function ValueProps({ t }: { t: VideoTheme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scaleOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' });
  const props = [
    { icon: '\u26A1', title: 'Faster to Market', desc: 'Existing infrastructure accelerates development', color: t.accent },
    { icon: '\uD83C\uDF31', title: 'Cleaner Compute', desc: 'Behind-the-meter renewable power', color: '#22c55e' },
    { icon: '\uD83D\uDD0C', title: 'Lower Grid Burden', desc: 'Minimal incremental upgrades', color: t.accent2 },
    { icon: '\uD83D\uDD01', title: 'Repeatable Deployments', desc: 'Standardized design that scales', color: '#e86df7' },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${t.bg1} 0%, ${t.bg2} 100%)`, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', top: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40, padding: '0 80px' }}>
        {props.map((p, i) => {
          const cs = spring({ frame: frame - i * 12, fps, config: { damping: 12 } });
          return (
            <div key={p.title} style={{ width: 380, padding: 36, borderRadius: 16, background: t.cardBg, border: `1px solid ${p.color}30`, transform: `translateY(${(1 - cs) * 40}px)`, opacity: cs, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{p.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 8 }}>{p.title}</div>
              <div style={{ fontSize: 15, color: t.textMuted, lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, opacity: scaleOp }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 18, color: t.accent, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' as const }}>Scaling Roadmap</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 60, alignItems: 'flex-end' }}>
          {[{ y: 'Q4 2026', mw: '50 MW', rev: '$20M ARR', h: 80 }, { y: '2027', mw: '200 MW', rev: '$80M ARR', h: 140 }, { y: '2028+', mw: '1 GW+', rev: '$400M+ ARR', h: 220 }].map((m, i) => {
            const bs = spring({ frame: frame - 85 - i * 10, fps, config: { damping: 15 } });
            return (
              <div key={m.y} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: t.fontWeight, color: t.accent, marginBottom: 4 }}>{m.mw}</div>
                <div style={{ fontSize: 14, color: t.textMuted, marginBottom: 8 }}>{m.rev}</div>
                <div style={{ width: 100, height: m.h * bs, borderRadius: '8px 8px 0 0', background: `linear-gradient(180deg, ${t.accent}, ${t.bg2})`, margin: '0 auto' }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: t.text, marginTop: 8 }}>{m.y}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 8: CTA ───────────────────────────────────────────────────────────────
function CTA({ t }: { t: VideoTheme }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const tagOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const statsOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' });
  const ctaOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });

  const isDark = t.bg1 !== '#f8f8fa';
  const logoSrc = isDark ? staticFile('nodiac-logo-white-text.png') : staticFile('logo-dark.png');

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${t.bg2} 0%, ${t.bg1} 70%)`, fontFamily: 'Inter, system-ui, sans-serif', justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: 60 }, (_, i) => ({ x: ((i * 37 + frame * 0.3) % 1920), y: ((i * 53) % 1080), o: 0.1 + Math.sin(frame * 0.05 + i) * 0.05 })).map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 2, height: 2, borderRadius: '50%', background: t.accent, opacity: p.o }} />
      ))}
      <div style={{ textAlign: 'center', transform: `scale(${sc})` }}>
        <Img src={logoSrc} style={{ width: 400, height: 'auto', margin: '0 auto' }} />
      </div>
      <div style={{ position: 'absolute', bottom: 280, left: 0, right: 0, textAlign: 'center', opacity: tagOp }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: t.text }}>The fastest path to distributed AI compute<br /><span style={{ color: t.accent }}>in the Upper Midwest.</span></div>
      </div>
      <div style={{ position: 'absolute', bottom: 180, left: 0, right: 0, textAlign: 'center', opacity: statsOp, display: 'flex', justifyContent: 'center', gap: 60 }}>
        {[{ n: `${TOTAL_SITES}`, l: 'Sites' }, { n: `${TOTAL_CAPACITY}+`, l: 'MW' }, { n: '3', l: 'States' }, { n: '99.999%', l: 'Uptime' }].map(s => (
          <div key={s.l}><div style={{ fontSize: 32 * t.statScale, fontWeight: t.fontWeight, color: t.accent }}>{s.n}</div><div style={{ fontSize: 14, color: t.textMuted }}>{s.l}</div></div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center', opacity: ctaOp }}>
        <div style={{ fontSize: 20, color: t.textMuted, letterSpacing: 3 }}>NODIAC.AI</div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Subtitle Overlay ───────────────────────────────────────────────────────────
function Subs({ t, segments }: { t: VideoTheme; segments: ScriptSegment[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  const seg = segments.find(s => sec >= s.start && sec < s.end);
  if (!seg || !seg.text) return null;
  const p = (sec - seg.start) / (seg.end - seg.start);
  const fi = interpolate(p, [0, 0.1], [0, 1], { extrapolateRight: 'clamp' });
  const fo = interpolate(p, [0.85, 1], [1, 0], { extrapolateLeft: 'clamp' });
  return (
    <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center', opacity: fi * fo, zIndex: 100, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'inline-block', background: t.subtitleBg, borderRadius: 8, padding: '10px 24px', backdropFilter: 'blur(8px)' }}>
        <span style={{ color: t.bg1 === '#f8f8fa' ? '#1a1a2e' : '#ffffff', fontSize: 22, fontWeight: 500 }}>{seg.text}</span>
      </div>
    </div>
  );
}

// ─── Main Composition ───────────────────────────────────────────────────────────
export const ThemedVideo: React.FC<{ theme: VideoTheme; scriptSegments: ScriptSegment[] }> = ({ theme: t, scriptSegments }) => {
  // Adjust timing for pacing
  const fast = t.pacing === 'fast';
  const cine = t.pacing === 'cinematic';
  const dur = (base: number) => fast ? Math.round(base * 0.85) : cine ? Math.round(base * 1.1) : base;

  const s1 = 0, d1 = dur(120);
  const s2 = s1 + d1, d2 = dur(150);
  const s3 = s2 + d2, d3 = dur(150);
  const s4 = s3 + d3, d4 = dur(480);
  const s5 = s4 + d4, d5 = dur(360);
  const s6 = s5 + d5, d6 = dur(330);
  const s7 = s6 + d6, d7 = dur(330);
  const s8 = s7 + d7, d8 = dur(360);

  return (
    <AbsoluteFill style={{ background: t.bg1 }}>
      <Sequence from={s1} durationInFrames={d1}><Logo t={t} /></Sequence>
      <Sequence from={s2} durationInFrames={d2}><Problem t={t} /></Sequence>
      <Sequence from={s3} durationInFrames={d3}><SolutionZoom t={t} /></Sequence>
      <Sequence from={s4} durationInFrames={d4}><RegionalMap t={t} /></Sequence>
      <Sequence from={s5} durationInFrames={d5}><PilotSites t={t} /></Sequence>
      <Sequence from={s6} durationInFrames={d6}><Reliability t={t} /></Sequence>
      <Sequence from={s7} durationInFrames={d7}><ValueProps t={t} /></Sequence>
      <Sequence from={s8} durationInFrames={d8}><CTA t={t} /></Sequence>
      <Subs t={t} segments={scriptSegments} />
    </AbsoluteFill>
  );
};
