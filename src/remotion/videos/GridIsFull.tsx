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
  Subtitles, Voiceover, type SubSegment,
} from '../shared';

const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
const TOTAL_CAP = Math.round(UPPER_MIDWEST_SITES.reduce((s, si) => s + si.capacityMW, 0));

// ─── Scene 1: The Gap (0:00-0:04) — Stark white text on black ─────────────────
function TheGap() {
  const frame = useCurrentFrame();
  const line1 = '100 gigawatts of AI compute demand by 2030.';
  const line2 = '0 gigawatts of new power capacity available today.';
  const chars1 = Math.min(line1.length, Math.floor(frame * 1.2));
  const chars2 = Math.min(line2.length, Math.max(0, Math.floor((frame - 50) * 1.2)));
  const cursor = frame % 30 < 15;
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000000', justifyContent: 'center', alignItems: 'center', fontFamily: 'JetBrains Mono, monospace', opacity: fadeIn }}>
      {/* Subtle scan lines */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)' }} />
      <div style={{ textAlign: 'center', maxWidth: 1600 }}>
        <div style={{ fontSize: 52, color: C.white, letterSpacing: 1.5, lineHeight: 1.6, fontWeight: 600 }}>
          {line1.slice(0, chars1)}
          {chars1 < line1.length && cursor ? '▊' : ''}
        </div>
        <div style={{ fontSize: 52, color: '#ff4444', letterSpacing: 1.5, lineHeight: 1.6, marginTop: 24, fontWeight: 700 }}>
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
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const demandPct = interpolate(frame, [0, 300], [0, 1], { extrapolateRight: 'clamp' });
  const supplyPct = interpolate(frame, [0, 300], [0, 0.04], { extrapolateRight: 'clamp' });
  const demandGW = Math.round(demandPct * 100);
  const supplyGW = Math.round(supplyPct * 100);

  const card1Op = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: 'clamp' });
  const card2Op = interpolate(frame, [150, 170], [0, 1], { extrapolateRight: 'clamp' });
  const card3Op = interpolate(frame, [210, 230], [0, 1], { extrapolateRight: 'clamp' });

  const redGlow = interpolate(frame, [0, 300], [0, 0.4], { extrapolateRight: 'clamp' });

  const particles = Array.from({ length: 40 }, (_, i) => {
    const progress = interpolate(frame, [i * 6, i * 6 + 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const stuck = progress > 0.45;
    const x = stuck
      ? 960 + (Math.sin(i * 1.7 + frame * 0.05) * 50)
      : interpolate(progress, [0, 0.45], [80, 960]);
    const y = 460 + Math.sin(i * 2.3 + frame * 0.03) * (stuck ? 100 : 30);
    return { x, y, o: interpolate(progress, [0, 0.1, 0.9, 1], [0, 0.9, 0.9, 0.3]), r: 5 + Math.random() * 4 };
  });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #1a0000 0%, #000000 100%)`, fontFamily: FONT, opacity: fadeIn }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 40%, rgba(255,0,0,${redGlow}) 0%, transparent 70%)` }} />

      {/* Title */}
      <div style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 20, color: '#ff4444', fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase' }}>The Bottleneck</div>
      </div>

      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        {/* Pipeline track — larger */}
        <rect x={80} y={420} width={1760} height={80} rx={40} fill="#111" stroke="#333" strokeWidth={2} />
        {/* Demand fill */}
        <rect x={82} y={424} width={Math.min(838, demandPct * 1760)} height={72} rx={36} fill={C.teal} opacity={0.5} />
        {/* Bottleneck barrier */}
        <rect x={920} y={390} width={12} height={140} rx={6} fill="#ff4444" opacity={0.9}>
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
        </rect>
        {/* Supply trickle */}
        <rect x={950} y={424} width={supplyPct * 1760} height={72} rx={36} fill="#22aa22" opacity={0.3} />

        {/* Particles — larger */}
        {particles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={C.teal} opacity={p.o} />
        ))}

        {/* Labels — larger */}
        <text x={180} y={395} fill={C.white} fontSize={22} fontWeight={700} fontFamily={FONT} letterSpacing={3}>DEMAND</text>
        <text x={180} y={560} fill={C.teal} fontSize={44} fontWeight={900} fontFamily={FONT}>{demandGW} GW</text>
        <text x={1700} y={395} fill={'#22aa22'} fontSize={22} fontWeight={700} fontFamily={FONT} textAnchor="end" letterSpacing={3}>SUPPLY</text>
        <text x={1700} y={560} fill={'#22aa22'} fontSize={44} fontWeight={900} fontFamily={FONT} textAnchor="end">{supplyGW} GW</text>
      </svg>

      {/* Stats cards — larger text */}
      <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40 }}>
        {[
          { text: '5-year interconnection queues', op: card1Op, color: '#ff6666' },
          { text: '$98B in delayed projects', op: card2Op, color: '#ffaa44' },
          { text: '200 MW 6 mo sooner = $1.2B revenue', op: card3Op, color: C.teal },
        ].map((c, i) => (
          <div key={i} style={{ opacity: c.op, transform: `translateY(${(1 - c.op) * 20}px)`, padding: '20px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.color}30`, backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: 22, color: C.white, fontWeight: 600 }}>{c.text}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 3: The Clock (0:16-0:24) — Years ticking away ───────────────────────
function TheClock() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const yearProgress = interpolate(frame, [0, 150], [2025, 2032], { extrapolateRight: 'clamp' });
  const year = Math.floor(yearProgress);
  const handAngle = (yearProgress - 2025) * (360 / 7);
  const shatter = interpolate(frame, [160, 190], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const questionOp = interpolate(frame, [190, 210], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const questionScale = spring({ frame: Math.max(0, frame - 190), fps: 30, config: { damping: 10, mass: 0.8 } });

  const shards = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const d = shatter * 500;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: (i % 3) * 12 + 8, o: 1 - shatter, rot: i * 15 + shatter * 360 };
  });

  return (
    <AbsoluteFill style={{ background: '#000', justifyContent: 'center', alignItems: 'center', fontFamily: FONT, opacity: fadeIn }}>
      {/* Background year text */}
      <div style={{ position: 'absolute', fontSize: 300, fontWeight: 900, color: '#ffffff', opacity: 0.02 * (1 - shatter), zIndex: 0 }}>
        {year}
      </div>

      {/* Clock — bigger */}
      <div style={{ opacity: 1 - shatter }}>
        <svg width={500} height={500} style={{ overflow: 'visible' }}>
          {/* Outer ring */}
          <circle cx={250} cy={250} r={220} fill="none" stroke="#222" strokeWidth={4} />
          <circle cx={250} cy={250} r={210} fill="none" stroke="#1a1a1a" strokeWidth={1} />
          <circle cx={250} cy={250} r={6} fill={C.white} />
          {/* Progress arc */}
          {(() => {
            const progress = (yearProgress - 2025) / 7;
            const arcAngle = progress * 360;
            const rad = (a: number) => ((a - 90) * Math.PI) / 180;
            const endX = 250 + Math.cos(rad(arcAngle)) * 210;
            const endY = 250 + Math.sin(rad(arcAngle)) * 210;
            const largeArc = arcAngle > 180 ? 1 : 0;
            return (
              <path
                d={`M250,40 A210,210 0 ${largeArc},1 ${endX},${endY}`}
                fill="none" stroke="#ff4444" strokeWidth={4} strokeLinecap="round" opacity={0.6}
              />
            );
          })()}
          {/* Hand */}
          <line
            x1={250} y1={250}
            x2={250 + Math.cos((handAngle - 90) * Math.PI / 180) * 170}
            y2={250 + Math.sin((handAngle - 90) * Math.PI / 180) * 170}
            stroke={C.white} strokeWidth={4} strokeLinecap="round"
          />
          {/* Year markers */}
          {[2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032].map((y, i) => {
            const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
            const active = y <= year;
            return (
              <React.Fragment key={y}>
                <circle cx={250 + Math.cos(a) * 190} cy={250 + Math.sin(a) * 190} r={active ? 5 : 3} fill={active ? '#ff4444' : '#333'} />
                <text x={250 + Math.cos(a) * 160} y={255 + Math.sin(a) * 160}
                  fill={active ? C.white : '#555'} fontSize={18} fontWeight={700}
                  textAnchor="middle" fontFamily={FONT}>{y}</text>
              </React.Fragment>
            );
          })}
        </svg>
      </div>

      {/* Timeline label */}
      <div style={{ position: 'absolute', bottom: 260, fontSize: 28, color: '#888', opacity: (1 - shatter), fontWeight: 500 }}>
        Traditional data center timeline: <span style={{ color: '#ff6666', fontWeight: 700 }}>5-7 years</span> to power
      </div>

      {/* Shatter particles */}
      {shards.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)`,
          width: s.r, height: s.r, background: '#333', opacity: s.o,
          transform: `rotate(${s.rot}deg)`, borderRadius: 2,
        }} />
      ))}

      {/* Question */}
      <div style={{ position: 'absolute', opacity: questionOp, transform: `scale(${questionScale})` }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: C.white, textShadow: `0 0 60px ${C.teal}30` }}>
          What if you didn&apos;t wait?
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 4: The Pivot (0:24-0:30) — Dramatic teal sweep ─────────────────────
function ThePivot() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const textOp = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
  const textScale = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 12 } });
  const sweepProgress = interpolate(frame, [40, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1) });
  const logoOp = interpolate(frame, [90, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoScale = spring({ frame: Math.max(0, frame - 90), fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: FONT, opacity: fadeIn }}>
      {/* Teal sweep overlay */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${sweepProgress * 100}%`,
        background: `linear-gradient(135deg, ${C.multiply} 0%, ${C.eggplant} 100%)`,
      }} />

      {/* Text */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: textOp * (1 - logoOp), zIndex: 10 }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: C.teal, textAlign: 'center', textShadow: `0 0 60px ${C.teal}50`, transform: `scale(${textScale})` }}>
          Speed-to-power.
        </div>
        <div style={{ fontSize: 24, color: C.lilac, marginTop: 16, textAlign: 'center', opacity: textOp }}>
          Go to where the power already is.
        </div>
      </div>

      {/* Logo */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: logoOp, zIndex: 10, transform: `scale(${logoScale})` }}>
        <NodiacLogo width={400} />
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 5: Map Unfolds (0:30-0:50) — Zoom into Upper Midwest ───────────────
function MapUnfolds() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Faster zoom — start sites sooner
  const zoomScale = interpolate(frame, [0, 120], [1, 2.8], { extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const zoomTx = interpolate(frame, [0, 120], [0, ZOOM_TO_MW.tx], { extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const zoomTy = interpolate(frame, [0, 120], [0, ZOOM_TO_MW.ty], { extrapolateRight: 'clamp', easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

  // Sites appear sooner and faster
  const sorted = [...UPPER_MIDWEST_SITES].sort((a, b) => b.capacityMW - a.capacityMW);
  const visCount = Math.min(TOTAL_SITES, Math.max(0, Math.floor((frame - 120) / 4)));

  const visCap = sorted.slice(0, visCount).reduce((s, si) => s + si.capacityMW, 0);

  // Title text
  const titleOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const titleFo = interpolate(frame, [100, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.multiply, fontFamily: FONT, opacity: fadeIn }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 55% 40%, ${C.teal}08 0%, transparent 60%)` }} />

      <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoomScale}) translate(${zoomTx}px, ${zoomTy}px)`, transformOrigin: 'center' }}>
        <svg width="1920" height="1080" style={{ position: 'absolute' }}>
          <USMap projFn={usProj} accentColor={C.teal} mutedColor={C.orchid} />
        </svg>
      </div>

      {/* Title during zoom */}
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center', opacity: titleOp * titleFo, zIndex: 10 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: C.white }}>Upper Midwest Regional Hub</div>
        <div style={{ fontSize: 18, color: C.teal, marginTop: 8, letterSpacing: 3 }}>GREENBACKER-OWNED GENERATION SITES</div>
      </div>

      {/* After zoom: show site dots */}
      {frame > 120 && (
        <svg width="1920" height="1080" style={{ position: 'absolute', zIndex: 5 }}>
          <defs><filter id="gf"><feGaussianBlur stdDeviation="8" /></filter></defs>
          {sorted.map((site, i) => {
            if (i >= visCount) return null;
            const p = siteProj(site);
            const ap = spring({ frame: frame - (120 + i * 4), fps, config: { damping: 10, mass: 0.5 } });
            const r = 5 + Math.sqrt(site.capacityMW) * 2;
            const c = stateColor(site.state);
            return (
              <g key={site.name}>
                <circle cx={p.x} cy={p.y} r={r * 3 * ap} fill={c} opacity={0.25 * ap} filter="url(#gf)" />
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
              .map((n, ni) => <line key={`c${i}-${ni}`} x1={p.x} y1={p.y} x2={n.pos.x} y2={n.pos.y} stroke={C.teal} strokeWidth={1} opacity={0.2} />);
          })}
        </svg>
      )}

      {/* Running counter */}
      {frame > 120 && (
        <div style={{ position: 'absolute', top: 40, right: 80, textAlign: 'right', zIndex: 10 }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: C.teal }}>{visCount} <span style={{ fontSize: 24, color: C.lilac }}>sites</span></div>
          <div style={{ fontSize: 40, fontWeight: 700, color: C.white }}>{Math.round(visCap)} <span style={{ fontSize: 20, color: C.lilac }}>MW</span></div>
        </div>
      )}
    </AbsoluteFill>
  );
}

// ─── Scene 6: Pilot Close-Up (0:50-1:02) ──────────────────────────────────────
function PilotCloseUp() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const c1 = spring({ frame: frame - 10, fps, config: { damping: 12 } });
  const c2 = spring({ frame: frame - 25, fps, config: { damping: 12 } });
  const podOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  const pilots = [
    { name: 'Hay River', loc: 'Boyceville, WI', mw: '1.5 MW', exp: '10 MW', color: C.teal },
    { name: 'Walleye', loc: 'Colfax, WI', mw: '1.5 MW', exp: '15 MW', color: C.orchid },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${C.multiply} 0%, #0a0520 100%)`, fontFamily: FONT, opacity: fadeIn }}>
      {/* Ambient network in background */}
      <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.08 }}>
        {UPPER_MIDWEST_SITES.slice(0, 20).map((site, i) => {
          const p = siteProj(site);
          return <circle key={i} cx={p.x} cy={p.y} r={3 + Math.sqrt(site.capacityMW)} fill={C.teal} />;
        })}
      </svg>

      <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 20, color: C.teal, fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase' }}>Pilot Sites In Development</div>
        <div style={{ fontSize: 16, color: C.lilac, marginTop: 6 }}>Dunn Energy Cooperative &bull; Western Wisconsin</div>
      </div>
      <div style={{ position: 'absolute', top: 180, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60 }}>
        {pilots.map((p, i) => (
          <div key={p.name} style={{
            width: 560, padding: 48, borderRadius: 24,
            background: `${C.eggplant}50`, border: `1px solid ${p.color}40`,
            opacity: i === 0 ? c1 : c2,
            transform: `translateY(${(1 - (i === 0 ? c1 : c2)) * 30}px)`,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 16, color: p.color, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>{i === 0 ? 'Anchor Site' : 'Pilot Site'}</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: C.white, marginTop: 12 }}>{p.name}</div>
            <div style={{ fontSize: 20, color: C.lilac, marginTop: 8 }}>{p.loc} &bull; Dunn Energy Coop</div>
            <div style={{ display: 'flex', gap: 50, marginTop: 28 }}>
              <div><div style={{ fontSize: 36, fontWeight: 900, color: C.teal }}>{p.mw}</div><div style={{ fontSize: 16, color: C.lilac }}>Confirmed</div></div>
              <div><div style={{ fontSize: 36, fontWeight: 900, color: C.orchid }}>{p.exp}</div><div style={{ fontSize: 16, color: C.lilac }}>Expansion</div></div>
            </div>
          </div>
        ))}
      </div>
      {/* Deployment details - fill the dead space */}
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, opacity: podOp }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 28, color: C.white, fontWeight: 600 }}>Modular. Mobile. Months to deploy — not years.</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 8 }}>
          {[
            { label: 'Hardware', value: 'Armada compute pods', sub: 'Trailer-mounted, no concrete' },
            { label: 'Power Partner', value: 'Dunn Energy Coop', sub: 'Interconnection approved' },
            { label: 'Speed-to-Power', value: 'Weeks to energize', sub: 'vs 5-7 years traditional' },
          ].map(d => (
            <div key={d.label} style={{ textAlign: 'center', padding: '12px 24px', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 14, color: C.teal, fontWeight: 700, letterSpacing: 2 }}>{d.label}</div>
              <div style={{ fontSize: 20, color: C.white, fontWeight: 600, marginTop: 6 }}>{d.value}</div>
              <div style={{ fontSize: 14, color: C.lilac, marginTop: 4 }}>{d.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 7: Business Case (1:02-1:18) — Scaling bars ─────────────────────────
function BusinessCase() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const milestones = [
    { y: 'Q4 2026', mw: '50 MW', rev: '$39M ARR', pct: 0.15, color: C.teal, delay: 10 },
    { y: '2027', mw: '200 MW', rev: '$156M ARR', pct: 0.5, color: C.orchid, delay: 30 },
    { y: '2028+', mw: '1 GW+', rev: '$780M+ ARR', pct: 1, color: C.teal, delay: 50 },
  ];

  const diffOp = interpolate(frame, [180, 200], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, opacity: fadeIn }}>
      {/* Background gradient */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 20%, ${C.eggplant}30 0%, transparent 60%)` }} />

      <div style={{ position: 'absolute', top: 80, left: 120 }}>
        <div style={{ fontSize: 20, color: C.teal, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase' }}>Scaling Roadmap</div>
      </div>
      <div style={{ position: 'absolute', top: 160, left: 120, right: 120 }}>
        {milestones.map((m, i) => {
          const barW = spring({ frame: frame - m.delay, fps, config: { damping: 15, mass: 0.8 } });
          return (
            <div key={m.y} style={{ marginBottom: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: C.white }}>{m.y}</span>
                <div style={{ display: 'flex', gap: 30 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: m.color }}>{m.mw}</span>
                  <span style={{ fontSize: 26, fontWeight: 700, color: C.lilac }}>{m.rev}</span>
                </div>
              </div>
              <div style={{ height: 48, borderRadius: 12, background: '#111', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${m.pct * 100 * barW}%`, borderRadius: 12, background: `linear-gradient(90deg, ${m.color}, ${m.color}80)` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 80, left: 120, right: 120, display: 'flex', gap: 30, opacity: diffOp }}>
        {[
          { text: '<14 month payback per MW', color: C.teal },
          { text: 'Triple-net lease, stable EBITDA', color: C.orchid },
          { text: 'Greenbacker-owned site access ($3B AUM)', color: C.white },
        ].map(t => (
          <div key={t.text} style={{ flex: 1, padding: '20px 28px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.color}20` }}>
            <span style={{ fontSize: 20, color: C.white, fontWeight: 600 }}>{t.text}</span>
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
      {/* Background network pulse — bigger, more visible */}
      <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.15 }}>
        {UPPER_MIDWEST_SITES.map((site, i) => {
          const p = siteProj(site);
          const pulse = Math.sin(frame * 0.04 + i * 0.5) * 0.5 + 0.5;
          const r = 4 + Math.sqrt(site.capacityMW);
          return (
            <React.Fragment key={i}>
              <circle cx={p.x} cy={p.y} r={r * pulse + 2} fill={stateColor(site.state)} opacity={pulse * 0.5} />
              <circle cx={p.x} cy={p.y} r={r * 2} fill={stateColor(site.state)} opacity={0.1} />
            </React.Fragment>
          );
        })}
      </svg>

      <div style={{ textAlign: 'center', transform: `scale(${logoSc})`, zIndex: 10 }}>
        <NodiacLogo width={500} />
      </div>
      <div style={{ position: 'absolute', bottom: 260, left: 0, right: 0, textAlign: 'center', opacity: tagOp, zIndex: 10 }}>
        <div style={{ fontSize: 32, fontWeight: 600, color: C.white }}>
          Speed-to-power for AI inference
          <br />
          <span style={{ color: C.teal }}>starting in the Upper Midwest.</span>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, textAlign: 'center', opacity: urlOp, zIndex: 10 }}>
        <div style={{ fontSize: 18, color: '#ff8866', fontWeight: 600, marginBottom: 16 }}>The first-mover window is closing.</div>
        <div style={{ fontSize: 24, color: C.lilac, letterSpacing: 4 }}>NODIAC.AI</div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Subtitle Overlay ──────────────────────────────────────────────────────────
const SUBS: SubSegment[] = [
  { start: 0, end: 4, text: '' },
  { start: 4, end: 10, text: "The AI industry needs 100 gigawatts of power. The grid can deliver a fraction of that. 200 megawatts online 6 months sooner equals 1.2 billion in hyperscaler revenue." },
  { start: 10, end: 16, text: "Five-year interconnection queues. 98 billion dollars in delayed projects. Speed-to-power is the bottleneck." },
  { start: 16, end: 24, text: "Building a new data center takes five to seven years to energize. Inference — how AI labs make money — cannot wait that long." },
  { start: 24, end: 30, text: "Speed-to-power. Go to where the power already is." },
  { start: 30, end: 40, text: "Across the Upper Midwest, 42 Greenbacker-owned renewable generation sites sit with available capacity. Nodiac brings inference compute to the power." },
  { start: 40, end: 50, text: "42 sites across Minnesota, Iowa, and Wisconsin. Over 340 megawatts. Existing infrastructure. Grid connections. Pre-permitted." },
  { start: 50, end: 62, text: "Pilot sites at Hay River and Walleye with Dunn Energy Cooperative. Armada compute pods on trailers. Energized in weeks." },
  { start: 62, end: 78, text: "50 megawatts by Q4 2026. 200 megawatts by 2027. Over a gigawatt by 2028. Less than 14 months to payback per megawatt." },
  { start: 78, end: 86, text: "Speed-to-power for AI inference, starting in the Upper Midwest." },
  { start: 86, end: 90, text: "Nodiac. The first-mover window is closing." },
];


// ─── Main Composition ──────────────────────────────────────────────────────────
export const GridIsFull: React.FC<{ showSubtitles?: boolean; showVoiceover?: boolean }> = ({ showSubtitles = true, showVoiceover = true }) => {
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
      <Subtitles segments={SUBS} enabled={showSubtitles} />
      <Voiceover src="audio/grid-is-full.mp3" enabled={showVoiceover} />
    </AbsoluteFill>
  );
};
