// Video 2: "42 Sites in 42 Seconds" — Rapid-Fire Site Flyover
// 60 seconds. Relentless geographic tour of every site.
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing,
} from 'remotion';
import { UPPER_MIDWEST_SITES, type Site } from '../data';
import { C, FONT, NodiacLogo, RegionalStates, siteProj, stateColor, Subtitles, type SubSegment } from '../shared';

const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
const TOTAL_CAP = Math.round(UPPER_MIDWEST_SITES.reduce((s, si) => s + si.capacityMW, 0));

// Geographic ordering: NW to SE sweep
const FLYOVER_ORDER: Site[] = (() => {
  const sorted = [...UPPER_MIDWEST_SITES].sort((a, b) => {
    // Sort by a diagonal from NW to SE (higher lat + lower lng first)
    const scoreA = a.lat * 2 - a.lng;
    const scoreB = b.lat * 2 - b.lng;
    return scoreB - scoreA;
  });
  return sorted;
})();

// ─── Scene 1: Title Card (0:00-0:03) ──────────────────────────────────────────
function TitleCard() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSc = spring({ frame, fps, config: { damping: 14 } });
  const n1 = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const n2 = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  const n3 = spring({ frame: frame - 30, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, justifyContent: 'center', alignItems: 'center' }}>
      {/* Grid background */}
      <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.05 }}>
        {Array.from({ length: 40 }, (_, i) => (
          <React.Fragment key={i}>
            <line x1={i * 48} y1={0} x2={i * 48} y2={1080} stroke={C.teal} strokeWidth={0.5} />
            <line x1={0} y1={i * 27} x2={1920} y2={i * 27} stroke={C.teal} strokeWidth={0.5} />
          </React.Fragment>
        ))}
      </svg>
      <div style={{ textAlign: 'center', transform: `scale(${logoSc})` }}>
        <NodiacLogo width={300} />
      </div>
      <div style={{ position: 'absolute', bottom: 300, display: 'flex', gap: 40 }}>
        <div style={{ opacity: n1, transform: `scale(${n1})`, textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: C.teal }}>42</div>
          <div style={{ fontSize: 16, color: C.lilac, letterSpacing: 2 }}>SITES</div>
        </div>
        <div style={{ opacity: n2, transform: `scale(${n2})`, textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: C.white }}>3</div>
          <div style={{ fontSize: 16, color: C.lilac, letterSpacing: 2 }}>STATES</div>
        </div>
        <div style={{ opacity: n3, transform: `scale(${n3})`, textAlign: 'center' }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: C.orchid }}>{TOTAL_CAP}</div>
          <div style={{ fontSize: 16, color: C.lilac, letterSpacing: 2 }}>MW</div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 2: Establishing Shot (0:03-0:06) ────────────────────────────────────
function EstablishingShot() {
  const frame = useCurrentFrame();
  const mapOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const dotsOp = interpolate(frame, [20, 40], [0, 0.15], { extrapolateRight: 'clamp' });
  const textOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', opacity: mapOp }}>
        <RegionalStates accentColor={C.teal} mutedColor={C.lilac} />
        {UPPER_MIDWEST_SITES.map(site => {
          const p = siteProj(site);
          return <circle key={site.name} cx={p.x} cy={p.y} r={3} fill={stateColor(site.state)} opacity={dotsOp} />;
        })}
      </svg>
      <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center', opacity: textOp }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: C.white }}>Let&apos;s visit every site.</div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 3: The Flyover (0:06-0:48) — 42 sites, ~1 sec each ─────────────────
function TheFlyover() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Each site gets ~30 frames (1 sec). Pilots get 45 frames.
  let siteFrames: { site: Site; startFrame: number; dur: number }[] = [];
  let cursor = 0;
  for (const site of FLYOVER_ORDER) {
    const dur = site.isPilot ? 45 : 30;
    siteFrames.push({ site, startFrame: cursor, dur });
    cursor += dur;
  }

  // Find current site
  const currentIdx = siteFrames.findIndex(sf => frame >= sf.startFrame && frame < sf.startFrame + sf.dur);
  const current = currentIdx >= 0 ? siteFrames[currentIdx] : null;

  // Running totals
  const completedSites = siteFrames.filter(sf => frame >= sf.startFrame + sf.dur).length;
  const runningMW = siteFrames
    .filter(sf => frame >= sf.startFrame)
    .reduce((s, sf) => s + sf.site.capacityMW, 0);

  // Viewport tracking: smoothly pan to current site
  const targetSite = current?.site ?? FLYOVER_ORDER[FLYOVER_ORDER.length - 1];
  const targetP = siteProj(targetSite);

  // Use frame-based smoothing for pan
  const panX = interpolate(frame, [0, cursor], [960, targetP.x], { extrapolateRight: 'clamp' });
  const panY = interpolate(frame, [0, cursor], [540, targetP.y], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      {/* Map layer (follows pan) */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${960 - panX}px, ${540 - panY}px) scale(1.5)`,
        transformOrigin: `${panX}px ${panY}px`,
      }}>
        <svg width="1920" height="1080">
          <RegionalStates accentColor={C.teal} mutedColor={C.lilac} />

          {/* All sites: visited = bright, unvisited = dim, current = pulsing */}
          {siteFrames.map((sf, i) => {
            const p = siteProj(sf.site);
            const visited = frame >= sf.startFrame + sf.dur;
            const isCurrent = i === currentIdx;
            const r = 4 + Math.sqrt(sf.site.capacityMW) * 1.2;
            const c = stateColor(sf.site.state);
            const pulse = isCurrent ? 1 + Math.sin(frame * 0.3) * 0.3 : 1;

            return (
              <g key={sf.site.name}>
                {/* Glow for current */}
                {isCurrent && (
                  <circle cx={p.x} cy={p.y} r={r * 4} fill={c} opacity={0.15 + Math.sin(frame * 0.2) * 0.05} />
                )}
                <circle
                  cx={p.x} cy={p.y}
                  r={r * (isCurrent ? pulse * 1.5 : 1)}
                  fill={c}
                  opacity={visited ? 0.8 : isCurrent ? 1 : 0.1}
                  stroke={sf.site.isPilot && isCurrent ? '#fbbf24' : 'none'}
                  strokeWidth={sf.site.isPilot && isCurrent ? 3 : 0}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Site info card */}
      {current && (() => {
        const localFrame = frame - current.startFrame;
        const cardOp = interpolate(localFrame, [5, 10, current.dur - 5, current.dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const s = current.site;
        return (
          <div style={{
            position: 'absolute', top: 80, right: 80,
            width: 400, padding: 24, borderRadius: 16,
            background: 'rgba(10,10,20,0.9)', border: `1px solid ${stateColor(s.state)}40`,
            opacity: cardOp,
          }}>
            {s.isPilot && (
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', letterSpacing: 2, marginBottom: 8 }}>PILOT SITE</div>
            )}
            <div style={{ fontSize: 28, fontWeight: 800, color: C.white }}>{s.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: stateColor(s.state) }}>{s.capacityMW} MW</span>
              <span style={{ fontSize: 16, color: C.lilac }}>{s.state} &bull; {s.utility}</span>
            </div>
          </div>
        );
      })()}

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 40, left: 80, right: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: 'JetBrains Mono, monospace' }}>
            SITE {Math.min(TOTAL_SITES, completedSites + (current ? 1 : 0))}/{TOTAL_SITES}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.teal, fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round(runningMW)} MW
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: '#222' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${C.teal}, ${C.orchid})`,
            width: `${(completedSites / TOTAL_SITES) * 100}%`,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 4: Zoom Out + Summary (0:48-0:54) ──────────────────────────────────
function ZoomOutSummary() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mapScale = interpolate(frame, [0, 30], [1.5, 1], { extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const statsOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const netOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${mapScale})`, transformOrigin: 'center' }}>
        <svg width="1920" height="1080">
          <RegionalStates accentColor={C.teal} mutedColor={C.lilac} />
          {/* Network lines */}
          {UPPER_MIDWEST_SITES.map((site, i) => {
            const p = siteProj(site);
            return UPPER_MIDWEST_SITES.filter((_, j) => j !== i)
              .map(n => ({ d: Math.hypot(n.lat - site.lat, n.lng - site.lng), pos: siteProj(n) }))
              .sort((a, b) => a.d - b.d).slice(0, 2)
              .map((n, ni) => <line key={`c${i}-${ni}`} x1={p.x} y1={p.y} x2={n.pos.x} y2={n.pos.y} stroke={C.teal} strokeWidth={0.5} opacity={netOp * 0.2} />);
          })}
          {/* All sites at full brightness */}
          {UPPER_MIDWEST_SITES.map(site => {
            const p = siteProj(site);
            const r = 4 + Math.sqrt(site.capacityMW) * 1.5;
            return <circle key={site.name} cx={p.x} cy={p.y} r={r} fill={stateColor(site.state)} opacity={0.9} />;
          })}
        </svg>
      </div>
      {/* Stats */}
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 80, opacity: statsOp }}>
        {[
          { n: '42', l: 'SITES', c: C.teal },
          { n: `${TOTAL_CAP}`, l: 'MW', c: C.orchid },
          { n: '3', l: 'STATES', c: C.white },
        ].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, fontWeight: 900, color: s.c }}>{s.n}</div>
            <div style={{ fontSize: 14, color: C.lilac, letterSpacing: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 5: CTA (0:54-1:00) ─────────────────────────────────────────────────
function FlyoverCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSc = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const tagOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${C.bg2} 0%, ${C.bg} 70%)`, fontFamily: FONT, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ transform: `scale(${logoSc})` }}>
        <NodiacLogo width={400} />
      </div>
      <div style={{ position: 'absolute', bottom: 240, left: 0, right: 0, textAlign: 'center', opacity: tagOp }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: C.white }}>
          The fastest path to AI compute in the Upper Midwest.
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center', opacity: tagOp }}>
        <div style={{ fontSize: 18, color: C.lilac, letterSpacing: 3 }}>NODIAC.AI</div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Voiceover Script ──────────────────────────────────────────────────────────
const SUBS: SubSegment[] = [
  { start: 0, end: 3, text: '' },
  { start: 3, end: 6, text: '42 sites. 3 states. 348 megawatts. Every single one.' },
  { start: 6, end: 9, text: "Let's visit every site in Nodiac's Upper Midwest Regional Hub." },
  { start: 9, end: 14, text: 'Each site collocated with existing renewable energy infrastructure.' },
  { start: 14, end: 18, text: 'Existing grid connections. Pre-permitted land. Ready for compute.' },
  { start: 18, end: 22, text: 'Minnesota — 23 sites across the state, from Ridgewind to Rochester.' },
  { start: 22, end: 26, text: "Each site sits behind the meter at a Greenbacker generation facility." },
  { start: 26, end: 30, text: 'Iowa — 4 high-capacity sites with major transmission access.' },
  { start: 30, end: 34, text: 'Elk, Hawkeye, Rippey — each site 37 to 50 megawatts.' },
  { start: 34, end: 38, text: 'Wisconsin — 15 sites across cooperative territory.' },
  { start: 38, end: 42, text: 'Pilot sites at Hay River and Walleye. First movers in a new model.' },
  { start: 42, end: 46, text: 'Dunn Energy Cooperative partnership. Modular pods on trailers.' },
  { start: 46, end: 50, text: 'Every site adds capacity. Every site strengthens the network.' },
  { start: 50, end: 54, text: '42 sites. 348 megawatts. The fastest path to distributed AI compute.' },
  { start: 54, end: 58, text: 'Nodiac. Distributed power infrastructure for AI compute.' },
  { start: 58, end: 61, text: '' },
];

// ─── Main Composition ──────────────────────────────────────────────────────────
export const SiteFlyover: React.FC<{ showSubtitles?: boolean }> = ({ showSubtitles = true }) => {
  // Calculate flyover duration dynamically
  let flyoverFrames = 0;
  for (const site of FLYOVER_ORDER) {
    flyoverFrames += site.isPilot ? 45 : 30;
  }
  // ~42*30 + 2*15(extra for pilots) = 1290 frames = ~43 seconds

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={0} durationInFrames={90}><TitleCard /></Sequence>
      <Sequence from={90} durationInFrames={90}><EstablishingShot /></Sequence>
      <Sequence from={180} durationInFrames={flyoverFrames}><TheFlyover /></Sequence>
      <Sequence from={180 + flyoverFrames} durationInFrames={180}><ZoomOutSummary /></Sequence>
      <Sequence from={180 + flyoverFrames + 180} durationInFrames={180}><FlyoverCTA /></Sequence>
      <Subtitles segments={SUBS} enabled={showSubtitles} />
    </AbsoluteFill>
  );
};

// Export total duration for Root.tsx
export const SITE_FLYOVER_DURATION = 180 + (() => {
  let f = 0;
  for (const site of FLYOVER_ORDER) f += site.isPilot ? 45 : 30;
  return f;
})() + 180 + 180;
