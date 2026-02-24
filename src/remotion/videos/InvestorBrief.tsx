// Video 5: "60-Second Investor Brief" — Numbers-Only Pitch
// 60 seconds. Corporate-minimal. Kinetic typography on eggplant. Bloomberg meets Sequoia.
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
import { C, FONT, NodiacLogo, Subtitles, type SubSegment } from '../shared';

const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
const TOTAL_CAP = Math.round(UPPER_MIDWEST_SITES.reduce((s, si) => s + si.capacityMW, 0));

// ─── Shared slide background ─────────────────────────────────────────────────
function SlideBackground({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(170deg, ${C.multiply} 0%, ${C.eggplant} 40%, ${C.multiply} 100%)`,
      fontFamily: FONT,
    }}>
      {/* Subtle grid lines */}
      <svg width="1920" height="1080" style={{ position: 'absolute', opacity: 0.04 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <line key={`v${i}`} x1={i * 96} y1={0} x2={i * 96} y2={1080} stroke={C.teal} strokeWidth={0.5} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 90} x2={1920} y2={i * 90} stroke={C.teal} strokeWidth={0.5} />
        ))}
      </svg>
      {children}
    </AbsoluteFill>
  );
}

// ─── Scene 1: The One-Liner (0:00-0:06) ────────────────────────────────────────
function TheOneLiner() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSc = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const lineOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const underlineW = interpolate(frame, [50, 90], [0, 100], { extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1) });

  return (
    <SlideBackground>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ transform: `scale(${logoSc})` }}>
          <NodiacLogo width={350} />
        </div>
        <div style={{ marginTop: 60, opacity: lineOp, textAlign: 'center', maxWidth: 1000 }}>
          <div style={{ fontSize: 36, fontWeight: 600, color: C.white, lineHeight: 1.4 }}>
            Distributed power infrastructure
            <br />
            <span style={{ color: C.teal }}>for AI compute.</span>
          </div>
          <div style={{ width: `${underlineW}%`, height: 2, background: C.teal, margin: '20px auto 0', opacity: 0.5 }} />
        </div>
      </div>
    </SlideBackground>
  );
}

// ─── Scene 2: The Problem (0:06-0:14) ───────────────────────────────────────────
function TheProblem() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stats = [
    { label: 'AI COMPUTE DEMAND BY 2030', value: '100+ GW', color: C.teal, delay: 0 },
    { label: 'INTERCONNECTION QUEUE', value: '5+ years', color: '#ff6666', delay: 15 },
    { label: 'DELAYED DATA CENTER CAPEX', value: '$98B', color: '#ff6666', delay: 30 },
    { label: 'CURTAILED RENEWABLE MWh/YEAR', value: '20M', color: C.orchid, delay: 45 },
  ];

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <SlideBackground>
      <div style={{ position: 'absolute', top: 100, left: 140 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 4, opacity: headerOp }}>THE PROBLEM</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.white, marginTop: 8, opacity: headerOp }}>
          AI&apos;s bottleneck isn&apos;t chips.
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#ff6666', opacity: headerOp }}>
          It&apos;s speed to power.
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 100, left: 140, right: 140, display: 'flex', gap: 30 }}>
        {stats.map((s) => {
          const sc = spring({ frame: frame - s.delay - 30, fps, config: { damping: 12 } });
          return (
            <div key={s.label} style={{
              flex: 1, padding: '24px 20px', borderRadius: 12,
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
              opacity: sc, transform: `translateY(${(1 - sc) * 20}px)`,
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.lilac, marginTop: 8, letterSpacing: 1 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </SlideBackground>
  );
}

// ─── Scene 3: The Thesis (0:14-0:22) ────────────────────────────────────────────
function TheThesis() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { icon: '\u26A1', text: 'Deploy compute where power already exists', delay: 20 },
    { icon: '\uD83C\uDF31', text: 'Collocate with renewable energy sites (IPPs)', delay: 40 },
    { icon: '\u23F1', text: 'Energize in months, not years', delay: 60 },
    { icon: '\uD83D\uDD04', text: 'Repeatable across hundreds of sites', delay: 80 },
  ];

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const quoteOp = interpolate(frame, [140, 160], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <SlideBackground>
      <div style={{ position: 'absolute', top: 100, left: 140 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 4, opacity: headerOp }}>THE THESIS</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.white, marginTop: 8, opacity: headerOp }}>
          Bring the load to the generation.
        </div>
      </div>

      <div style={{ position: 'absolute', top: 240, left: 140, right: 140 }}>
        {steps.map((s) => {
          const op = spring({ frame: frame - s.delay, fps, config: { damping: 12 } });
          return (
            <div key={s.text} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              marginBottom: 24, opacity: op, transform: `translateX(${(1 - op) * 40}px)`,
            }}>
              <div style={{ fontSize: 28, width: 48, textAlign: 'center' }}>{s.icon}</div>
              <div style={{ fontSize: 22, color: C.white, fontWeight: 500 }}>{s.text}</div>
            </div>
          );
        })}
      </div>

      {/* CEO Quote */}
      <div style={{ position: 'absolute', bottom: 100, left: 140, right: 300, opacity: quoteOp }}>
        <div style={{ fontSize: 16, color: C.orchid, fontStyle: 'italic', lineHeight: 1.6 }}>
          &ldquo;AI is becoming the backbone of our economy, yet at the same time is running
          into a brick wall of power constraints. Nodiac is the bridge.&rdquo;
        </div>
        <div style={{ fontSize: 13, color: C.lilac, marginTop: 8 }}>
          &mdash; Robert Sher, CEO &bull; Co-founder, Greenbacker ($3B AUM)
        </div>
      </div>
    </SlideBackground>
  );
}

// ─── Scene 4: The Portfolio (0:22-0:30) ─────────────────────────────────────────
function ThePortfolio() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  const stateData = [
    { abbr: 'MN', sites: 23, mw: 180, color: C.mn, delay: 20 },
    { abbr: 'IA', sites: 4, mw: 132, color: C.ia, delay: 35 },
    { abbr: 'WI', sites: 15, mw: 35, color: C.wi, delay: 50 },
  ];

  const totalOp = spring({ frame: frame - 100, fps, config: { damping: 12 } });
  const pilotOp = interpolate(frame, [140, 160], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <SlideBackground>
      <div style={{ position: 'absolute', top: 100, left: 140 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 4, opacity: headerOp }}>UPPER MIDWEST REGIONAL HUB</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.white, marginTop: 8, opacity: headerOp }}>
          First hub. {TOTAL_SITES} sites. {TOTAL_CAP} MW.
        </div>
      </div>

      {/* State breakdown bars */}
      <div style={{ position: 'absolute', top: 260, left: 140, right: 140 }}>
        {stateData.map((s) => {
          const barW = spring({ frame: frame - s.delay, fps, config: { damping: 15, mass: 0.8 } });
          const maxMW = 180;
          return (
            <div key={s.abbr} style={{ marginBottom: 28, opacity: barW }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 22, fontWeight: 700, color: C.white }}>{s.abbr}</span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 600, color: s.color }}>
                  {s.sites} sites &bull; {s.mw} MW
                </span>
              </div>
              <div style={{ height: 20, borderRadius: 6, background: 'rgba(0,0,0,0.4)' }}>
                <div style={{
                  height: '100%', borderRadius: 6,
                  background: `linear-gradient(90deg, ${s.color}, ${s.color}80)`,
                  width: `${(s.mw / maxMW) * 100 * barW}%`,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div style={{ position: 'absolute', bottom: 180, left: 140, display: 'flex', gap: 60, opacity: totalOp }}>
        <div>
          <div style={{ fontSize: 56, fontWeight: 900, color: C.teal }}>{TOTAL_SITES}</div>
          <div style={{ fontSize: 14, color: C.lilac, letterSpacing: 2 }}>TOTAL SITES</div>
        </div>
        <div>
          <div style={{ fontSize: 56, fontWeight: 900, color: C.orchid }}>{TOTAL_CAP}</div>
          <div style={{ fontSize: 14, color: C.lilac, letterSpacing: 2 }}>MW CAPACITY</div>
        </div>
        <div>
          <div style={{ fontSize: 56, fontWeight: 900, color: C.white }}>3</div>
          <div style={{ fontSize: 14, color: C.lilac, letterSpacing: 2 }}>STATES</div>
        </div>
      </div>

      {/* Pilots */}
      <div style={{ position: 'absolute', bottom: 80, left: 140, right: 140, opacity: pilotOp }}>
        <div style={{ fontSize: 15, color: C.lilac }}>
          Pilot sites at <span style={{ color: C.teal, fontWeight: 600 }}>Hay River</span> and <span style={{ color: C.teal, fontWeight: 600 }}>Walleye</span> (WI) in active development with Dunn Energy Cooperative.
        </div>
      </div>
    </SlideBackground>
  );
}

// ─── Scene 5: The Business Model (0:30-0:38) ────────────────────────────────────
function TheBusinessModel() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  const metrics = [
    { label: 'REVENUE / MW / YEAR', value: '$780K', color: C.teal, delay: 20 },
    { label: 'OPEX / MW / YEAR', value: '$80K', color: C.lilac, delay: 35 },
    { label: 'EBITDA / MW / YEAR', value: '$700K', color: C.orchid, delay: 50 },
    { label: 'BUILD COST / MW', value: '$800K', color: C.white, delay: 65 },
  ];

  const modelOp = interpolate(frame, [120, 140], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <SlideBackground>
      <div style={{ position: 'absolute', top: 100, left: 140 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 4, opacity: headerOp }}>UNIT ECONOMICS</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.white, marginTop: 8, opacity: headerOp }}>
          Triple-net lease. Stable EBITDA.
        </div>
      </div>

      <div style={{ position: 'absolute', top: 240, left: 140, right: 140, display: 'flex', gap: 30 }}>
        {metrics.map((m) => {
          const sc = spring({ frame: frame - m.delay, fps, config: { damping: 12 } });
          return (
            <div key={m.label} style={{
              flex: 1, padding: '32px 24px', borderRadius: 16,
              background: 'rgba(0,0,0,0.3)', border: `1px solid ${m.color}20`,
              textAlign: 'center', opacity: sc, transform: `translateY(${(1 - sc) * 30}px)`,
            }}>
              <div style={{ fontSize: 40, fontWeight: 900, color: m.color, fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</div>
              <div style={{ fontSize: 11, color: C.lilac, marginTop: 12, letterSpacing: 1 }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {/* Model description */}
      <div style={{ position: 'absolute', bottom: 120, left: 140, right: 140, opacity: modelOp }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 60 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.white }}>Contract Structure</div>
            <div style={{ fontSize: 13, color: C.lilac, marginTop: 4 }}>5-10 year MSAs &bull; Tier-1 counterparty</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.white }}>Revenue Model</div>
            <div style={{ fontSize: 13, color: C.lilac, marginTop: 4 }}>Monthly flat rate &bull; $/MW/month</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.white }}>Deployment</div>
            <div style={{ fontSize: 13, color: C.lilac, marginTop: 4 }}>Armada modular pods &bull; Trailer-mounted</div>
          </div>
        </div>
      </div>
    </SlideBackground>
  );
}

// ─── Scene 6: The Scaling Plan (0:38-0:48) ──────────────────────────────────────
function TheScalingPlan() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headerOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  const milestones = [
    { year: 'Q4 2026', mw: '50 MW', rev: '$39M ARR', pct: 0.05, color: C.teal, delay: 20 },
    { year: '2027', mw: '200 MW', rev: '$156M ARR', pct: 0.2, color: C.orchid, delay: 40 },
    { year: '2028+', mw: '1 GW+', rev: '$780M+ ARR', pct: 1, color: C.teal, delay: 60 },
  ];

  const diffOp = interpolate(frame, [180, 200], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <SlideBackground>
      <div style={{ position: 'absolute', top: 100, left: 140 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.teal, letterSpacing: 4, opacity: headerOp }}>SCALING ROADMAP</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: C.white, marginTop: 8, opacity: headerOp }}>
          From pilot to gigawatt.
        </div>
      </div>

      <div style={{ position: 'absolute', top: 240, left: 140, right: 140 }}>
        {milestones.map((m) => {
          const barW = spring({ frame: frame - m.delay, fps, config: { damping: 15, mass: 0.8 } });
          return (
            <div key={m.year} style={{ marginBottom: 40, opacity: barW }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: C.white }}>{m.year}</span>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.mw}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: C.lilac }}>{m.rev}</span>
                </div>
              </div>
              <div style={{ height: 24, borderRadius: 8, background: 'rgba(0,0,0,0.4)' }}>
                <div style={{
                  height: '100%', borderRadius: 8,
                  background: `linear-gradient(90deg, ${m.color}, ${m.color}60)`,
                  width: `${m.pct * 100 * barW}%`,
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Differentiators */}
      <div style={{ position: 'absolute', bottom: 80, left: 140, right: 140, display: 'flex', gap: 20, opacity: diffOp }}>
        {[
          'Faster to market',
          'Cleaner compute',
          'Lower grid burden',
          'Repeatable deployments',
        ].map(t => (
          <div key={t} style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: `${C.teal}10`, border: `1px solid ${C.teal}20`, textAlign: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.teal }}>{t}</span>
          </div>
        ))}
      </div>
    </SlideBackground>
  );
}

// ─── Scene 7: The Close / CTA (0:48-1:00) ───────────────────────────────────────
function InvestorCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoSc = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const teamOp = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const tagOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' });
  const urlOp = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [320, 360], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <SlideBackground>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: fadeOut }}>
        <div style={{ transform: `scale(${logoSc})` }}>
          <NodiacLogo width={450} />
        </div>

        {/* Team credibility */}
        <div style={{ marginTop: 50, opacity: teamOp, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.orchid }}>
            Built by the team behind Greenbacker ($3B AUM)
          </div>
          <div style={{ fontSize: 14, color: C.lilac, marginTop: 8 }}>
            20+ years in renewable energy development &bull; Google &bull; Invenergy
          </div>
        </div>

        <div style={{ marginTop: 40, opacity: tagOp, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 600, color: C.white }}>
            The fastest path to distributed AI compute
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: C.teal }}>
            in the Upper Midwest.
          </div>
        </div>

        <div style={{ marginTop: 50, opacity: urlOp }}>
          <div style={{ fontSize: 22, color: C.lilac, letterSpacing: 4 }}>NODIAC.AI</div>
        </div>
      </div>
    </SlideBackground>
  );
}

// ─── Voiceover Script ──────────────────────────────────────────────────────────
const SUBS: SubSegment[] = [
  { start: 0, end: 3, text: '' },
  { start: 3, end: 6, text: 'Nodiac. Distributed power infrastructure for AI compute.' },
  { start: 6, end: 10, text: "AI's bottleneck is not chips. It is speed to power." },
  { start: 10, end: 14, text: '100 gigawatts of demand. 5-year queues. 98 billion in delayed projects.' },
  { start: 14, end: 18, text: 'Nodiac deploys compute where power already exists.' },
  { start: 18, end: 22, text: 'Collocated with renewable energy sites. Energized in months, not years.' },
  { start: 22, end: 26, text: 'Upper Midwest Regional Hub: 42 sites across Minnesota, Iowa, and Wisconsin.' },
  { start: 26, end: 30, text: '348 megawatts. Pilots at Hay River and Walleye in active development.' },
  { start: 30, end: 34, text: '$780K revenue per megawatt per year. $700K EBITDA. Triple-net lease.' },
  { start: 34, end: 38, text: '5 to 10 year contracts with Tier-1 hyperscaler counterparties.' },
  { start: 38, end: 42, text: '50 megawatts by Q4 2026. 200 megawatts by 2027.' },
  { start: 42, end: 46, text: 'Over a gigawatt by 2028. 780 million dollars in annual recurring revenue.' },
  { start: 46, end: 50, text: 'Faster to market. Cleaner compute. Lower grid burden. Repeatable deployments.' },
  { start: 50, end: 54, text: 'Built by the team behind Greenbacker — 3 billion in renewable assets under management.' },
  { start: 54, end: 58, text: 'The fastest path to distributed AI compute in the Upper Midwest.' },
  { start: 58, end: 60, text: '' },
];

// ─── Main Composition ──────────────────────────────────────────────────────────
export const InvestorBrief: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.multiply }}>
      <Sequence from={0} durationInFrames={180}><TheOneLiner /></Sequence>
      <Sequence from={180} durationInFrames={240}><TheProblem /></Sequence>
      <Sequence from={420} durationInFrames={240}><TheThesis /></Sequence>
      <Sequence from={660} durationInFrames={240}><ThePortfolio /></Sequence>
      <Sequence from={900} durationInFrames={240}><TheBusinessModel /></Sequence>
      <Sequence from={1140} durationInFrames={300}><TheScalingPlan /></Sequence>
      <Sequence from={1440} durationInFrames={360}><InvestorCTA /></Sequence>
      <Subtitles segments={SUBS} />
    </AbsoluteFill>
  );
};

export const INVESTOR_BRIEF_DURATION = 1800; // 60 seconds
