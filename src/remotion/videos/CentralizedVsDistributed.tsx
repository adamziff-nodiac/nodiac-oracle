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
  Easing,
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
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 4, background: C.teal, opacity: dividerOp * 0.5, transform: 'translateX(-2px)', boxShadow: `0 0 30px ${C.teal}40` }} />
    </AbsoluteFill>
  );
}

// ─── Scene 1: The Challenge (0:00-0:06) ────────────────────────────────────────
function TheChallenge() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const titleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const splitProgress = interpolate(frame, [40, 80], [0, 1], { extrapolateRight: 'clamp' });
  const leftOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' });
  const rightOp = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, justifyContent: 'center', alignItems: 'center', opacity: fadeIn }}>
      <div style={{ opacity: titleOp, textAlign: 'center' }}>
        <div style={{ fontSize: 56, fontWeight: 800, color: C.white }}>
          AI needs power.
        </div>
        <div style={{ fontSize: 36, color: C.lilac, marginTop: 16 }}>
          There are two paths.
        </div>
      </div>
      <div style={{ position: 'absolute', left: '15%', bottom: 200, opacity: leftOp }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#666', letterSpacing: 5 }}>TRADITIONAL</div>
      </div>
      <div style={{ position: 'absolute', right: '15%', bottom: 200, opacity: rightOp }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.teal, letterSpacing: 5 }}>DISTRIBUTED</div>
      </div>
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-2px)',
        top: `${50 - splitProgress * 50}%`, bottom: `${50 - splitProgress * 50}%`,
        width: 4, background: C.teal, opacity: splitProgress * 0.5,
      }} />
    </AbsoluteFill>
  );
}

// ─── Scene 2: Permitting (0:06-0:16) ──────────────────────────────────────────
function Permitting() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const tradBar = interpolate(frame, [0, 280], [0, 0.6], { extrapolateRight: 'clamp' });
  const distBar = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' });
  const stampOp = interpolate(frame, [180, 200], [0, 1], { extrapolateRight: 'clamp' });
  const checkOp = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  const left = (
    <div style={{ background: '#080808', height: '100%', padding: '60px 50px', fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#555', letterSpacing: 4, marginBottom: 20 }}>TRADITIONAL</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#888', marginBottom: 30 }}>Permitting</div>
      <div style={{ height: 16, borderRadius: 8, background: '#1a1a1a', marginBottom: 24 }}>
        <div style={{ height: '100%', borderRadius: 8, background: '#cc3333', width: `${tradBar * 100}%` }} />
      </div>
      <div style={{ fontSize: 20, color: '#666', lineHeight: 2.2 }}>
        Environmental review: 18-24 months<br />
        State permits: 12-18 months<br />
        Federal review: 6-12 months
      </div>
      <div style={{ marginTop: 50, opacity: stampOp }}>
        <div style={{ display: 'inline-block', padding: '12px 28px', border: '3px solid #cc3333', borderRadius: 12, transform: 'rotate(-3deg)' }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#cc3333' }}>3-5 YEARS</span>
        </div>
      </div>
      {/* Warning icon */}
      <div style={{ position: 'absolute', bottom: 80, left: 50, right: 50 }}>
        <div style={{ fontSize: 18, color: '#555', fontStyle: 'italic' }}>Before a single rack powers on</div>
      </div>
    </div>
  );

  const right = (
    <div style={{ background: '#040810', height: '100%', padding: '60px 50px', fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, letterSpacing: 4, marginBottom: 20 }}>DISTRIBUTED</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 30 }}>Permitting</div>
      <div style={{ height: 16, borderRadius: 8, background: '#1a1a1a', marginBottom: 24 }}>
        <div style={{ height: '100%', borderRadius: 8, background: C.teal, width: `${distBar * 100}%` }} />
      </div>
      <div style={{ fontSize: 20, color: C.lilac, lineHeight: 2.2 }}>
        Existing infrastructure<br />
        Pre-permitted sites<br />
        Behind-the-meter deployment
      </div>
      <div style={{ marginTop: 50, opacity: checkOp }}>
        <div style={{ display: 'inline-block', padding: '12px 28px', border: `3px solid ${C.teal}`, borderRadius: 12 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: C.teal }}>ZERO NEW PERMITS</span>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 80, right: 50 }}>
        <div style={{ fontSize: 18, color: C.teal, fontWeight: 600 }}>Deploy immediately</div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <SplitFrame left={left} right={right} />
    </AbsoluteFill>
  );
}

// ─── Scene 3: Construction (0:16-0:26) ────────────────────────────────────────
function Construction() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const tradCost = interpolate(frame, [0, 250], [0, 1200], { extrapolateRight: 'clamp' });
  const distDeploy = interpolate(frame, [30, 90], [0, 1], { extrapolateRight: 'clamp' });
  const distCost = interpolate(frame, [60, 90], [0, 3], { extrapolateRight: 'clamp' });
  const tradTime = interpolate(frame, [0, 250], [0, 48], { extrapolateRight: 'clamp' });

  const left = (
    <div style={{ background: '#080808', height: '100%', padding: '60px 50px', fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#555', letterSpacing: 4, marginBottom: 20 }}>TRADITIONAL</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#888', marginBottom: 40 }}>Construction</div>
      <div style={{ fontSize: 64, fontWeight: 900, color: '#cc3333', fontFamily: 'JetBrains Mono, monospace' }}>
        ${Math.round(tradCost)}M
      </div>
      <div style={{ fontSize: 20, color: '#666', marginTop: 8 }}>and counting...</div>
      <div style={{ marginTop: 40 }}>
        <div style={{ fontSize: 18, color: '#666', marginBottom: 10 }}>Timeline</div>
        <div style={{ height: 12, borderRadius: 6, background: '#1a1a1a', width: '100%' }}>
          <div style={{ height: '100%', borderRadius: 6, background: '#cc3333', width: `${(tradTime / 48) * 100}%`, opacity: 0.7 }} />
        </div>
        <div style={{ fontSize: 18, color: '#555', marginTop: 8 }}>{Math.round(tradTime)} / 48 months</div>
      </div>
      {/* Building wireframe — bigger and bolder */}
      <svg width={400} height={200} style={{ marginTop: 30, opacity: 0.2 }}>
        <rect x={20} y={60} width={360} height={130} fill="none" stroke="#444" strokeWidth={2} strokeDasharray="6 4" />
        <line x1={20} y1={60} x2={200} y2={10} stroke="#444" strokeWidth={2} strokeDasharray="6 4" />
        <line x1={380} y1={60} x2={200} y2={10} stroke="#444" strokeWidth={2} strokeDasharray="6 4" />
        <text x={200} y={140} fill="#444" fontSize={14} textAnchor="middle" fontFamily={FONT}>UNDER CONSTRUCTION</text>
      </svg>
    </div>
  );

  const right = (
    <div style={{ background: '#040810', height: '100%', padding: '60px 50px', fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, letterSpacing: 4, marginBottom: 20 }}>DISTRIBUTED</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 40 }}>Construction</div>
      <div style={{ fontSize: 64, fontWeight: 900, color: C.teal, fontFamily: 'JetBrains Mono, monospace' }}>
        ${distCost.toFixed(0)}M
      </div>
      <div style={{ fontSize: 20, color: C.lilac, marginTop: 8 }}>per site</div>
      {/* Trailer deployment animation — bigger */}
      <div style={{ marginTop: 40, position: 'relative', height: 160 }}>
        <div style={{
          position: 'absolute',
          left: `${distDeploy * 55}%`,
          top: 30,
          width: 180, height: 80, borderRadius: 12,
          background: `linear-gradient(180deg, ${C.teal}40, ${C.bg2}60)`,
          border: `2px solid ${C.teal}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: C.teal, fontWeight: 800,
        }}>
          ARMADA POD
        </div>
        {/* Wheels */}
        <div style={{ position: 'absolute', left: `calc(${distDeploy * 55}% + 30px)`, top: 110, width: 16, height: 16, borderRadius: '50%', background: '#333', border: '2px solid #555' }} />
        <div style={{ position: 'absolute', left: `calc(${distDeploy * 55}% + 130px)`, top: 110, width: 16, height: 16, borderRadius: '50%', background: '#333', border: '2px solid #555' }} />
        {/* Power connection spark */}
        {distDeploy > 0.9 && (
          <div style={{ position: 'absolute', right: 50, top: 65, width: 16, height: 16, borderRadius: '50%', background: C.teal, boxShadow: `0 0 30px ${C.teal}` }} />
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'inline-block', padding: '12px 28px', border: `3px solid ${C.teal}`, borderRadius: 12, opacity: distDeploy > 0.9 ? 1 : 0 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: C.teal }}>DEPLOYED IN WEEKS</span>
        </div>
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <SplitFrame left={left} right={right} />
    </AbsoluteFill>
  );
}

// ─── Scene 4: Reliability (0:26-0:36) ─────────────────────────────────────────
function Reliability() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const failFrame = 60;
  const failed = frame >= failFrame;
  const recovery = interpolate(frame, [failFrame + 30, failFrame + 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const leftFail = failed && frame < failFrame + 120;
  const leftRecovery = interpolate(frame, [failFrame + 60, failFrame + 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const left = (
    <div style={{ background: '#080808', height: '100%', padding: '60px 50px', fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#555', letterSpacing: 4, marginBottom: 20 }}>TRADITIONAL</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#888', marginBottom: 30 }}>Reliability</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <div style={{
          width: 180, height: 180, borderRadius: 24,
          background: leftFail ? 'rgba(204,51,51,0.3)' : 'rgba(255,255,255,0.05)',
          border: `3px solid ${leftFail ? '#cc3333' : '#333'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: 48, color: leftFail ? '#cc3333' : '#666' }}>
            {leftFail ? '\u26A0' : '\uD83C\uDFE2'}
          </div>
          <div style={{ fontSize: 18, color: leftFail ? '#cc3333' : '#666', marginTop: 12, fontWeight: 700 }}>
            {leftFail ? 'OFFLINE' : '500 MW'}
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 30 }}>
        {leftFail && (
          <div style={{ fontSize: 24, fontWeight: 800, color: '#cc3333' }}>
            100% CAPACITY OFFLINE
          </div>
        )}
        {leftRecovery > 0 && (
          <div style={{ fontSize: 18, color: '#666', marginTop: 12, opacity: leftRecovery }}>
            Backup generator: 72-hour fuel supply
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 30, fontSize: 20, color: '#555', fontWeight: 600 }}>
        Single point of failure
      </div>
    </div>
  );

  const networkDots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const x = 240 + Math.cos(a) * 150;
    const y = 320 + Math.sin(a) * 150;
    const isFailed = failed && (i === 3 || i === 7);
    const isRecovered = isFailed && recovery > 0.8;
    return { x, y, isFailed, isRecovered };
  });

  const right = (
    <div style={{ background: '#040810', height: '100%', padding: '60px 50px', fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, letterSpacing: 4, marginBottom: 20 }}>DISTRIBUTED</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 10 }}>Reliability</div>
      <svg width={480} height={480} style={{ margin: '0 auto', display: 'block' }}>
        {networkDots.map((d, i) => {
          const next = networkDots[(i + 1) % networkDots.length];
          return <line key={i} x1={d.x} y1={d.y} x2={next.x} y2={next.y} stroke={C.teal} strokeWidth={1.5} opacity={0.2} />;
        })}
        {/* Cross connections */}
        {networkDots.map((d, i) => {
          const across = networkDots[(i + 4) % networkDots.length];
          return <line key={`x${i}`} x1={d.x} y1={d.y} x2={across.x} y2={across.y} stroke={C.teal} strokeWidth={0.5} opacity={0.1} />;
        })}
        {networkDots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={14}
            fill={d.isFailed && !d.isRecovered ? '#cc3333' : C.teal}
            opacity={d.isFailed && !d.isRecovered ? 0.5 : 0.8}
          />
        ))}
        <circle cx={240} cy={320} r={28} fill={C.bg2} stroke={C.teal} strokeWidth={3} />
        <text x={240} y={326} fill={C.white} fontSize={14} fontWeight={800} textAnchor="middle" fontFamily={FONT}>HUB</text>
      </svg>
      {failed && (
        <div style={{ textAlign: 'center', marginTop: -20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.teal }}>
            {recovery < 0.8 ? '2 NODES OFFLINE — LOAD REDISTRIBUTED' : 'NETWORK HEALED — ALL NODES ONLINE'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: C.teal, marginTop: 8 }}>99.999% UPTIME</div>
          <div style={{ fontSize: 18, color: C.lilac }}>No backup generators needed</div>
        </div>
      )}
    </div>
  );

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <SplitFrame left={left} right={right} />
    </AbsoluteFill>
  );
}

// ─── Scene 5: Time to Revenue (0:36-0:46) ─────────────────────────────────────
function TimeToRevenue() {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const progress = interpolate(frame, [0, 250], [0, 1], { extrapolateRight: 'clamp' });

  const tradRevenue = (x: number) => x > 0.7 ? (x - 0.7) * 3 : 0;
  const distRevenue = (x: number) => x > 0.15 ? Math.pow((x - 0.15) / 0.85, 1.5) : 0;

  const chartW = 500;
  const chartH = 350;

  const left = (
    <div style={{ background: '#080808', height: '100%', padding: '60px 40px', fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#555', letterSpacing: 4, marginBottom: 20 }}>TRADITIONAL</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#888', marginBottom: 24 }}>Time to Revenue</div>
      <svg width={chartW} height={chartH}>
        <line x1={50} y1={chartH - 40} x2={chartW} y2={chartH - 40} stroke="#333" strokeWidth={2} />
        <line x1={50} y1={0} x2={50} y2={chartH - 40} stroke="#333" strokeWidth={2} />
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1={50} y1={chartH - 40 - p * (chartH - 50)} x2={chartW} y2={chartH - 40 - p * (chartH - 50)} stroke="#1a1a1a" strokeWidth={1} />
        ))}
        <path
          d={Array.from({ length: 60 }, (_, i) => {
            const t = (i / 59) * progress;
            const x = 50 + (i / 59) * (chartW - 60);
            const y = chartH - 40 - tradRevenue(t) * (chartH - 50);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ')}
          fill="none" stroke="#cc3333" strokeWidth={3}
        />
        {/* Area fill */}
        <path
          d={Array.from({ length: 60 }, (_, i) => {
            const t = (i / 59) * progress;
            const x = 50 + (i / 59) * (chartW - 60);
            const y = chartH - 40 - tradRevenue(t) * (chartH - 50);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ') + ` L${50 + (chartW - 60)},${chartH - 40} L50,${chartH - 40} Z`}
          fill="#cc333310"
        />
        {['2025', '2028', '2031'].map((y, i) => (
          <text key={y} x={50 + i * ((chartW - 60) / 2)} y={chartH - 15} fill="#555" fontSize={16} fontFamily={FONT} fontWeight={600}>{y}</text>
        ))}
      </svg>
      <div style={{ marginTop: 16, fontSize: 24, fontWeight: 800, color: '#cc3333' }}>
        FIRST REVENUE: YEAR 5-7
      </div>
    </div>
  );

  const right = (
    <div style={{ background: '#040810', height: '100%', padding: '60px 40px', fontFamily: FONT }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.teal, letterSpacing: 4, marginBottom: 20 }}>DISTRIBUTED</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.white, marginBottom: 24 }}>Time to Revenue</div>
      <svg width={chartW} height={chartH}>
        <line x1={50} y1={chartH - 40} x2={chartW} y2={chartH - 40} stroke="#333" strokeWidth={2} />
        <line x1={50} y1={0} x2={50} y2={chartH - 40} stroke="#333" strokeWidth={2} />
        {[0.25, 0.5, 0.75].map(p => (
          <line key={p} x1={50} y1={chartH - 40 - p * (chartH - 50)} x2={chartW} y2={chartH - 40 - p * (chartH - 50)} stroke="#1a1a1a" strokeWidth={1} />
        ))}
        <path
          d={Array.from({ length: 60 }, (_, i) => {
            const t = (i / 59) * progress;
            const x = 50 + (i / 59) * (chartW - 60);
            const y = chartH - 40 - distRevenue(t) * (chartH - 50);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ')}
          fill="none" stroke={C.teal} strokeWidth={3}
        />
        <path
          d={Array.from({ length: 60 }, (_, i) => {
            const t = (i / 59) * progress;
            const x = 50 + (i / 59) * (chartW - 60);
            const y = chartH - 40 - distRevenue(t) * (chartH - 50);
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
          }).join(' ') + ` L${50 + (chartW - 60)},${chartH - 40} L50,${chartH - 40} Z`}
          fill={`${C.teal}10`}
        />
        {['2025', '2027', '2028+'].map((y, i) => (
          <text key={y} x={50 + i * ((chartW - 60) / 2)} y={chartH - 15} fill={C.lilac} fontSize={16} fontFamily={FONT} fontWeight={600}>{y}</text>
        ))}
        {progress > 0.25 && <text x={170} y={chartH - 120} fill={C.teal} fontSize={18} fontWeight={800} fontFamily={FONT}>$39M</text>}
        {progress > 0.5 && <text x={270} y={chartH - 180} fill={C.teal} fontSize={18} fontWeight={800} fontFamily={FONT}>$156M</text>}
        {progress > 0.8 && <text x={370} y={chartH - 260} fill={C.teal} fontSize={22} fontWeight={900} fontFamily={FONT}>$780M+</text>}
      </svg>
      <div style={{ marginTop: 16, fontSize: 24, fontWeight: 800, color: C.teal }}>
        FIRST REVENUE: MONTHS
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <SplitFrame left={left} right={right} />
    </AbsoluteFill>
  );
}

// ─── Scene 6: The Verdict (0:46-0:56) ─────────────────────────────────────────
function TheVerdict() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const crumble = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
  const rightExpand = interpolate(frame, [30, 90], [50, 100], { extrapolateRight: 'clamp' });

  const stats = [
    { n: '42 sites', delay: 80 },
    { n: '348 MW', delay: 95 },
    { n: '3 states', delay: 110 },
    { n: 'Months to deploy', delay: 125 },
    { n: '$780K/MW/year', delay: 140 },
    { n: '99.999% uptime', delay: 155 },
  ];

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, opacity: fadeIn }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', opacity: 1 - crumble, filter: `blur(${crumble * 10}px)`, background: '#080808' }} />
      <div style={{ position: 'absolute', left: `${100 - rightExpand}%`, top: 0, width: `${rightExpand}%`, height: '100%', background: C.bg }}>
        {/* Background gradient */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, ${C.eggplant}30 0%, transparent 60%)` }} />
        <div style={{ padding: 80, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 20, color: C.teal, fontWeight: 700, letterSpacing: 4 }}>THE VERDICT</div>
            <div style={{ fontSize: 40, color: C.white, fontWeight: 800, marginTop: 8 }}>Distributed wins.</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginTop: 40 }}>
            {stats.map(s => {
              const op = spring({ frame: frame - s.delay, fps, config: { damping: 12 } });
              return (
                <div key={s.n} style={{
                  padding: '20px 40px', borderRadius: 16,
                  background: `${C.teal}10`, border: `2px solid ${C.teal}30`,
                  opacity: op, transform: `scale(${op})`,
                }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: C.white }}>{s.n}</span>
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
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const logoSc = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const tagOp = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [520, 570], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${C.bg2} 0%, ${C.bg} 70%)`, fontFamily: FONT, justifyContent: 'center', alignItems: 'center', opacity: fadeIn * fadeOut }}>
      {/* Network dots */}
      <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.12 }}>
        {UPPER_MIDWEST_SITES.map((site, i) => {
          const p = siteProj(site);
          const pulse = Math.sin(frame * 0.04 + i * 0.7) * 0.3 + 0.7;
          return <circle key={i} cx={p.x} cy={p.y} r={(4 + Math.sqrt(site.capacityMW)) * pulse} fill={stateColor(site.state)} />;
        })}
      </svg>
      <div style={{ transform: `scale(${logoSc})`, zIndex: 10 }}>
        <NodiacLogo width={450} />
      </div>
      <div style={{ position: 'absolute', bottom: 240, left: 0, right: 0, textAlign: 'center', opacity: tagOp, zIndex: 10 }}>
        <div style={{ fontSize: 30, fontWeight: 600, color: C.white }}>Distributed Power Infrastructure for AI Compute</div>
      </div>
      <div style={{ position: 'absolute', bottom: 100, left: 0, right: 0, textAlign: 'center', opacity: tagOp, zIndex: 10 }}>
        <div style={{ fontSize: 22, color: C.lilac, letterSpacing: 4 }}>NODIAC.AI</div>
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
