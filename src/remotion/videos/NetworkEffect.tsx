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
import { C, FONT, NodiacLogo, siteProj, stateColor, regionProj, Subtitles, Voiceover, type SubSegment } from '../shared';

const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
const TOTAL_CAP = Math.round(UPPER_MIDWEST_SITES.reduce((s, si) => s + si.capacityMW, 0));

const SORTED_SITES = [...UPPER_MIDWEST_SITES].sort((a, b) => b.capacityMW - a.capacityMW);

const NEIGHBORS = UPPER_MIDWEST_SITES.map((site) => {
  return UPPER_MIDWEST_SITES
    .map((n, i) => ({ i, d: Math.hypot(n.lat - site.lat, n.lng - site.lng) }))
    .filter(x => x.d > 0)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map(x => x.i);
});

// Background with ambient glow
function NetworkBG({ children, glowColor = C.teal, glowOpacity = 0.06 }: { children: React.ReactNode; glowColor?: string; glowOpacity?: number }) {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #0a0a18 0%, #050510 100%)`, fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 55% 40%, ${glowColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')} 0%, transparent 60%)` }} />
      {children}
    </AbsoluteFill>
  );
}

// ─── Scene 1: Genesis (0:00-0:10) — Network grows from nothing ─────────────────
function Genesis() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const growthProgress = interpolate(frame, [0, 250], [0, 1], { extrapolateRight: 'clamp' });
  const visibleCount = Math.min(TOTAL_SITES, Math.max(2, Math.floor(growthProgress * TOTAL_SITES)));

  const pilotIndices = UPPER_MIDWEST_SITES.map((s, i) => s.isPilot ? i : -1).filter(i => i >= 0);
  const nonPilots = UPPER_MIDWEST_SITES.map((_, i) => i).filter(i => !UPPER_MIDWEST_SITES[i].isPilot)
    .sort((a, b) => UPPER_MIDWEST_SITES[b].capacityMW - UPPER_MIDWEST_SITES[a].capacityMW);
  const growOrder = [...pilotIndices, ...nonPilots];
  const activeIndices = new Set(growOrder.slice(0, visibleCount));

  const centerX = 960;
  const centerY = 500;

  const counterOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const labelOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <NetworkBG glowOpacity={0.04}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        {/* Scene label */}
        <div style={{ position: 'absolute', top: 60, left: 80, opacity: labelOp }}>
          <div style={{ fontSize: 18, color: C.teal, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase' }}>Network Genesis</div>
        </div>

        <svg width="1920" height="1080" style={{ position: 'absolute' }}>
          <defs>
            <filter id="ng"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          {/* Connection lines */}
          {UPPER_MIDWEST_SITES.map((site, i) => {
            if (!activeIndices.has(i)) return null;
            const p = siteProj(site);
            const birthFrame = growOrder.indexOf(i) * (250 / TOTAL_SITES);
            const age = Math.max(0, frame - birthFrame);
            const posLerp = Math.min(1, age / 30);

            const sx = centerX + (p.x - centerX) * posLerp;
            const sy = centerY + (p.y - centerY) * posLerp;

            return NEIGHBORS[i]
              .filter(ni => activeIndices.has(ni))
              .map(ni => {
                const n = UPPER_MIDWEST_SITES[ni];
                const np = siteProj(n);
                const nBirth = growOrder.indexOf(ni) * (250 / TOTAL_SITES);
                const nAge = Math.max(0, frame - nBirth);
                const nLerp = Math.min(1, nAge / 30);
                const nx = centerX + (np.x - centerX) * nLerp;
                const ny = centerY + (np.y - centerY) * nLerp;
                const lineOp = Math.min(posLerp, nLerp) * 0.25;

                return <line key={`${i}-${ni}`} x1={sx} y1={sy} x2={nx} y2={ny} stroke={C.teal} strokeWidth={1.5} opacity={lineOp} />;
              });
          })}

          {/* Dots — bigger */}
          {UPPER_MIDWEST_SITES.map((site, i) => {
            if (!activeIndices.has(i)) return null;
            const p = siteProj(site);
            const birthFrame = growOrder.indexOf(i) * (250 / TOTAL_SITES);
            const age = Math.max(0, frame - birthFrame);
            const posLerp = Math.min(1, age / 30);
            const scaleLerp = spring({ frame: Math.max(0, frame - birthFrame), fps, config: { damping: 10, mass: 0.5 } });

            const sx = centerX + (p.x - centerX) * posLerp;
            const sy = centerY + (p.y - centerY) * posLerp;
            const r = (4 + Math.sqrt(site.capacityMW) * 1.5) * scaleLerp;
            const c = stateColor(site.state);

            return (
              <g key={site.name}>
                <circle cx={sx} cy={sy} r={r * 3} fill={c} opacity={0.12 * scaleLerp} filter="url(#ng)" />
                <circle cx={sx} cy={sy} r={r} fill={c} opacity={0.9 * scaleLerp} />
              </g>
            );
          })}
        </svg>

        {/* Counter — always visible after early frames */}
        <div style={{ position: 'absolute', top: 50, right: 80, textAlign: 'right', opacity: counterOp }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: C.teal }}>{visibleCount} <span style={{ fontSize: 22, color: C.lilac }}>NODES</span></div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.white }}>
            {Math.round(growOrder.slice(0, visibleCount).reduce((s, i) => s + UPPER_MIDWEST_SITES[i].capacityMW, 0))} <span style={{ fontSize: 16, color: C.lilac }}>MW</span>
          </div>
        </div>
      </AbsoluteFill>
    </NetworkBG>
  );
}

// ─── Scene 2: The Heartbeat (0:10-0:22) — Pulsing network ─────────────────────
function Heartbeat() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const pulse = Math.sin(frame * 0.08) * 0.5 + 0.5;
  const rippleRadius = (frame % 90) / 90;

  const text1Op = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const text1Fo = interpolate(frame, [120, 140], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const text2Op = interpolate(frame, [160, 180], [0, 1], { extrapolateRight: 'clamp' });
  const text2Fo = interpolate(frame, [280, 300], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <NetworkBG glowColor={C.teal} glowOpacity={0.05}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <svg width="1920" height="1080" style={{ position: 'absolute' }}>
          <defs><filter id="hg"><feGaussianBlur stdDeviation="8" /></filter></defs>

          {/* Ripple rings — multiple */}
          {[0, 0.33, 0.66].map((offset, ri) => {
            const r = ((frame + offset * 90) % 90) / 90;
            return <circle key={ri} cx={960} cy={500} r={r * 700} fill="none" stroke={C.teal} strokeWidth={1.5} opacity={(1 - r) * 0.15} />;
          })}

          {/* Connection lines with animated dashes */}
          {UPPER_MIDWEST_SITES.map((site, i) => {
            const p = siteProj(site);
            return NEIGHBORS[i].map(ni => {
              const n = UPPER_MIDWEST_SITES[ni];
              const np = siteProj(n);
              const dashOffset = -frame * 2;
              return (
                <line key={`${i}-${ni}`} x1={p.x} y1={p.y} x2={np.x} y2={np.y}
                  stroke={C.teal} strokeWidth={1.5} opacity={0.15 + pulse * 0.1}
                  strokeDasharray="6 10" strokeDashoffset={dashOffset}
                />
              );
            });
          })}

          {/* Dots — bigger and more visible */}
          {UPPER_MIDWEST_SITES.map((site, i) => {
            const p = siteProj(site);
            const r = 4 + Math.sqrt(site.capacityMW) * 1.5;
            const c = stateColor(site.state);
            const dist = Math.hypot(p.x - 960, p.y - 500);
            const rippleHit = Math.abs(dist - rippleRadius * 700) < 50;
            const brightness = rippleHit ? 1 : 0.5 + pulse * 0.3;

            return (
              <g key={site.name}>
                <circle cx={p.x} cy={p.y} r={r * 2.5} fill={c} opacity={brightness * 0.15} filter="url(#hg)" />
                <circle cx={p.x} cy={p.y} r={r} fill={c} opacity={brightness} />
              </g>
            );
          })}
        </svg>

        {/* Text overlays — bigger, more prominent */}
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: C.teal, opacity: text1Op * text1Fo, textShadow: `0 0 40px ${C.teal}30` }}>
            {TOTAL_CAP} MW of distributed inference capacity
          </div>
        </div>
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: C.white, opacity: text2Op * text2Fo }}>
            99.999% UPTIME
          </div>
          <div style={{ fontSize: 22, color: C.lilac, marginTop: 8, opacity: text2Op * text2Fo }}>
            No backup generators. Distributed N+1 redundancy across Greenbacker-owned sites.
          </div>
        </div>
      </AbsoluteFill>
    </NetworkBG>
  );
}

// ─── Scene 3: Resilience Test (0:22-0:34) — Nodes fail and heal ────────────────
function ResilienceTest() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const fail1 = frame >= 30;
  const heal1 = frame >= 150;
  const fail1Nodes = [5, 15, 25];

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
    <NetworkBG glowColor={fail1 && !heal1 ? '#ff3333' : C.teal} glowOpacity={0.04}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        <svg width="1920" height="1080" style={{ position: 'absolute' }}>
          <defs><filter id="rg"><feGaussianBlur stdDeviation="8" /></filter></defs>

          {/* Connections — rerouting */}
          {UPPER_MIDWEST_SITES.map((site, i) => {
            if (allFailed.has(i)) return null;
            const p = siteProj(site);
            return NEIGHBORS[i]
              .filter(ni => !allFailed.has(ni))
              .map(ni => {
                const n = UPPER_MIDWEST_SITES[ni];
                const np = siteProj(n);
                return <line key={`${i}-${ni}`} x1={p.x} y1={p.y} x2={np.x} y2={np.y} stroke={C.teal} strokeWidth={1.5} opacity={0.25} />;
              });
          })}

          {/* Dots */}
          {UPPER_MIDWEST_SITES.map((site, i) => {
            const p = siteProj(site);
            const r = 4 + Math.sqrt(site.capacityMW) * 1.5;
            const isFailed = allFailed.has(i);

            return (
              <g key={site.name}>
                {isFailed && (
                  <>
                    <circle cx={p.x} cy={p.y} r={r * 4} fill="none" stroke="#ff3333" strokeWidth={2} opacity={0.4 + Math.sin(frame * 0.3) * 0.2} />
                    <circle cx={p.x} cy={p.y} r={r * 2} fill="#ff3333" opacity={0.1} filter="url(#rg)" />
                  </>
                )}
                <circle cx={p.x} cy={p.y} r={r} fill={isFailed ? '#ff3333' : stateColor(site.state)} opacity={isFailed ? 0.3 : 0.9} />
              </g>
            );
          })}
        </svg>

        {/* Status text — bigger */}
        <div style={{ position: 'absolute', top: 50, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#ff6666', opacity: text1Op }}>
            3 NODES OFFLINE — LOAD REDISTRIBUTED
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#ff6666', opacity: text2Op }}>
            6 MORE NODES DOWN — NETWORK ADAPTS
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: C.teal, opacity: text3Op, textShadow: `0 0 40px ${C.teal}40` }}>
            THE NETWORK HEALS
          </div>
          <div style={{ fontSize: 22, color: C.lilac, opacity: text3Op, marginTop: 8 }}>
            Zero backup generators. Distributed N+1 redundancy.
          </div>
        </div>
      </AbsoluteFill>
    </NetworkBG>
  );
}

// ─── Scene 4: Growth (0:34-0:48) — Network expands ────────────────────────────
function Growth() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const growthPct = interpolate(frame, [0, 350], [0, 1], { extrapolateRight: 'clamp' });
  const mw = interpolate(growthPct, [0, 0.1, 0.4, 0.7, 1], [50, 100, 200, 500, 1000]);
  const rev = mw * 0.78;

  const futureCount = Math.floor(growthPct * 60);
  const futureDots = Array.from({ length: futureCount }, (_, i) => {
    const seed = UPPER_MIDWEST_SITES[i % TOTAL_SITES];
    const angle = (i * 137.5) * Math.PI / 180;
    const dist = 0.3 + (i / 60) * 1.5;
    return {
      x: seed.lng + Math.cos(angle) * dist,
      y: seed.lat + Math.sin(angle) * dist * 0.6,
      r: 3 + Math.random() * 4,
    };
  });

  const flashOp = growthPct > 0.98 ? Math.sin(frame * 0.5) * 0.15 + 0.15 : 0;

  return (
    <NetworkBG glowOpacity={0.05}>
      <AbsoluteFill style={{ opacity: fadeIn }}>
        {/* Label */}
        <div style={{ position: 'absolute', top: 60, left: 80 }}>
          <div style={{ fontSize: 18, color: C.teal, fontWeight: 700, letterSpacing: 5, textTransform: 'uppercase' }}>Scaling Roadmap</div>
        </div>

        <svg width="1920" height="1080" style={{ position: 'absolute' }}>
          <defs><filter id="gg"><feGaussianBlur stdDeviation="6" /></filter></defs>

          {/* Existing sites */}
          {UPPER_MIDWEST_SITES.map((site) => {
            const p = siteProj(site);
            const r = 4 + Math.sqrt(site.capacityMW) * 1.5;
            return (
              <React.Fragment key={site.name}>
                <circle cx={p.x} cy={p.y} r={r * 2} fill={stateColor(site.state)} opacity={0.15} />
                <circle cx={p.x} cy={p.y} r={r} fill={stateColor(site.state)} opacity={0.9} />
              </React.Fragment>
            );
          })}

          {/* Future sites — more visible */}
          {futureDots.map((fd, i) => {
            const p = regionProj(fd.y, fd.x);
            return (
              <React.Fragment key={`f${i}`}>
                <circle cx={p.x} cy={p.y} r={fd.r * 2} fill={C.teal} opacity={0.08} filter="url(#gg)" />
                <circle cx={p.x} cy={p.y} r={fd.r} fill={C.teal} opacity={0.4} />
              </React.Fragment>
            );
          })}

          {/* Network connections */}
          {UPPER_MIDWEST_SITES.map((site, i) => {
            const p = siteProj(site);
            return NEIGHBORS[i].map(ni => {
              const np = siteProj(UPPER_MIDWEST_SITES[ni]);
              return <line key={`${i}-${ni}`} x1={p.x} y1={p.y} x2={np.x} y2={np.y} stroke={C.teal} strokeWidth={1} opacity={0.2} />;
            });
          })}
        </svg>

        {/* Flash at 1 GW */}
        <div style={{ position: 'absolute', inset: 0, background: C.teal, opacity: flashOp }} />

        {/* Counter — bigger */}
        <div style={{ position: 'absolute', top: 50, right: 80, textAlign: 'right', zIndex: 10 }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: C.teal, fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round(mw)} MW
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: C.orchid, fontFamily: 'JetBrains Mono, monospace' }}>
            ${Math.round(rev)}M ARR
          </div>
        </div>

        {/* Milestone markers */}
        {growthPct > 0.1 && (
          <div style={{ position: 'absolute', bottom: 100, left: 80, display: 'flex', gap: 24 }}>
            <div style={{ padding: '10px 20px', borderRadius: 10, background: `${C.teal}15`, border: `1px solid ${C.teal}30` }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.teal }}>Q4 2026: 50 MW</span>
            </div>
            {growthPct > 0.4 && (
              <div style={{ padding: '10px 20px', borderRadius: 10, background: `${C.orchid}15`, border: `1px solid ${C.orchid}30` }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: C.orchid }}>2027: 200 MW</span>
              </div>
            )}
            {growthPct > 0.7 && (
              <div style={{ padding: '10px 20px', borderRadius: 10, background: `${C.teal}15`, border: `1px solid ${C.teal}30` }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: C.teal }}>2028+: 1 GW+</span>
              </div>
            )}
          </div>
        )}
      </AbsoluteFill>
    </NetworkBG>
  );
}


// ─── Scene 5: The Network Revealed (0:48-1:00) ────────────────────────────────
function NetworkRevealed() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const logoOp = interpolate(frame, [40, 70], [0, 1], { extrapolateRight: 'clamp' });
  const logoScale = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 12, mass: 0.8 } });
  const tagOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' });
  const pulse = Math.sin(frame * 0.06) * 0.15 + 0.85;
  const fadeOut = interpolate(frame, [320, 360], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <NetworkBG glowOpacity={0.06}>
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
        {/* Steady-state network — more visible */}
        <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.3 }}>
          {UPPER_MIDWEST_SITES.map((site, i) => {
            const p = siteProj(site);
            return NEIGHBORS[i].map(ni => {
              const np = siteProj(UPPER_MIDWEST_SITES[ni]);
              return <line key={`${i}-${ni}`} x1={p.x} y1={p.y} x2={np.x} y2={np.y} stroke={C.teal} strokeWidth={1} opacity={0.3} />;
            });
          })}
          {UPPER_MIDWEST_SITES.map((site) => {
            const p = siteProj(site);
            const r = 4 + Math.sqrt(site.capacityMW) * 1.3;
            return (
              <React.Fragment key={site.name}>
                <circle cx={p.x} cy={p.y} r={r * 2} fill={stateColor(site.state)} opacity={0.15} />
                <circle cx={p.x} cy={p.y} r={r * pulse} fill={stateColor(site.state)} opacity={0.8} />
              </React.Fragment>
            );
          })}
        </svg>

        {/* Logo and text */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
          <div style={{ opacity: logoOp, transform: `scale(${logoScale})` }}>
            <NodiacLogo width={500} />
          </div>
          <div style={{ marginTop: 40, opacity: tagOp, textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 600, color: C.white }}>Speed-to-power for AI inference</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: C.teal, marginTop: 8 }}>starting in the Upper Midwest.</div>
            <div style={{ fontSize: 22, color: C.lilac, marginTop: 16, letterSpacing: 4 }}>NODIAC.AI</div>
          </div>
        </div>
      </AbsoluteFill>
    </NetworkBG>
  );
}

// ─── Voiceover Script ──────────────────────────────────────────────────────────
const SUBS: SubSegment[] = [
  { start: 0, end: 3, text: '' },
  { start: 3, end: 7, text: 'It starts with two nodes. Hay River and Walleye. Greenbacker-owned sites with Dunn Energy Cooperative.' },
  { start: 7, end: 10, text: 'Then the network grows. Site by site. Node by node.' },
  { start: 10, end: 14, text: '42 Greenbacker-owned nodes across three states. A living network of distributed inference compute.' },
  { start: 14, end: 18, text: '348 megawatts of capacity. Inference is how AI labs make money. It needs compute close to users.' },
  { start: 18, end: 22, text: 'Every node connected. Every node contributing. Speed-to-power in months, not years.' },
  { start: 22, end: 26, text: '99.999 percent uptime. Not through backup generators.' },
  { start: 26, end: 30, text: 'Through the network itself. Distributed N-plus-1 redundancy. Nodes fail. The network heals.' },
  { start: 30, end: 34, text: 'Validated by 200,000 Monte Carlo simulations.' },
  { start: 34, end: 38, text: 'The network does not just survive. It grows. Less than 14 months to payback per megawatt.' },
  { start: 38, end: 42, text: '50 megawatts by Q4 2026. 200 megawatts by 2027.' },
  { start: 42, end: 46, text: 'Over a gigawatt by 2028. 780 million dollars in annual revenue.' },
  { start: 46, end: 50, text: '200 megawatts online 6 months sooner equals 1.2 billion in hyperscaler revenue.' },
  { start: 50, end: 54, text: 'Speed-to-power for AI inference. Starting in the Upper Midwest.' },
  { start: 54, end: 58, text: 'Nodiac.' },
  { start: 58, end: 60, text: '' },
];

// ─── Main Composition ──────────────────────────────────────────────────────────
export const NetworkEffect: React.FC<{ showSubtitles?: boolean; showVoiceover?: boolean }> = ({ showSubtitles = true, showVoiceover = true }) => {
  return (
    <AbsoluteFill style={{ background: '#050510' }}>
      <Sequence from={0} durationInFrames={300}><Genesis /></Sequence>
      <Sequence from={300} durationInFrames={360}><Heartbeat /></Sequence>
      <Sequence from={660} durationInFrames={360}><ResilienceTest /></Sequence>
      <Sequence from={1020} durationInFrames={420}><Growth /></Sequence>
      <Sequence from={1440} durationInFrames={360}><NetworkRevealed /></Sequence>
      <Subtitles segments={SUBS} enabled={showSubtitles} />
      <Voiceover src="audio/network-effect.mp3" enabled={showVoiceover} />
    </AbsoluteFill>
  );
};

export const NETWORK_EFFECT_DURATION = 1800; // 60 seconds
