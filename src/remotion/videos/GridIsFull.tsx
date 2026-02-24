// Video 1: "The Grid is Full" — Cinematic Problem/Solution Narrative
// 90 seconds. Slow-burn tension building, dramatic pivot, elegant resolution.
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
import { UPPER_MIDWEST_SITES, MN_SITES, IA_SITES, WI_SITES } from '../data';
import {
  C, FONT, USMap, RegionalStates, NodiacLogo,
  usProj, regionProj, siteProj, stateColor, ZOOM_TO_MW,
} from '../shared';

const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
const TOTAL_CAP = Math.round(UPPER_MIDWEST_SITES.reduce((s, si) => s + si.capacityMW, 0));

// ─── Scene 1: The Gap (0:00-0:04) — Stark white text on black ─────────────────
function TheGap() {
  const frame = useCurrentFrame();
  // Type on effect: reveal characters one at a time
  const line1 = '100 gigawatts of AI compute demand by 2030.';
  const line2 = '0 gigawatts of new power capacity available today.';
  const chars1 = Math.min(line1.length, Math.floor(frame * 1.2));
  const chars2 = Math.min(line2.length, Math.max(0, Math.floor((frame - 50) * 1.2)));
  const cursor = frame % 30 < 15;

  return (
    <AbsoluteFill style={{ background: '#000000', justifyContent: 'center', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ textAlign: 'center', maxWidth: 1400 }}>
        <div style={{ fontSize: 38, color: C.white, letterSpacing: 1, lineHeight: 1.6 }}>
          {line1.slice(0, chars1)}
          {chars1 < line1.length && cursor ? '▊' : ''}
        </div>
        <div style={{ fontSize: 38, color: '#ff4444', letterSpacing: 1, lineHeight: 1.6, marginTop: 20 }}>
          {line2.slice(0, chars2)}
          {chars2 > 0 && chars2 < line2.length && cursor ? '▊' : ''}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 2: The Bottleneck (0:04-0:16) — Pipeline congestion ─────────────────
function Bottleneck() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pipeline fill
  const demandPct = interpolate(frame, [0, 300], [0, 1], { extrapolateRight: 'clamp' });
  const supplyPct = interpolate(frame, [0, 300], [0, 0.04], { extrapolateRight: 'clamp' });

  // Demand counter
  const demandGW = Math.round(demandPct * 100);
  const supplyGW = Math.round(supplyPct * 100);

  // Stats cards
  const card1Op = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: 'clamp' });
  const card2Op = interpolate(frame, [150, 170], [0, 1], { extrapolateRight: 'clamp' });
  const card3Op = interpolate(frame, [210, 230], [0, 1], { extrapolateRight: 'clamp' });

  // Background tension
  const redGlow = interpolate(frame, [0, 300], [0, 0.3], { extrapolateRight: 'clamp' });

  // Particles accumulating at bottleneck
  const particles = Array.from({ length: 30 }, (_, i) => {
    const progress = interpolate(frame, [i * 8, i * 8 + 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const stuck = progress > 0.45;
    const x = stuck
      ? 960 + (Math.sin(i * 1.7 + frame * 0.05) * 30)
      : interpolate(progress, [0, 0.45], [100, 960]);
    const y = 400 + Math.sin(i * 2.3 + frame * 0.03) * (stuck ? 60 : 20);
    return { x, y, o: interpolate(progress, [0, 0.1, 0.9, 1], [0, 0.8, 0.8, 0.3]) };
  });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1a0000 0%, #000000 100%)`, fontFamily: FONT }}>
      {/* Tension glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, rgba(255,0,0,${redGlow}) 0%, transparent 70%)` }} />

      {/* Pipeline */}
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        {/* Pipeline track */}
        <rect x={100} y={380} width={1720} height={40} rx={20} fill="#111" stroke="#333" strokeWidth={1} />

        {/* Demand fill (left to center) */}
        <rect x={100} y={382} width={Math.min(830, demandPct * 1720)} height={36} rx={18} fill={C.teal} opacity={0.6} />

        {/* Bottleneck barrier */}
        <rect x={920} y={360} width={8} height={80} rx={4} fill="#ff4444" opacity={0.8} />

        {/* Supply trickle (right of bottleneck) */}
        <rect x={940} y={382} width={supplyPct * 1720} height={36} rx={18} fill="#22aa22" opacity={0.4} />

        {/* Particles */}
        {particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={C.teal} opacity={p.o} />
        ))}

        {/* Labels */}
        <text x={200} y={360} fill={C.white} fontSize={18} fontWeight={700} fontFamily={FONT}>DEMAND</text>
        <text x={200} y={460} fill={C.teal} fontSize={28} fontWeight={800} fontFamily={FONT}>{demandGW} GW</text>
        <text x={1600} y={360} fill={'#22aa22'} fontSize={18} fontWeight={700} fontFamily={FONT} textAnchor="end">SUPPLY</text>
        <text x={1600} y={460} fill={'#22aa22'} fontSize={28} fontWeight={800} fontFamily={FONT} textAnchor="end">{supplyGW} GW</text>
      </svg>

      {/* Stats cards */}
      <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60 }}>
        {[
          { text: '5-year interconnection queues', op: card1Op },
          { text: '$98B in delayed projects', op: card2Op },
          { text: 'Every hyperscaler constrained', op: card3Op },
        ].map((c, i) => (
          <div key={i} style={{ opacity: c.op, transform: `translateY(${(1 - c.op) * 20}px)`, padding: '16px 32px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 18, color: C.white, fontWeight: 600 }}>{c.text}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 3: The Clock (0:16-0:24) — Years ticking away ───────────────────────
function TheClock() {
  const frame = useCurrentFrame();
  const yearProgress = interpolate(frame, [0, 150], [2025, 2032], { extrapolateRight: 'clamp' });
  const year = Math.floor(yearProgress);
  const handAngle = (yearProgress - 2025) * (360 / 7);
  const shatter = interpolate(frame, [160, 190], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const questionOp = interpolate(frame, [190, 210], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Shatter particles
  const shards = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const d = shatter * 400;
    return {
      x: Math.cos(a) * d,
      y: Math.sin(a) * d,
      r: (i % 3) * 10 + 5,
      o: 1 - shatter,
    };
  });

  return (
    <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center', fontFamily: FONT }}>
      {/* Clock */}
      <div style={{ opacity: 1 - shatter }}>
        <svg width={300} height={300} style={{ overflow: 'visible' }}>
          <circle cx={150} cy={150} r={130} fill="none" stroke="#333" strokeWidth={3} />
          <circle cx={150} cy={150} r={4} fill={C.white} />
          {/* Hand */}
          <line
            x1={150} y1={150}
            x2={150 + Math.cos((handAngle - 90) * Math.PI / 180) * 100}
            y2={150 + Math.sin((handAngle - 90) * Math.PI / 180) * 100}
            stroke={C.white} strokeWidth={3} strokeLinecap="round"
          />
          {/* Year markers */}
          {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032].map((y, i) => {
            const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
            return (
              <text key={y} x={150 + Math.cos(a) * 110} y={155 + Math.sin(a) * 110}
                fill={y <= year ? C.white : '#444'} fontSize={14} fontWeight={600}
                textAnchor="middle" fontFamily={FONT}>{y}</text>
            );
          })}
        </svg>
      </div>

      {/* Year display */}
      <div style={{ position: 'absolute', bottom: 340, fontSize: 24, color: '#888', opacity: 1 - shatter }}>
        Traditional data center timeline: 5-7 years to power
      </div>

      {/* Shatter particles */}
      {shards.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)`,
          width: s.r, height: s.r, background: '#333', opacity: s.o,
          transform: `rotate(${i * 30}deg)`,
        }} />
      ))}

      {/* Question */}
      <div style={{ position: 'absolute', opacity: questionOp, fontSize: 56, fontWeight: 800, color: C.white }}>
        What if you didn&apos;t wait?
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 4: The Pivot (0:24-0:30) — Dramatic teal sweep ─────────────────────
function ThePivot() {
  const frame = useCurrentFrame();
  const textOp = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: 'clamp' });
  const sweepProgress = interpolate(frame, [50, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const logoOp = interpolate(frame, [100, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center', fontFamily: FONT }}>
      {/* Teal sweep overlay */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${sweepProgress * 100}%`,
        background: `linear-gradient(135deg, ${C.multiply} 0%, ${C.eggplant} 100%)`,
      }} />

      {/* Teal text */}
      <div style={{ position: 'absolute', opacity: textOp, zIndex: 10 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: C.teal, textAlign: 'center', textShadow: `0 0 40px ${C.teal}40` }}>
          Go to where the power already is.
        </div>
      </div>

      {/* Logo */}
      <div style={{ position: 'absolute', opacity: logoOp, zIndex: 10 }}>
        <NodiacLogo width={350} />
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 5: Map Unfolds (0:30-0:50) — Zoom into Upper Midwest ───────────────
function MapUnfolds() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom from US to regional view
  const zoomScale = interpolate(frame, [0, 180], [1, 2.8], { extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const zoomTx = interpolate(frame, [0, 180], [0, ZOOM_TO_MW.tx], { extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const zoomTy = interpolate(frame, [0, 180], [0, ZOOM_TO_MW.ty], { extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

  // Sites appear progressively after zoom
  const sorted = [...UPPER_MIDWEST_SITES].sort((a, b) => b.capacityMW - a.capacityMW); // largest first
  const visCount = Math.min(TOTAL_SITES, Math.max(0, Math.floor((frame - 180) / 6)));

  // Running counter
  const visCap = sorted.slice(0, visCount).reduce((s, si) => s + si.capacityMW, 0);

  return (
    <AbsoluteFill style={{ background: C.multiply, fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoomScale}) translate(${zoomTx}px, ${zoomTy}px)`, transformOrigin: 'center' }}>
        <svg width="1920" height="1080" style={{ position: 'absolute' }}>
          <USMap projFn={usProj} accentColor={C.teal} mutedColor={C.orchid} />
        </svg>
      </div>

      {/* After zoom: show site dots on regional projection */}
      {frame > 180 && (
        <svg width="1920" height="1080" style={{ position: 'absolute', zIndex: 5 }}>
          <defs><filter id="gf"><feGaussianBlur stdDeviation="6" /></filter></defs>
          {sorted.map((site, i) => {
            if (i >= visCount) return null;
            const p = siteProj(site);
            const ap = spring({ frame: frame - (180 + i * 6), fps, config: { damping: 10, mass: 0.5 } });
            const r = 4 + Math.sqrt(site.capacityMW) * 1.5;
            const c = stateColor(site.state);
            return (
              <g key={site.name}>
                <circle cx={p.x} cy={p.y} r={r * 3 * ap} fill={c} opacity={0.2 * ap} filter="url(#gf)" />
                <circle cx={p.x} cy={p.y} r={r * ap} fill={c} opacity={ap} />
              </g>
            );
          })}
          {/* Network lines */}
          {sorted.slice(0, visCount).map((site, i) => {
            const p = siteProj(site);
            return sorted.slice(0, visCount).filter((_, j) => j !== i)
              .map(n => ({ d: Math.hypot(n.lat - site.lat, n.lng - site.lng), pos: siteProj(n) }))
              .sort((a, b) => a.d - b.d).slice(0, 2)
              .map((n, ni) => <line key={`c${i}-${ni}`} x1={p.x} y1={p.y} x2={n.pos.x} y2={n.pos.y} stroke={C.teal} strokeWidth={0.5} opacity={0.15} />);
          })}
        </svg>
      )}

      {/* Running counter */}
      {frame > 180 && (
        <div style={{ position: 'absolute', top: 40, right: 80, textAlign: 'right', zIndex: 10 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: C.teal }}>{visCount} <span style={{ fontSize: 20, color: C.lilac }}>sites</span></div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.white }}>{Math.round(visCap)} <span style={{ fontSize: 18, color: C.lilac }}>MW</span></div>
        </div>
      )}
    </AbsoluteFill>
  );
}

// ─── Scene 6: Pilot Close-Up (0:50-1:02) ──────────────────────────────────────
function PilotCloseUp() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c1 = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const c2 = spring({ frame: frame - 25, fps, config: { damping: 12 } });
  const podOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  const pilots = [
    { name: 'Hay River', loc: 'Boyceville, WI', mw: '1.5 MW', exp: '10 MW', color: C.teal },
    { name: 'Walleye', loc: 'Colfax, WI', mw: '1.5 MW', exp: '15 MW', color: C.orchid },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.multiply} 0%, #0a0520 100%)`, fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: C.teal, fontWeight: 600, letterSpacing: 4, textTransform: 'uppercase' }}>Pilot Sites In Development</div>
      </div>
      <div style={{ position: 'absolute', top: 180, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60 }}>
        {pilots.map((p, i) => (
          <div key={p.name} style={{
            width: 480, padding: 40, borderRadius: 20,
            background: `${C.eggplant}40`, border: `1px solid ${p.color}30`,
            opacity: i === 0 ? c1 : c2,
            transform: `translateY(${(1 - (i === 0 ? c1 : c2)) * 30}px)`,
          }}>
            <div style={{ fontSize: 14, color: p.color, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>{i === 0 ? 'Anchor Site' : 'Pilot Site'}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.white, marginTop: 8 }}>{p.name}</div>
            <div style={{ fontSize: 16, color: C.lilac, marginTop: 4 }}>{p.loc} &bull; Dunn Energy Coop</div>
            <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
              <div><div style={{ fontSize: 28, fontWeight: 800, color: C.teal }}>{p.mw}</div><div style={{ fontSize: 12, color: C.lilac }}>Confirmed</div></div>
              <div><div style={{ fontSize: 28, fontWeight: 800, color: C.orchid }}>{p.exp}</div><div style={{ fontSize: 12, color: C.lilac }}>Expansion</div></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center', opacity: podOp }}>
        <div style={{ fontSize: 20, color: C.white, fontWeight: 600 }}>Modular. Mobile. Months to deploy — not years.</div>
        <div style={{ fontSize: 15, color: C.lilac, marginTop: 8 }}>Armada compute pods on trailers. No concrete. No permitting.</div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 7: Business Case (1:02-1:18) — Scaling bars ─────────────────────────
function BusinessCase() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const milestones = [
    { y: 'Q4 2026', mw: '50 MW', rev: '$39M ARR', pct: 0.15, color: C.teal, delay: 10 },
    { y: '2027', mw: '200 MW', rev: '$156M ARR', pct: 0.5, color: C.orchid, delay: 30 },
    { y: '2028+', mw: '1 GW+', rev: '$780M+ ARR', pct: 1, color: C.teal, delay: 50 },
  ];

  const diffOp = interpolate(frame, [200, 220], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: 80, left: 120 }}>
        <div style={{ fontSize: 16, color: C.teal, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>Scaling Roadmap</div>
      </div>
      <div style={{ position: 'absolute', top: 160, left: 120, right: 120 }}>
        {milestones.map((m, i) => {
          const barW = spring({ frame: frame - m.delay, fps, config: { damping: 15, mass: 0.8 } });
          return (
            <div key={m.y} style={{ marginBottom: 50 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: C.white }}>{m.y}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: m.color }}>{m.mw}</span>
              </div>
              <div style={{ height: 40, borderRadius: 8, background: '#111', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${m.pct * 100 * barW}%`, borderRadius: 8, background: `linear-gradient(90deg, ${m.color}, ${m.color}80)` }} />
              </div>
              <div style={{ textAlign: 'right', marginTop: 4, fontSize: 16, color: C.lilac }}>{m.rev}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 80, left: 120, right: 120, display: 'flex', gap: 40, opacity: diffOp }}>
        {[
          '$780K/MW/year revenue',
          '99.999% distributed uptime',
          'Greenbacker site access',
        ].map(t => (
          <div key={t} style={{ flex: 1, padding: '16px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 15, color: C.white }}>{t}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 8: Close (1:18-1:30) ────────────────────────────────────────────────
function TheClose() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSc = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const tagOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const urlOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [300, 360], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${C.bg2} 0%, ${C.bg} 70%)`, fontFamily: FONT, justifyContent: 'center', alignItems: 'center', opacity: fadeOut }}>
      {/* Background network pulse */}
      {UPPER_MIDWEST_SITES.slice(0, 20).map((site, i) => {
        const p = siteProj(site);
        const pulse = Math.sin(frame * 0.05 + i) * 0.3 + 0.3;
        return <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 4, height: 4, borderRadius: '50%', background: C.teal, opacity: pulse * 0.3 }} />;
      })}

      <div style={{ textAlign: 'center', transform: `scale(${logoSc})`, zIndex: 10 }}>
        <NodiacLogo width={450} />
      </div>
      <div style={{ position: 'absolute', bottom: 260, left: 0, right: 0, textAlign: 'center', opacity: tagOp, zIndex: 10 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: C.white }}>
          The fastest path to distributed AI compute
          <br />
          <span style={{ color: C.teal }}>in the Upper Midwest.</span>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center', opacity: urlOp, zIndex: 10 }}>
        <div style={{ fontSize: 20, color: C.lilac, letterSpacing: 3 }}>NODIAC.AI</div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Subtitle Overlay ──────────────────────────────────────────────────────────
const SUBS = [
  { start: 0, end: 4, text: '' },
  { start: 4, end: 10, text: "The AI industry needs 100 gigawatts of power. The grid can deliver a fraction of that." },
  { start: 10, end: 16, text: "Five-year interconnection queues. 98 billion dollars in delayed projects. The traditional path is broken." },
  { start: 16, end: 24, text: "Building a new data center takes five to seven years to energize. AI cannot wait that long." },
  { start: 24, end: 30, text: "Unless you go to where the power already is." },
  { start: 30, end: 40, text: "Across the Upper Midwest, hundreds of renewable energy sites sit with available capacity. Nodiac brings compute to the power." },
  { start: 40, end: 50, text: "42 sites across Minnesota, Iowa, and Wisconsin. Over 340 megawatts. Connected to existing grid infrastructure." },
  { start: 50, end: 62, text: "Pilot sites at Hay River and Walleye are already in development. Modular data centers on trailers. Energized in months." },
  { start: 62, end: 78, text: "50 megawatts by Q4 2026. 200 megawatts by 2027. Over a gigawatt by 2028." },
  { start: 78, end: 86, text: "The fastest path to distributed AI compute in the Upper Midwest." },
  { start: 86, end: 90, text: "Nodiac." },
];

function Subtitles() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = frame / fps;
  const seg = SUBS.find(s => sec >= s.start && sec < s.end);
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

// ─── Main Composition ──────────────────────────────────────────────────────────
export const GridIsFull: React.FC = () => {
  // 90 seconds = 2700 frames
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence from={0} durationInFrames={120}><TheGap /></Sequence>
      <Sequence from={120} durationInFrames={360}><Bottleneck /></Sequence>
      <Sequence from={480} durationInFrames={240}><TheClock /></Sequence>
      <Sequence from={720} durationInFrames={180}><ThePivot /></Sequence>
      <Sequence from={900} durationInFrames={600}><MapUnfolds /></Sequence>
      <Sequence from={1500} durationInFrames={360}><PilotCloseUp /></Sequence>
      <Sequence from={1860} durationInFrames={480}><BusinessCase /></Sequence>
      <Sequence from={2340} durationInFrames={360}><TheClose /></Sequence>
      <Subtitles />
    </AbsoluteFill>
  );
};
