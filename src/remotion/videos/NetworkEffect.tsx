// Video 4: "The Network Effect" — Data Visualization Story
// 60 seconds. Abstract, organic. The network as a living organism.
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
import { UPPER_MIDWEST_SITES } from '../data';
import { C, FONT, NodiacLogo, siteProj, stateColor, regionProj } from '../shared';

const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
const TOTAL_CAP = Math.round(UPPER_MIDWEST_SITES.reduce((s, si) => s + si.capacityMW, 0));

// Sorted by capacity descending for growth order
const SORTED_SITES = [...UPPER_MIDWEST_SITES].sort((a, b) => b.capacityMW - a.capacityMW);

// Precompute nearest neighbors
const NEIGHBORS = UPPER_MIDWEST_SITES.map((site) => {
  return UPPER_MIDWEST_SITES
    .map((n, i) => ({ i, d: Math.hypot(n.lat - site.lat, n.lng - site.lng) }))
    .filter(x => x.d > 0)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(x => x.i);
});

// ─── Scene 1: Genesis (0:00-0:10) — Network grows from nothing ─────────────────
function Genesis() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Grow from 2 pilot sites to all 42
  const growthProgress = interpolate(frame, [0, 280], [0, 1], { extrapolateRight: 'clamp' });
  const visibleCount = Math.min(TOTAL_SITES, Math.max(2, Math.floor(growthProgress * TOTAL_SITES)));

  // Start with pilots, then add by capacity
  const pilotIndices = UPPER_MIDWEST_SITES.map((s, i) => s.isPilot ? i : -1).filter(i => i >= 0);
  const nonPilots = UPPER_MIDWEST_SITES.map((_, i) => i).filter(i => !UPPER_MIDWEST_SITES[i].isPilot)
    .sort((a, b) => UPPER_MIDWEST_SITES[b].capacityMW - UPPER_MIDWEST_SITES[a].capacityMW);
  const growOrder = [...pilotIndices, ...nonPilots];
  const activeIndices = new Set(growOrder.slice(0, visibleCount));

  // Interpolate positions from center to actual positions
  const centerX = 960;
  const centerY = 500;

  const textOp = interpolate(frame, [250, 270], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: FONT }}>
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        <defs>
          <filter id="ng"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        {/* Connection lines */}
        {UPPER_MIDWEST_SITES.map((site, i) => {
          if (!activeIndices.has(i)) return null;
          const p = siteProj(site);
          const birthFrame = growOrder.indexOf(i) * (280 / TOTAL_SITES);
          const age = Math.max(0, frame - birthFrame);
          const posLerp = Math.min(1, age / 40);

          const sx = centerX + (p.x - centerX) * posLerp;
          const sy = centerY + (p.y - centerY) * posLerp;

          return NEIGHBORS[i]
            .filter(ni => activeIndices.has(ni))
            .map(ni => {
              const n = UPPER_MIDWEST_SITES[ni];
              const np = siteProj(n);
              const nBirth = growOrder.indexOf(ni) * (280 / TOTAL_SITES);
              const nAge = Math.max(0, frame - nBirth);
              const nLerp = Math.min(1, nAge / 40);
              const nx = centerX + (np.x - centerX) * nLerp;
              const ny = centerY + (np.y - centerY) * nLerp;

              const lineOp = Math.min(posLerp, nLerp) * 0.2;

              return <line key={`${i}-${ni}`} x1={sx} y1={sy} x2={nx} y2={ny} stroke={C.teal} strokeWidth={1} opacity={lineOp} />;
            });
        })}

        {/* Dots */}
        {UPPER_MIDWEST_SITES.map((site, i) => {
          if (!activeIndices.has(i)) return null;
          const p = siteProj(site);
          const birthFrame = growOrder.indexOf(i) * (280 / TOTAL_SITES);
          const age = Math.max(0, frame - birthFrame);
          const posLerp = Math.min(1, age / 40);
          const scaleLerp = spring({ frame: Math.max(0, frame - birthFrame), fps, config: { damping: 10, mass: 0.5 } });

          const sx = centerX + (p.x - centerX) * posLerp;
          const sy = centerY + (p.y - centerY) * posLerp;
          const r = (3 + Math.sqrt(site.capacityMW) * 1.2) * scaleLerp;
          const c = stateColor(site.state);

          return (
            <g key={site.name}>
              <circle cx={sx} cy={sy} r={r * 2.5} fill={c} opacity={0.1 * scaleLerp} filter="url(#ng)" />
              <circle cx={sx} cy={sy} r={r} fill={c} opacity={0.8 * scaleLerp} />
            </g>
          );
        })}
      </svg>

      {/* Counter */}
      <div style={{ position: 'absolute', top: 40, left: 80, opacity: textOp }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: C.teal }}>{TOTAL_SITES} <span style={{ fontSize: 18, color: C.lilac }}>NODES</span></div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 2: The Heartbeat (0:10-0:22) — Pulsing network ─────────────────────
function Heartbeat() {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame * 0.08) * 0.5 + 0.5;
  const rippleRadius = (frame % 90) / 90;

  const text1Op = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const text1Fo = interpolate(frame, [120, 140], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const text2Op = interpolate(frame, [160, 180], [0, 1], { extrapolateRight: 'clamp' });
  const text2Fo = interpolate(frame, [280, 300], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: FONT }}>
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        <defs><filter id="hg"><feGaussianBlur stdDeviation="6" /></filter></defs>

        {/* Ripple from center */}
        <circle cx={960} cy={500} r={rippleRadius * 600} fill="none" stroke={C.teal} strokeWidth={1} opacity={(1 - rippleRadius) * 0.2} />

        {/* Connection lines pulsing */}
        {UPPER_MIDWEST_SITES.map((site, i) => {
          const p = siteProj(site);
          return NEIGHBORS[i].map(ni => {
            const n = UPPER_MIDWEST_SITES[ni];
            const np = siteProj(n);
            // Animated dash offset for "data flow"
            const dashOffset = -frame * 2;
            return (
              <line key={`${i}-${ni}`} x1={p.x} y1={p.y} x2={np.x} y2={np.y}
                stroke={C.teal} strokeWidth={1} opacity={0.15 + pulse * 0.1}
                strokeDasharray="4 8" strokeDashoffset={dashOffset}
              />
            );
          });
        })}

        {/* Dots sized by capacity */}
        {UPPER_MIDWEST_SITES.map((site, i) => {
          const p = siteProj(site);
          const r = 3 + Math.sqrt(site.capacityMW) * 1.2;
          const c = stateColor(site.state);
          // Heartbeat: each dot brightens when ripple reaches it
          const dist = Math.hypot(p.x - 960, p.y - 500);
          const rippleHit = Math.abs(dist - rippleRadius * 600) < 40;
          const brightness = rippleHit ? 1 : 0.5 + pulse * 0.3;

          return (
            <g key={site.name}>
              <circle cx={p.x} cy={p.y} r={r * 2} fill={c} opacity={brightness * 0.15} filter="url(#hg)" />
              <circle cx={p.x} cy={p.y} r={r} fill={c} opacity={brightness} />
            </g>
          );
        })}
      </svg>

      {/* Text overlays */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: C.teal, opacity: text1Op * text1Fo }}>
          {TOTAL_CAP} MW
        </div>
      </div>
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: C.white, opacity: text2Op * text2Fo }}>
          99.999% UPTIME
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 3: Resilience Test (0:22-0:34) — Nodes fail and heal ────────────────
function ResilienceTest() {
  const frame = useCurrentFrame();

  // First failure: 3 nodes at frame 30
  const fail1 = frame >= 30;
  const heal1 = frame >= 150;
  const fail1Nodes = [5, 15, 25];

  // Second failure: 6 nodes at frame 180
  const fail2 = frame >= 180;
  const heal2 = frame >= 300;
  const fail2Nodes = [2, 8, 12, 20, 30, 35];

  const allFailed = new Set([
    ...(fail1 && !heal1 ? fail1Nodes : []),
    ...(fail2 && !heal2 ? fail2Nodes : []),
  ]);

  const text1Op = interpolate(frame, [30, 50, 140, 160], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const text2Op = interpolate(frame, [180, 200, 290, 310], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const text3Op = interpolate(frame, [320, 340], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: FONT }}>
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        <defs><filter id="rg"><feGaussianBlur stdDeviation="6" /></filter></defs>

        {/* Connections - rerouting when nodes fail */}
        {UPPER_MIDWEST_SITES.map((site, i) => {
          if (allFailed.has(i)) return null;
          const p = siteProj(site);
          return NEIGHBORS[i]
            .filter(ni => !allFailed.has(ni))
            .map(ni => {
              const n = UPPER_MIDWEST_SITES[ni];
              const np = siteProj(n);
              return <line key={`${i}-${ni}`} x1={p.x} y1={p.y} x2={np.x} y2={np.y} stroke={C.teal} strokeWidth={1} opacity={0.2} />;
            });
        })}

        {/* Dots */}
        {UPPER_MIDWEST_SITES.map((site, i) => {
          const p = siteProj(site);
          const r = 3 + Math.sqrt(site.capacityMW) * 1.2;
          const isFailed = allFailed.has(i);

          return (
            <g key={site.name}>
              {/* Failure ring */}
              {isFailed && (
                <circle cx={p.x} cy={p.y} r={r * 3} fill="none" stroke="#ff3333" strokeWidth={1.5} opacity={0.5 + Math.sin(frame * 0.3) * 0.3} />
              )}
              <circle cx={p.x} cy={p.y} r={r} fill={isFailed ? '#ff3333' : stateColor(site.state)} opacity={isFailed ? 0.3 : 0.8} />
            </g>
          );
        })}
      </svg>

      {/* Status text */}
      <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#ff6666', opacity: text1Op }}>
          DISTRIBUTED N+1
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#ff6666', opacity: text2Op }}>
          ZERO BACKUP GENERATORS
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, color: C.teal, opacity: text3Op }}>
          THE NETWORK HEALS
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 4: Growth (0:34-0:48) — Network expands ────────────────────────────
function Growth() {
  const frame = useCurrentFrame();
  const growthPct = interpolate(frame, [0, 350], [0, 1], { extrapolateRight: 'clamp' });
  const mw = interpolate(growthPct, [0, 0.1, 0.4, 0.7, 1], [50, 100, 200, 500, 1000]);
  const rev = mw * 0.78; // $780K/MW

  // Existing sites + phantom "future" sites
  const futureCount = Math.floor(growthPct * 60);
  const futureDots = Array.from({ length: futureCount }, (_, i) => {
    // Spread outward from existing sites
    const seed = UPPER_MIDWEST_SITES[i % TOTAL_SITES];
    const angle = (i * 137.5) * Math.PI / 180; // golden angle
    const dist = 0.3 + (i / 60) * 1.5;
    return {
      x: seed.lng + Math.cos(angle) * dist,
      y: seed.lat + Math.sin(angle) * dist * 0.6,
      r: 2 + Math.random() * 3,
    };
  });

  const flashOp = growthPct > 0.98 ? Math.sin(frame * 0.5) * 0.3 + 0.3 : 0;

  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: FONT }}>
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        <defs><filter id="gg"><feGaussianBlur stdDeviation="4" /></filter></defs>

        {/* Existing sites */}
        {UPPER_MIDWEST_SITES.map((site, i) => {
          const p = siteProj(site);
          const r = 3 + Math.sqrt(site.capacityMW) * 1.2;
          return <circle key={site.name} cx={p.x} cy={p.y} r={r} fill={stateColor(site.state)} opacity={0.9} />;
        })}

        {/* Future sites */}
        {futureDots.map((fd, i) => {
          const p = regionProj(fd.y, fd.x);
          return <circle key={`f${i}`} cx={p.x} cy={p.y} r={fd.r} fill={C.teal} opacity={0.3} filter="url(#gg)" />;
        })}

        {/* Network connections */}
        {UPPER_MIDWEST_SITES.map((site, i) => {
          const p = siteProj(site);
          return NEIGHBORS[i].map(ni => {
            const np = siteProj(UPPER_MIDWEST_SITES[ni]);
            return <line key={`${i}-${ni}`} x1={p.x} y1={p.y} x2={np.x} y2={np.y} stroke={C.teal} strokeWidth={0.5} opacity={0.15} />;
          });
        })}
      </svg>

      {/* Flash at 1 GW */}
      <div style={{ position: 'absolute', inset: 0, background: C.teal, opacity: flashOp }} />

      {/* Counter */}
      <div style={{ position: 'absolute', top: 40, right: 80, textAlign: 'right', zIndex: 10 }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: C.teal, fontFamily: 'JetBrains Mono, monospace' }}>
          {Math.round(mw)} MW
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.orchid, fontFamily: 'JetBrains Mono, monospace' }}>
          ${Math.round(rev)}M
        </div>
      </div>
    </AbsoluteFill>
  );
}


// ─── Scene 5: The Network Revealed (0:48-1:00) ────────────────────────────────
function NetworkRevealed() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoOp = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' });
  const tagOp = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: 'clamp' });
  const pulse = Math.sin(frame * 0.06) * 0.15 + 0.85;

  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: FONT }}>
      {/* Steady-state network */}
      <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.4 }}>
        {UPPER_MIDWEST_SITES.map((site, i) => {
          const p = siteProj(site);
          return NEIGHBORS[i].map(ni => {
            const np = siteProj(UPPER_MIDWEST_SITES[ni]);
            return <line key={`${i}-${ni}`} x1={p.x} y1={p.y} x2={np.x} y2={np.y} stroke={C.teal} strokeWidth={0.5} opacity={0.3} />;
          });
        })}
        {UPPER_MIDWEST_SITES.map((site) => {
          const p = siteProj(site);
          const r = 3 + Math.sqrt(site.capacityMW) * 1;
          return <circle key={site.name} cx={p.x} cy={p.y} r={r * pulse} fill={stateColor(site.state)} opacity={0.7} />;
        })}
      </svg>

      {/* Logo and text */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <div style={{ opacity: logoOp }}>
          <NodiacLogo width={450} />
        </div>
        <div style={{ marginTop: 40, opacity: tagOp, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.white }}>Distributed Power Infrastructure for AI Compute</div>
          <div style={{ fontSize: 18, color: C.lilac, marginTop: 16, letterSpacing: 3 }}>NODIAC.AI</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Main Composition ──────────────────────────────────────────────────────────
export const NetworkEffect: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence from={0} durationInFrames={300}><Genesis /></Sequence>
      <Sequence from={300} durationInFrames={360}><Heartbeat /></Sequence>
      <Sequence from={660} durationInFrames={360}><ResilienceTest /></Sequence>
      <Sequence from={1020} durationInFrames={420}><Growth /></Sequence>
      <Sequence from={1440} durationInFrames={360}><NetworkRevealed /></Sequence>
    </AbsoluteFill>
  );
};

export const NETWORK_EFFECT_DURATION = 1800; // 60 seconds
