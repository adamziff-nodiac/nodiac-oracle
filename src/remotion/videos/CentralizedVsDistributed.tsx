// Video 3: "Centralized vs. Distributed" — Split-Screen Comparison
// 75 seconds. Side-by-side debate where distributed clearly wins every round.
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
import { C, FONT, NodiacLogo, siteProj, stateColor, Subtitles, Voiceover, type SubSegment } from '../shared';

const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
const TOTAL_CAP = Math.round(UPPER_MIDWEST_SITES.reduce((s, si) => s + si.capacityMW, 0));

// ─── Split-screen wrapper ──────────────────────────────────────────────────────
function SplitFrame({ left, right, dividerOp = 1 }: { left: React.ReactNode; right: React.ReactNode; dividerOp?: number }) {
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', overflow: 'hidden' }}>
        {left}
      </div>
      <div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', overflow: 'hidden' }}>
        {right}
      </div>
      {/* Center divider */}
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: C.teal, opacity: dividerOp * 0.6, transform: 'translateX(-1px)', boxShadow: `0 0 20px ${C.teal}40` }} />
    </AbsoluteFill>
  );
}

// ─── Scene 1: The Challenge (0:00-0:06) ────────────────────────────────────────
function TheChallenge() {
  const frame = useCurrentFrame();
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const splitProgress = interpolate(frame, [40, 80], [0, 1], { extrapolateRight: 'clamp' });
  const leftOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' });
  const rightOp = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity: titleOp, textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: C.white }}>
          AI needs power.
        </div>
        <div style={{ fontSize: 32, color: C.lilac, marginTop: 12 }}>
          There are two paths.
        </div>
      </div>
      {/* Split labels appear */}
      <div style={{ position: 'absolute', left: '15%', bottom: 200, opacity: leftOp }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#666', letterSpacing: 4 }}>TRADITIONAL</div>
      </div>
      <div style={{ position: 'absolute', right: '15%', bottom: 200, opacity: rightOp }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.teal, letterSpacing: 4 }}>DISTRIBUTED</div>
      </div>
      {/* Growing divider line */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-1px)',
        top: `${50 - splitProgress * 50}%`, bottom: `${50 - splitProgress * 50}%`,
        width: 3, background: C.teal, opacity: splitProgress * 0.6,
      }} />
    </AbsoluteFill>
  );
}

// ─── Scene 2: Permitting (0:06-0:16) ──────────────────────────────────────────
function Permitting() {
  const frame = useCurrentFrame();
  const tradBar = interpolate(frame, [0, 280], [0, 0.6], { extrapolateRight: 'clamp' });
  const distBar = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' });
  const stampOp = interpolate(frame, [200, 220], [0, 1], { extrapolateRight: 'clamp' });
  const checkOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  const left = (
    <div style={{ background: '#080808', height: '100%', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#555', letterSpacing: 3, marginBottom: 20 }}>TRADITIONAL</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#888', marginBottom: 30 }}>Permitting</div>
      <div style={{ height: 12, borderRadius: 6, background: '#1a1a1a', marginBottom: 20 }}>
        <div style={{ height: '100%', borderRadius: 6, background: '#cc3333', width: `${tradBar * 100}%` }} />
      </div>
      <div style={{ fontSize: 14, color: '#666', lineHeight: 2 }}>
        Environmental review: 18-24 months<br />
        State permits: 12-18 months<br />
        Federal review: 6-12 months
      </div>
      <div style={{ marginTop: 40, opacity: stampOp }}>
        <div style={{ display: 'inline-block', padding: '8px 20px', border: '2px solid #cc3333', borderRadius: 8, transform: 'rotate(-3deg)' }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#cc3333' }}>3-5 YEARS</span>
        </div>
      </div>
    </div>
  );

  const right = (
    <div style={{ background: '#040810', height: '100%', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 3, marginBottom: 20 }}>DISTRIBUTED</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 30 }}>Permitting</div>
      <div style={{ height: 12, borderRadius: 6, background: '#1a1a1a', marginBottom: 20 }}>
        <div style={{ height: '100%', borderRadius: 6, background: C.teal, width: `${distBar * 100}%` }} />
      </div>
      <div style={{ fontSize: 14, color: C.lilac, lineHeight: 2 }}>
        Existing infrastructure<br />
        Pre-permitted sites<br />
        Behind-the-meter deployment
      </div>
      <div style={{ marginTop: 40, opacity: checkOp }}>
        <div style={{ display: 'inline-block', padding: '8px 20px', border: `2px solid ${C.teal}`, borderRadius: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: C.teal }}>ZERO NEW PERMITS</span>
        </div>
      </div>
    </div>
  );

  return <SplitFrame left={left} right={right} />;
}

// ─── Scene 3: Construction (0:16-0:26) ────────────────────────────────────────
function Construction() {
  const frame = useCurrentFrame();
  const tradCost = interpolate(frame, [0, 250], [0, 1200], { extrapolateRight: 'clamp' });
  const distDeploy = interpolate(frame, [30, 90], [0, 1], { extrapolateRight: 'clamp' });
  const distCost = interpolate(frame, [60, 90], [0, 3], { extrapolateRight: 'clamp' });
  const tradTime = interpolate(frame, [0, 250], [0, 48], { extrapolateRight: 'clamp' });

  const left = (
    <div style={{ background: '#080808', height: '100%', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#555', letterSpacing: 3, marginBottom: 20 }}>TRADITIONAL</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#888', marginBottom: 40 }}>Construction</div>
      {/* Cost counter */}
      <div style={{ fontSize: 48, fontWeight: 900, color: '#cc3333', fontFamily: 'JetBrains Mono, monospace' }}>
        ${Math.round(tradCost)}M
      </div>
      <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>and counting...</div>
      {/* Time bar */}
      <div style={{ marginTop: 40 }}>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Timeline</div>
        <div style={{ height: 8, borderRadius: 4, background: '#1a1a1a', width: '100%' }}>
          <div style={{ height: '100%', borderRadius: 4, background: '#cc3333', width: `${(tradTime / 48) * 100}%`, opacity: 0.7 }} />
        </div>
        <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{Math.round(tradTime)} / 48 months</div>
      </div>
      {/* Building wireframe */}
      <svg width={300} height={200} style={{ marginTop: 30, opacity: 0.3 }}>
        <rect x={20} y={60} width={260} height={130} fill="none" stroke="#333" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={20} y1={60} x2={150} y2={10} stroke="#333" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={280} y1={60} x2={150} y2={10} stroke="#333" strokeWidth={1} strokeDasharray="4 4" />
      </svg>
    </div>
  );

  const right = (
    <div style={{ background: '#040810', height: '100%', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 3, marginBottom: 20 }}>DISTRIBUTED</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 40 }}>Construction</div>
      <div style={{ fontSize: 48, fontWeight: 900, color: C.teal, fontFamily: 'JetBrains Mono, monospace' }}>
        ${distCost.toFixed(0)}M
      </div>
      <div style={{ fontSize: 14, color: C.lilac, marginTop: 8 }}>per site</div>
      {/* Trailer deployment animation */}
      <div style={{ marginTop: 40, position: 'relative', height: 120 }}>
        <div style={{
          position: 'absolute',
          left: `${distDeploy * 60}%`,
          top: 30,
          width: 120, height: 60, borderRadius: 8,
          background: `linear-gradient(180deg, ${C.teal}30, ${C.bg2}60)`,
          border: `1px solid ${C.teal}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: C.teal, fontWeight: 700,
        }}>
          ARMADA POD
        </div>
        {/* Power connection spark */}
        {distDeploy > 0.9 && (
          <div style={{ position: 'absolute', right: 40, top: 55, width: 10, height: 10, borderRadius: '50%', background: C.teal, boxShadow: `0 0 20px ${C.teal}` }} />
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'inline-block', padding: '8px 20px', border: `2px solid ${C.teal}`, borderRadius: 8, opacity: distDeploy > 0.9 ? 1 : 0 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: C.teal }}>DEPLOYED IN WEEKS</span>
        </div>
      </div>
    </div>
  );

  return <SplitFrame left={left} right={right} />;
}

// ─── Scene 4: Reliability (0:26-0:36) ─────────────────────────────────────────
function Reliability() {
  const frame = useCurrentFrame();
  const failFrame = 60;
  const failed = frame >= failFrame;
  const recovery = interpolate(frame, [failFrame + 30, failFrame + 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const leftFail = failed && frame < failFrame + 120;
  const leftRecovery = interpolate(frame, [failFrame + 60, failFrame + 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const left = (
    <div style={{ background: '#080808', height: '100%', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#555', letterSpacing: 3, marginBottom: 20 }}>TRADITIONAL</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#888', marginBottom: 40 }}>Reliability</div>
      {/* Single building */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}>
        <div style={{
          width: 120, height: 120, borderRadius: 16,
          background: leftFail ? 'rgba(204,51,51,0.3)' : 'rgba(255,255,255,0.05)',
          border: `2px solid ${leftFail ? '#cc3333' : '#333'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: 32, color: leftFail ? '#cc3333' : '#666' }}>
            {leftFail ? '\u26A0' : '\uD83C\uDFE2'}
          </div>
          <div style={{ fontSize: 11, color: leftFail ? '#cc3333' : '#666', marginTop: 8 }}>
            {leftFail ? 'OFFLINE' : '500 MW'}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 30 }}>
        {leftFail && (
          <div style={{ fontSize: 18, fontWeight: 700, color: '#cc3333' }}>
            100% CAPACITY OFFLINE
          </div>
        )}
        {leftRecovery > 0 && (
          <div style={{ fontSize: 13, color: '#666', marginTop: 8, opacity: leftRecovery }}>
            Backup generator: 72-hour fuel supply
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 14, color: '#555' }}>
        Single point of failure
      </div>
    </div>
  );

  // Distributed: network of dots
  const networkDots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const x = 200 + Math.cos(a) * 120;
    const y = 280 + Math.sin(a) * 120;
    // 2 dots "fail"
    const isFailed = failed && (i === 3 || i === 7);
    const isRecovered = isFailed && recovery > 0.8;
    return { x, y, isFailed, isRecovered };
  });

  const right = (
    <div style={{ background: '#040810', height: '100%', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 3, marginBottom: 20 }}>DISTRIBUTED</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 20 }}>Reliability</div>
      <svg width={400} height={400}>
        {/* Connection lines */}
        {networkDots.map((d, i) => {
          const next = networkDots[(i + 1) % networkDots.length];
          return <line key={i} x1={d.x} y1={d.y} x2={next.x} y2={next.y} stroke={C.teal} strokeWidth={1} opacity={0.15} />;
        })}
        {/* Dots */}
        {networkDots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={10}
            fill={d.isFailed && !d.isRecovered ? '#cc3333' : C.teal}
            opacity={d.isFailed && !d.isRecovered ? 0.5 : 0.8}
          />
        ))}
        {/* Center hub */}
        <circle cx={200} cy={280} r={20} fill={C.bg2} stroke={C.teal} strokeWidth={2} />
        <text x={200} y={284} fill={C.white} fontSize={10} fontWeight={700} textAnchor="middle" fontFamily={FONT}>HUB</text>
      </svg>
      {failed && (
        <div style={{ textAlign: 'center', marginTop: -20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.teal }}>
            {recovery < 0.8 ? '2 NODES OFFLINE — LOAD REDISTRIBUTED' : 'NETWORK HEALED — ALL NODES ONLINE'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.teal, marginTop: 8 }}>99.999% UPTIME</div>
          <div style={{ fontSize: 13, color: C.lilac }}>No backup generators</div>
        </div>
      )}
    </div>
  );

  return <SplitFrame left={left} right={right} />;
}

// ─── Scene 5: Time to Revenue (0:36-0:46) ─────────────────────────────────────
function TimeToRevenue() {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 250], [0, 1], { extrapolateRight: 'clamp' });

  // Traditional: flat until year 5, then jumps
  const tradRevenue = (x: number) => x > 0.7 ? (x - 0.7) * 3 : 0;
  // Distributed: ramps early
  const distRevenue = (x: number) => x > 0.15 ? Math.pow((x - 0.15) / 0.85, 1.5) : 0;

  const chartW = 340;
  const chartH = 250;

  const left = (
    <div style={{ background: '#080808', height: '100%', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#555', letterSpacing: 3, marginBottom: 20 }}>TRADITIONAL</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#888', marginBottom: 30 }}>Time to Revenue</div>
      <svg width={chartW} height={chartH}>
        {/* Axes */}
        <line x1={40} y1={chartH - 30} x2={chartW} y2={chartH - 30} stroke="#333" strokeWidth={1} />
        <line x1={40} y1={0} x2={40} y2={chartH - 30} stroke="#333" strokeWidth={1} />
        {/* Revenue curve */}
        <path
          d={Array.from({ length: 50 }, (_, i) => {
            const t = (i / 49) * progress;
            const x = 40 + (i / 49) * (chartW - 50);
            const y = chartH - 30 - tradRevenue(t) * (chartH - 40);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ')}
          fill="none" stroke="#cc3333" strokeWidth={2}
        />
        {/* Year labels */}
        {['2025', '2028', '2031'].map((y, i) => (
          <text key={y} x={40 + i * ((chartW - 50) / 2)} y={chartH - 10} fill="#555" fontSize={11} fontFamily={FONT}>{y}</text>
        ))}
      </svg>
      <div style={{ marginTop: 20, fontSize: 16, fontWeight: 700, color: '#cc3333' }}>
        FIRST REVENUE: YEAR 5-7
      </div>
    </div>
  );

  const right = (
    <div style={{ background: '#040810', height: '100%', padding: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 3, marginBottom: 20 }}>DISTRIBUTED</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 30 }}>Time to Revenue</div>
      <svg width={chartW} height={chartH}>
        <line x1={40} y1={chartH - 30} x2={chartW} y2={chartH - 30} stroke="#333" strokeWidth={1} />
        <line x1={40} y1={0} x2={40} y2={chartH - 30} stroke="#333" strokeWidth={1} />
        <path
          d={Array.from({ length: 50 }, (_, i) => {
            const t = (i / 49) * progress;
            const x = 40 + (i / 49) * (chartW - 50);
            const y = chartH - 30 - distRevenue(t) * (chartH - 40);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ')}
          fill="none" stroke={C.teal} strokeWidth={2.5}
        />
        {['2025', '2027', '2028+'].map((y, i) => (
          <text key={y} x={40 + i * ((chartW - 50) / 2)} y={chartH - 10} fill={C.lilac} fontSize={11} fontFamily={FONT}>{y}</text>
        ))}
        {/* Milestone markers */}
        {progress > 0.25 && <text x={140} y={chartH - 80} fill={C.teal} fontSize={12} fontWeight={700} fontFamily={FONT}>$39M</text>}
        {progress > 0.5 && <text x={210} y={chartH - 120} fill={C.teal} fontSize={12} fontWeight={700} fontFamily={FONT}>$156M</text>}
        {progress > 0.8 && <text x={280} y={chartH - 180} fill={C.teal} fontSize={14} fontWeight={700} fontFamily={FONT}>$780M+</text>}
      </svg>
      <div style={{ marginTop: 20, fontSize: 16, fontWeight: 700, color: C.teal }}>
        FIRST REVENUE: MONTHS
      </div>
    </div>
  );

  return <SplitFrame left={left} right={right} />;
}

// ─── Scene 6: The Verdict (0:46-0:56) ─────────────────────────────────────────
function TheVerdict() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Left side crumbles away
  const crumble = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
  const rightExpand = interpolate(frame, [30, 90], [50, 100], { extrapolateRight: 'clamp' });

  // Stats appear
  const stats = [
    { n: '42 sites', delay: 80 },
    { n: '348 MW', delay: 95 },
    { n: '3 states', delay: 110 },
    { n: 'Months to deploy', delay: 125 },
    { n: '$780K/MW/year', delay: 140 },
    { n: '99.999% uptime', delay: 155 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      {/* Crumbling left side */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', opacity: 1 - crumble, filter: `blur(${crumble * 10}px)`, background: '#080808' }} />

      {/* Expanding right side */}
      <div style={{ position: 'absolute', left: `${100 - rightExpand}%`, top: 0, width: `${rightExpand}%`, height: '100%', background: C.bg }}>
        <div style={{ padding: 80, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, justifyContent: 'center', marginTop: 100 }}>
            {stats.map(s => {
              const op = spring({ frame: frame - s.delay, fps, config: { damping: 12 } });
              return (
                <div key={s.n} style={{
                  padding: '16px 32px', borderRadius: 12,
                  background: `${C.teal}10`, border: `1px solid ${C.teal}30`,
                  opacity: op, transform: `scale(${op})`,
                }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{s.n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Scene 7: CTA (0:56-1:15) ─────────────────────────────────────────────────
function ComparisonCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSc = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const tagOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${C.bg2} 0%, ${C.bg} 70%)`, fontFamily: FONT, justifyContent: 'center', alignItems: 'center' }}>
      {/* Subtle network dots */}
      {UPPER_MIDWEST_SITES.slice(0, 15).map((site, i) => {
        const p = siteProj(site);
        return <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: 3, height: 3, borderRadius: '50%', background: C.teal, opacity: 0.15 }} />;
      })}
      <div style={{ transform: `scale(${logoSc})`, zIndex: 10 }}>
        <NodiacLogo width={400} />
      </div>
      <div style={{ position: 'absolute', bottom: 240, left: 0, right: 0, textAlign: 'center', opacity: tagOp, zIndex: 10 }}>
        <div style={{ fontSize: 24, fontWeight: 600, color: C.white }}>Distributed Power Infrastructure for AI Compute</div>
      </div>
      <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center', opacity: tagOp, zIndex: 10 }}>
        <div style={{ fontSize: 18, color: C.lilac, letterSpacing: 3 }}>NODIAC.AI</div>
      </div>
    </AbsoluteFill>
  );
}

// ─── Voiceover Script ──────────────────────────────────────────────────────────
const SUBS: SubSegment[] = [
  { start: 0, end: 3, text: '' },
  { start: 3, end: 6, text: 'AI needs power. There are two paths.' },
  { start: 6, end: 10, text: "The traditional approach: build massive centralized data centers." },
  { start: 10, end: 14, text: 'Environmental reviews. State permits. Federal approvals. Three to five years before a single rack powers on.' },
  { start: 14, end: 18, text: "The distributed approach: go to where the power already is." },
  { start: 18, end: 22, text: 'Existing sites. Pre-permitted land. Behind-the-meter deployment. Zero new permits required.' },
  { start: 22, end: 26, text: 'Construction: traditional means billions in concrete and steel. Years of work.' },
  { start: 26, end: 30, text: 'Distributed means Armada compute pods on trailers. Deployed in weeks, not years.' },
  { start: 30, end: 34, text: 'Reliability: one centralized facility means one point of failure.' },
  { start: 34, end: 38, text: 'A distributed network absorbs failures. Nodes go down, the network heals. 99.999 percent uptime.' },
  { start: 38, end: 42, text: 'No backup generators needed. The redundancy is the network itself.' },
  { start: 42, end: 46, text: 'Time to revenue: traditional takes five to seven years.' },
  { start: 46, end: 50, text: 'Distributed: first revenue in months. 39 million by Q4 2026. 780 million plus by 2028.' },
  { start: 50, end: 56, text: 'The verdict is clear. 42 sites. 348 megawatts. Months to deploy. $780K per megawatt per year.' },
  { start: 56, end: 62, text: 'Distributed power infrastructure for AI compute.' },
  { start: 62, end: 68, text: 'Nodiac.' },
  { start: 68, end: 75, text: '' },
];

// ─── Main Composition ──────────────────────────────────────────────────────────
export const CentralizedVsDistributed: React.FC<{ showSubtitles?: boolean; showVoiceover?: boolean }> = ({ showSubtitles = true, showVoiceover = true }) => {
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={0} durationInFrames={180}><TheChallenge /></Sequence>
      <Sequence from={180} durationInFrames={300}><Permitting /></Sequence>
      <Sequence from={480} durationInFrames={300}><Construction /></Sequence>
      <Sequence from={780} durationInFrames={300}><Reliability /></Sequence>
      <Sequence from={1080} durationInFrames={300}><TimeToRevenue /></Sequence>
      <Sequence from={1380} durationInFrames={300}><TheVerdict /></Sequence>
      <Sequence from={1680} durationInFrames={570}><ComparisonCTA /></Sequence>
      <Subtitles segments={SUBS} enabled={showSubtitles} />
      <Voiceover src="audio/centralized-vs-distributed.mp3" enabled={showVoiceover} />
    </AbsoluteFill>
  );
};

export const CVD_DURATION = 2250; // 75 seconds
