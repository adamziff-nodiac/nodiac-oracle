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
import {
  UPPER_MIDWEST_SITES,
  COLORS,
  TRANSCRIPT_SEGMENTS,
  TOTAL_SITES,
  MN_SITES,
  IA_SITES,
  WI_SITES,
  PILOT_SITES,
  REGION_CENTER,
  type Site,
} from './data';

const FPS = 30;
const TOTAL_CAPACITY = Math.round(
  UPPER_MIDWEST_SITES.reduce((s, site) => s + site.capacityMW, 0)
);

// --- Utility: project lat/lng to x/y on screen ---
function projectSite(
  site: Site,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  viewport: { x: number; y: number; w: number; h: number }
) {
  const xPct = (site.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng);
  const yPct = 1 - (site.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
  return {
    x: viewport.x + xPct * viewport.w,
    y: viewport.y + yPct * viewport.h,
  };
}

const REGION_BOUNDS = {
  minLat: 41.5,
  maxLat: 46.0,
  minLng: -96.5,
  maxLng: -87.5,
};

const MAP_VIEWPORT = { x: 100, y: 120, w: 1720, h: 840 };

function siteColor(state: string) {
  if (state === 'MN') return COLORS.mn;
  if (state === 'IA') return COLORS.ia;
  return COLORS.wi;
}

// =============================================================================
// Scene 1: Logo Reveal
// =============================================================================
function LogoReveal() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const taglineOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [30, 50], [20, 0], { extrapolateRight: 'clamp' });
  const glowIntensity = interpolate(frame, [0, 60, 90], [0, 30, 15]);

  // Particle effect
  const particles = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2;
    const delay = i * 2;
    const progress = interpolate(frame, [delay, delay + 40], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const radius = progress * 300;
    const opacity = interpolate(progress, [0, 0.3, 1], [0, 0.8, 0]);
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, opacity, size: 2 + Math.random() * 3 };
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${COLORS.multiply} 0%, ${COLORS.darkBg} 70%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: COLORS.neonTeal,
            opacity: p.opacity,
            filter: `blur(${p.size * 0.5}px)`,
          }}
        />
      ))}

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: 'center',
          filter: `drop-shadow(0 0 ${glowIntensity}px ${COLORS.neonTeal})`,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            background: `linear-gradient(135deg, ${COLORS.eggplant}, ${COLORS.neonTeal})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: `0 0 60px ${COLORS.eggplant}80`,
          }}
        >
          <span style={{ color: 'white', fontSize: 64, fontWeight: 800, fontFamily: 'Inter, system-ui, sans-serif' }}>
            N
          </span>
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          NODIAC
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 26,
          color: COLORS.neonTeal,
          fontWeight: 600,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Distributed Power Infrastructure for AI Compute
      </div>
    </AbsoluteFill>
  );
}

// =============================================================================
// Scene 2: Problem Statement
// =============================================================================
function ProblemStatement() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1 = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const line1Y = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: 'clamp' });
  const line2 = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: 'clamp' });
  const line2Y = interpolate(frame, [30, 50], [40, 0], { extrapolateRight: 'clamp' });
  const statOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp' });

  // Animated grid lines in background
  const gridProgress = interpolate(frame, [0, 120], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: COLORS.darkBg,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Subtle grid */}
      <svg
        width="1920"
        height="1080"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.06 }}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={i * 54}
            x2={1920 * gridProgress}
            y2={i * 54}
            stroke={COLORS.neonTeal}
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 36 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * 54}
            y1="0"
            x2={i * 54}
            y2={1080 * gridProgress}
            stroke={COLORS.neonTeal}
            strokeWidth="1"
          />
        ))}
      </svg>

      <div style={{ textAlign: 'center', maxWidth: 1200 }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            opacity: line1,
            transform: `translateY(${line1Y}px)`,
            marginBottom: 20,
          }}
        >
          AI&apos;s bottleneck isn&apos;t chips.
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: COLORS.neonTeal,
            opacity: line2,
            transform: `translateY(${line2Y}px)`,
            marginBottom: 60,
          }}
        >
          It&apos;s speed to power.
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 80,
            justifyContent: 'center',
            opacity: statOpacity,
          }}
        >
          {[
            { num: '100+ GW', label: 'Global AI demand by 2030' },
            { num: '5+ years', label: 'Interconnection queue' },
            { num: '$98B', label: 'In delayed data centers' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: COLORS.neonTeal }}>
                {stat.num}
              </div>
              <div style={{ fontSize: 18, color: COLORS.dustyLilac, marginTop: 8 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =============================================================================
// Scene 3: Solution + Map Zoom
// =============================================================================
function SolutionMapZoom() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });

  // Map zoom effect: start with US overview, zoom to Upper Midwest
  const mapScale = interpolate(frame, [40, 100], [1, 2.8], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
  const mapX = interpolate(frame, [40, 100], [0, 280], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
  const mapY = interpolate(frame, [40, 100], [0, -100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // State outlines appear
  const statesOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Region highlight
  const regionGlow = interpolate(frame, [90, 120], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.darkBg,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Stylized map background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${mapScale}) translate(${mapX}px, ${mapY}px)`,
          transformOrigin: 'center center',
        }}
      >
        {/* US outline (simplified) */}
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute' }}>
          {/* Grid dots for US map feel */}
          {Array.from({ length: 50 }, (_, row) =>
            Array.from({ length: 90 }, (_, col) => {
              const x = col * 21 + 10;
              const y = row * 21 + 10;
              // Rough US shape mask
              const inUS =
                x > 200 && x < 1700 && y > 200 && y < 850 &&
                !(x > 1400 && y < 350) && !(x < 400 && y > 700);
              if (!inUS) return null;
              return (
                <circle
                  key={`${row}-${col}`}
                  cx={x}
                  cy={y}
                  r={1.5}
                  fill={COLORS.dustyLilac}
                  opacity={0.3}
                />
              );
            })
          )}

          {/* Upper Midwest region highlight */}
          <ellipse
            cx={850}
            cy={380}
            rx={180}
            ry={140}
            fill={COLORS.neonTeal}
            opacity={regionGlow * 0.15}
            filter="url(#glow)"
          />
          <ellipse
            cx={850}
            cy={380}
            rx={180}
            ry={140}
            fill="none"
            stroke={COLORS.neonTeal}
            strokeWidth={2}
            opacity={statesOpacity}
            strokeDasharray="8 4"
          />

          {/* State labels */}
          <text x={800} y={340} fill={COLORS.neonTeal} fontSize={16} fontWeight={700} opacity={statesOpacity}>
            MN
          </text>
          <text x={870} y={420} fill={COLORS.ia} fontSize={16} fontWeight={700} opacity={statesOpacity}>
            IA
          </text>
          <text x={920} y={370} fill={COLORS.wi} fontSize={16} fontWeight={700} opacity={statesOpacity}>
            WI
          </text>

          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="20" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: 'white',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          Bring the load to the generation.
        </div>
        <div
          style={{
            fontSize: 24,
            color: COLORS.softOrchid,
            opacity: subtitleOpacity,
            marginTop: 12,
          }}
        >
          Deploy AI compute where power already exists.
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =============================================================================
// Scene 4: Regional Hub Map - Sites lighting up
// =============================================================================
function RegionalHubMap() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Sites light up one by one
  const sitesPerFrame = 3; // ~3 sites every few frames
  const siteStartFrame = 20;
  const sortedSites = [...UPPER_MIDWEST_SITES].sort((a, b) => b.lat - a.lat); // north to south

  // State boundaries (simplified paths for MN, IA, WI)
  const statePathOpacity = interpolate(frame, [0, 20], [0, 0.4], { extrapolateRight: 'clamp' });

  // Counter animation
  const visibleSiteCount = Math.min(
    TOTAL_SITES,
    Math.max(0, Math.floor((frame - siteStartFrame) / 3))
  );
  const visibleCapacity = sortedSites
    .slice(0, visibleSiteCount)
    .reduce((s, site) => s + site.capacityMW, 0);

  // Pulse effect for hub radius
  const pulsePhase = (frame % 60) / 60;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${COLORS.darkBg2} 0%, ${COLORS.darkBg} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 80,
          opacity: titleOpacity,
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 18, color: COLORS.neonTeal, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>
          Upper Midwest Regional Hub
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, color: 'white', marginTop: 4 }}>
          Minnesota &bull; Iowa &bull; Wisconsin
        </div>
      </div>

      {/* Stats panel */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 80,
          textAlign: 'right',
          opacity: titleOpacity,
          zIndex: 10,
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 800, color: COLORS.neonTeal }}>
          {visibleSiteCount}
          <span style={{ fontSize: 20, color: COLORS.dustyLilac, marginLeft: 8 }}>sites</span>
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>
          {Math.round(visibleCapacity)}
          <span style={{ fontSize: 18, color: COLORS.dustyLilac, marginLeft: 8 }}>MW</span>
        </div>
      </div>

      {/* Map area */}
      <svg width="1920" height="1080" style={{ position: 'absolute', top: 0, left: 0 }}>
        <defs>
          <filter id="siteGlow">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <radialGradient id="regionPulse">
            <stop offset="0%" stopColor={COLORS.neonTeal} stopOpacity={0.08} />
            <stop offset="100%" stopColor={COLORS.neonTeal} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* Region pulse ring */}
        <circle
          cx={960}
          cy={540}
          r={300 + pulsePhase * 100}
          fill="none"
          stroke={COLORS.neonTeal}
          strokeWidth={1}
          opacity={0.1 * (1 - pulsePhase)}
        />
        <circle
          cx={960}
          cy={540}
          r={300}
          fill="url(#regionPulse)"
          opacity={0.5}
        />

        {/* State approximate boundary lines */}
        {/* MN-WI border roughly at lng -92.3 */}
        <line
          x1={interpolate(-92.3, [REGION_BOUNDS.minLng, REGION_BOUNDS.maxLng], [MAP_VIEWPORT.x, MAP_VIEWPORT.x + MAP_VIEWPORT.w])}
          y1={MAP_VIEWPORT.y}
          x2={interpolate(-92.3, [REGION_BOUNDS.minLng, REGION_BOUNDS.maxLng], [MAP_VIEWPORT.x, MAP_VIEWPORT.x + MAP_VIEWPORT.w])}
          y2={MAP_VIEWPORT.y + MAP_VIEWPORT.h}
          stroke={COLORS.dustyLilac}
          strokeWidth={1}
          opacity={statePathOpacity}
          strokeDasharray="4 8"
        />
        {/* MN-IA / WI-IA border roughly at lat 43.5 */}
        <line
          x1={MAP_VIEWPORT.x}
          y1={interpolate(43.5, [REGION_BOUNDS.minLat, REGION_BOUNDS.maxLat], [MAP_VIEWPORT.y + MAP_VIEWPORT.h, MAP_VIEWPORT.y])}
          x2={MAP_VIEWPORT.x + MAP_VIEWPORT.w}
          y2={interpolate(43.5, [REGION_BOUNDS.minLat, REGION_BOUNDS.maxLat], [MAP_VIEWPORT.y + MAP_VIEWPORT.h, MAP_VIEWPORT.y])}
          stroke={COLORS.dustyLilac}
          strokeWidth={1}
          opacity={statePathOpacity}
          strokeDasharray="4 8"
        />

        {/* State labels on map */}
        <text
          x={interpolate(-94.5, [REGION_BOUNDS.minLng, REGION_BOUNDS.maxLng], [MAP_VIEWPORT.x, MAP_VIEWPORT.x + MAP_VIEWPORT.w])}
          y={interpolate(44.5, [REGION_BOUNDS.minLat, REGION_BOUNDS.maxLat], [MAP_VIEWPORT.y + MAP_VIEWPORT.h, MAP_VIEWPORT.y])}
          fill={COLORS.mn}
          fontSize={28}
          fontWeight={700}
          opacity={statePathOpacity * 0.6}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
        >
          MINNESOTA
        </text>
        <text
          x={interpolate(-93, [REGION_BOUNDS.minLng, REGION_BOUNDS.maxLng], [MAP_VIEWPORT.x, MAP_VIEWPORT.x + MAP_VIEWPORT.w])}
          y={interpolate(42.2, [REGION_BOUNDS.minLat, REGION_BOUNDS.maxLat], [MAP_VIEWPORT.y + MAP_VIEWPORT.h, MAP_VIEWPORT.y])}
          fill={COLORS.ia}
          fontSize={28}
          fontWeight={700}
          opacity={statePathOpacity * 0.6}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
        >
          IOWA
        </text>
        <text
          x={interpolate(-90, [REGION_BOUNDS.minLng, REGION_BOUNDS.maxLng], [MAP_VIEWPORT.x, MAP_VIEWPORT.x + MAP_VIEWPORT.w])}
          y={interpolate(44.3, [REGION_BOUNDS.minLat, REGION_BOUNDS.maxLat], [MAP_VIEWPORT.y + MAP_VIEWPORT.h, MAP_VIEWPORT.y])}
          fill={COLORS.wi}
          fontSize={28}
          fontWeight={700}
          opacity={statePathOpacity * 0.6}
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
        >
          WISCONSIN
        </text>

        {/* Connection lines between nearby sites */}
        {sortedSites.slice(0, visibleSiteCount).map((site, i) => {
          const pos = projectSite(site, REGION_BOUNDS, MAP_VIEWPORT);
          // Connect to 2 nearest visible neighbors
          const neighbors = sortedSites
            .slice(0, visibleSiteCount)
            .filter((_, j) => j !== i)
            .map((n) => ({
              ...n,
              dist: Math.hypot(n.lat - site.lat, n.lng - site.lng),
              pos: projectSite(n, REGION_BOUNDS, MAP_VIEWPORT),
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 2);

          return neighbors.map((n, ni) => (
            <line
              key={`conn-${i}-${ni}`}
              x1={pos.x}
              y1={pos.y}
              x2={n.pos.x}
              y2={n.pos.y}
              stroke={COLORS.neonTeal}
              strokeWidth={0.5}
              opacity={0.15}
            />
          ));
        })}

        {/* Site dots */}
        {sortedSites.map((site, i) => {
          const visible = i < visibleSiteCount;
          const siteFrame = siteStartFrame + i * 3;
          const appear = visible
            ? spring({ frame: frame - siteFrame, fps, config: { damping: 10, mass: 0.5 } })
            : 0;
          const pos = projectSite(site, REGION_BOUNDS, MAP_VIEWPORT);
          const color = siteColor(site.state);
          const radius = 4 + Math.sqrt(site.capacityMW) * 1.8;

          return (
            <g key={site.name}>
              {/* Glow */}
              {visible && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius * 3 * appear}
                  fill={color}
                  opacity={0.15 * appear}
                  filter="url(#siteGlow)"
                />
              )}
              {/* Dot */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius * appear}
                fill={color}
                opacity={appear}
                stroke="white"
                strokeWidth={site.isPilot ? 2 : 0.5}
                strokeOpacity={appear * 0.8}
              />
              {/* Label for larger sites */}
              {visible && site.capacityMW >= 8 && (
                <text
                  x={pos.x + radius + 6}
                  y={pos.y + 4}
                  fill="white"
                  fontSize={11}
                  fontWeight={600}
                  opacity={appear * 0.9}
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {site.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 80,
          display: 'flex',
          gap: 30,
          opacity: titleOpacity,
        }}
      >
        {[
          { color: COLORS.mn, label: `Minnesota (${MN_SITES.length})` },
          { color: COLORS.ia, label: `Iowa (${IA_SITES.length})` },
          { color: COLORS.wi, label: `Wisconsin (${WI_SITES.length})` },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
            <span style={{ color: COLORS.dustyLilac, fontSize: 14 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

// =============================================================================
// Scene 5: Pilot Sites Focus
// =============================================================================
function PilotSitesFocus() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Hay River card
  const card1 = spring({ frame: frame - 15, fps, config: { damping: 12 } });
  // Walleye card
  const card2 = spring({ frame: frame - 30, fps, config: { damping: 12 } });
  // Container illustration
  const containerOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.darkBg} 0%, ${COLORS.multiply} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: titleOpacity,
        }}
      >
        <div style={{ fontSize: 18, color: COLORS.neonTeal, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>
          Pilot Sites Under Development
        </div>
        <div style={{ fontSize: 44, fontWeight: 800, color: 'white', marginTop: 8 }}>
          First to energize. First to market.
        </div>
      </div>

      {/* Pilot site cards */}
      <div style={{ position: 'absolute', top: 220, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 60 }}>
        {/* Hay River */}
        <div
          style={{
            width: 500,
            padding: 40,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${COLORS.eggplant}40, ${COLORS.darkBg2})`,
            border: `1px solid ${COLORS.neonTeal}30`,
            transform: `translateY(${(1 - card1) * 40}px)`,
            opacity: card1,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.neonTeal, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            Anchor Site
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'white', marginTop: 8 }}>
            Hay River
          </div>
          <div style={{ fontSize: 18, color: COLORS.dustyLilac, marginTop: 4 }}>Boyceville, Wisconsin</div>
          <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.neonTeal }}>2 MW</div>
              <div style={{ fontSize: 13, color: COLORS.dustyLilac }}>Confirmed Power</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.softOrchid }}>10 MW</div>
              <div style={{ fontSize: 13, color: COLORS.dustyLilac }}>Expansion Target</div>
            </div>
          </div>
          <div style={{ marginTop: 20, fontSize: 14, color: COLORS.dustyLilac, lineHeight: 1.6 }}>
            Dunn Energy Cooperative &bull; IX application in progress
            <br />
            Strategic grid capacity &bull; Close fiber proximity
          </div>
        </div>

        {/* Walleye */}
        <div
          style={{
            width: 500,
            padding: 40,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${COLORS.eggplant}40, ${COLORS.darkBg2})`,
            border: `1px solid ${COLORS.softOrchid}30`,
            transform: `translateY(${(1 - card2) * 40}px)`,
            opacity: card2,
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.softOrchid, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
            Pilot Site
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'white', marginTop: 8 }}>
            Walleye
          </div>
          <div style={{ fontSize: 18, color: COLORS.dustyLilac, marginTop: 4 }}>Colfax, Wisconsin</div>
          <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.neonTeal }}>1.8 MW</div>
              <div style={{ fontSize: 13, color: COLORS.dustyLilac }}>Confirmed Power</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.softOrchid }}>15 MW</div>
              <div style={{ fontSize: 13, color: COLORS.dustyLilac }}>Expansion Target</div>
            </div>
          </div>
          <div style={{ marginTop: 20, fontSize: 14, color: COLORS.dustyLilac, lineHeight: 1.6 }}>
            Dunn Energy Cooperative &bull; IX application in progress
            <br />
            No substation upgrades needed &bull; Considerable headroom
          </div>
        </div>
      </div>

      {/* Modular container illustration */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: containerOpacity,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 120,
                height: 50,
                borderRadius: 6,
                background: `linear-gradient(180deg, ${COLORS.neonTeal}30, ${COLORS.eggplant}30)`,
                border: `1px solid ${COLORS.neonTeal}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: COLORS.neonTeal,
                fontWeight: 600,
              }}
            >
              ARMADA POD
            </div>
          ))}
        </div>
        <div style={{ fontSize: 16, color: COLORS.dustyLilac, marginTop: 12 }}>
          Modular compute pods on trailers &mdash; no concrete, no permitting delays
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =============================================================================
// Scene 6: Distributed Reliability
// =============================================================================
function DistributedReliability() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // SLA tiers animation
  const tier1 = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  const tier2 = spring({ frame: frame - 35, fps, config: { damping: 12 } });
  const tier3 = spring({ frame: frame - 50, fps, config: { damping: 12 } });

  // Network visualization
  const networkOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Pulsing nodes
  const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.darkBg,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Network visualization on left */}
      <div
        style={{
          position: 'absolute',
          left: 60,
          top: 120,
          width: 700,
          height: 840,
          opacity: networkOpacity,
        }}
      >
        <svg width="700" height="840">
          {/* Central hub */}
          <circle cx={350} cy={420} r={40} fill={COLORS.eggplant} stroke={COLORS.neonTeal} strokeWidth={2} />
          <text x={350} y={425} fill="white" fontSize={14} fontWeight={700} textAnchor="middle" fontFamily="Inter, system-ui, sans-serif">
            HUB
          </text>

          {/* Distributed nodes in a ring */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const radiusOuter = 250;
            const x = 350 + Math.cos(angle) * radiusOuter;
            const y = 420 + Math.sin(angle) * radiusOuter;
            const nodeDelay = 20 + i * 5;
            const nodeAppear = interpolate(frame, [nodeDelay, nodeDelay + 15], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <g key={i}>
                {/* Connection line */}
                <line
                  x1={350}
                  y1={420}
                  x2={350 + (x - 350) * nodeAppear}
                  y2={420 + (y - 420) * nodeAppear}
                  stroke={COLORS.neonTeal}
                  strokeWidth={1}
                  opacity={0.3 * nodeAppear}
                />
                {/* Node */}
                <circle
                  cx={x}
                  cy={y}
                  r={12 * nodeAppear}
                  fill={COLORS.neonTeal}
                  opacity={nodeAppear * pulse}
                />
                {/* N+1 redundancy line to neighbor */}
                {i > 0 && (
                  <line
                    x1={x}
                    y1={y}
                    x2={350 + Math.cos(((i - 1) / 12) * Math.PI * 2 - Math.PI / 2) * radiusOuter}
                    y2={420 + Math.sin(((i - 1) / 12) * Math.PI * 2 - Math.PI / 2) * radiusOuter}
                    stroke={COLORS.softOrchid}
                    strokeWidth={1}
                    opacity={0.2 * nodeAppear}
                    strokeDasharray="4 4"
                  />
                )}
              </g>
            );
          })}

          {/* Label */}
          <text x={350} y={750} fill={COLORS.dustyLilac} fontSize={14} textAnchor="middle" fontFamily="Inter, system-ui, sans-serif">
            N+1 distributed redundancy across the fleet
          </text>
        </svg>
      </div>

      {/* Right side: Title + SLA tiers */}
      <div style={{ position: 'absolute', right: 80, top: 120, width: 800 }}>
        <div style={{ opacity: titleOpacity }}>
          <div style={{ fontSize: 18, color: COLORS.neonTeal, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>
            Distributed Reliability
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, color: 'white', marginTop: 8 }}>
            99.999% uptime.
            <br />
            No backup generators.
          </div>
          <div style={{ fontSize: 18, color: COLORS.dustyLilac, marginTop: 12, lineHeight: 1.6 }}>
            Geographic diversification replaces traditional redundancy.
            <br />
            Validated by 200K Monte Carlo simulations.
          </div>
        </div>

        {/* SLA Tiers */}
        <div style={{ marginTop: 60 }}>
          {[
            { name: 'Standard', uptime: '99.9%', capacity: '153 MW', pct: '83%', opacity: tier1, color: COLORS.neonTeal },
            { name: 'Premium', uptime: '99.99%', capacity: '127 MW', pct: '69%', opacity: tier2, color: COLORS.softOrchid },
            { name: 'Ultra', uptime: '99.999%', capacity: '100 MW', pct: '54%', opacity: tier3, color: COLORS.mutedMagenta },
          ].map((tier) => (
            <div
              key={tier.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                marginBottom: 24,
                opacity: tier.opacity,
                transform: `translateX(${(1 - tier.opacity) * 30}px)`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 60,
                  borderRadius: 4,
                  background: tier.color,
                }}
              />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>
                  {tier.name}{' '}
                  <span style={{ color: tier.color, fontSize: 26, fontWeight: 800 }}>{tier.uptime}</span>
                </div>
                <div style={{ fontSize: 15, color: COLORS.dustyLilac }}>
                  {tier.capacity} guaranteed &bull; {tier.pct} of fleet
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =============================================================================
// Scene 7: Value Props + Scaling
// =============================================================================
function ValuePropsScaling() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const props = [
    { icon: '⚡', title: 'Faster to Market', desc: 'Existing infrastructure accelerates development', color: COLORS.neonTeal },
    { icon: '🌱', title: 'Cleaner Compute', desc: 'Behind-the-meter renewable power', color: '#22c55e' },
    { icon: '🔌', title: 'Lower Grid Burden', desc: 'Minimal incremental upgrades', color: COLORS.softOrchid },
    { icon: '🔁', title: 'Repeatable Deployments', desc: 'Standardized design that scales', color: COLORS.mutedMagenta },
  ];

  // Revenue scaling section
  const scalingOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.darkBg} 0%, ${COLORS.multiply} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Value props grid */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          padding: '0 80px',
        }}
      >
        {props.map((prop, i) => {
          const cardSpring = spring({ frame: frame - i * 12, fps, config: { damping: 12 } });
          return (
            <div
              key={prop.title}
              style={{
                width: 380,
                padding: 36,
                borderRadius: 16,
                background: `${COLORS.darkBg2}cc`,
                border: `1px solid ${prop.color}30`,
                transform: `translateY(${(1 - cardSpring) * 40}px)`,
                opacity: cardSpring,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>{prop.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 8 }}>
                {prop.title}
              </div>
              <div style={{ fontSize: 15, color: COLORS.dustyLilac, lineHeight: 1.5 }}>
                {prop.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scaling roadmap */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          opacity: scalingOpacity,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 18, color: COLORS.neonTeal, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>
            Scaling Roadmap
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 60, alignItems: 'flex-end' }}>
          {[
            { year: 'Q4 2026', mw: '50 MW', rev: '$20M ARR', height: 80 },
            { year: '2027', mw: '200 MW', rev: '$80M ARR', height: 140 },
            { year: '2028+', mw: '1 GW+', rev: '$400M+ ARR', height: 220 },
          ].map((milestone, i) => {
            const barSpring = spring({ frame: frame - 85 - i * 10, fps, config: { damping: 15 } });
            return (
              <div key={milestone.year} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.neonTeal, marginBottom: 4 }}>
                  {milestone.mw}
                </div>
                <div style={{ fontSize: 14, color: COLORS.dustyLilac, marginBottom: 8 }}>
                  {milestone.rev}
                </div>
                <div
                  style={{
                    width: 100,
                    height: milestone.height * barSpring,
                    borderRadius: '8px 8px 0 0',
                    background: `linear-gradient(180deg, ${COLORS.neonTeal}, ${COLORS.eggplant})`,
                    margin: '0 auto',
                  }}
                />
                <div style={{ fontSize: 16, fontWeight: 600, color: 'white', marginTop: 8 }}>
                  {milestone.year}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =============================================================================
// Scene 8: Closing CTA
// =============================================================================
function ClosingCTA() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const taglineOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' });
  const ctaOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });
  const statsOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' });

  // Gentle background particle field
  const particles = Array.from({ length: 60 }, (_, i) => {
    const x = ((i * 37 + frame * 0.3) % 1920);
    const y = ((i * 53) % 1080);
    const opacity = 0.1 + Math.sin(frame * 0.05 + i) * 0.05;
    return { x, y, opacity };
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${COLORS.multiply} 0%, ${COLORS.darkBg} 70%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: COLORS.neonTeal,
            opacity: p.opacity,
          }}
        />
      ))}

      <div style={{ textAlign: 'center', transform: `scale(${logoScale})` }}>
        {/* Logo */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${COLORS.eggplant}, ${COLORS.neonTeal})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 0 60px ${COLORS.eggplant}80`,
          }}
        >
          <span style={{ color: 'white', fontSize: 52, fontWeight: 800 }}>N</span>
        </div>
        <div style={{ fontSize: 60, fontWeight: 800, color: 'white', letterSpacing: -1 }}>
          NODIAC
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: 280,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: taglineOpacity,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>
          The fastest path to distributed AI compute
          <br />
          <span style={{ color: COLORS.neonTeal }}>in the Upper Midwest.</span>
        </div>
      </div>

      {/* Stats line */}
      <div
        style={{
          position: 'absolute',
          bottom: 180,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: statsOpacity,
          display: 'flex',
          justifyContent: 'center',
          gap: 60,
        }}
      >
        {[
          { num: `${TOTAL_SITES}`, label: 'Sites' },
          { num: `${TOTAL_CAPACITY}+`, label: 'MW' },
          { num: '3', label: 'States' },
          { num: '99.999%', label: 'Uptime' },
        ].map((s) => (
          <div key={s.label}>
            <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.neonTeal }}>{s.num}</div>
            <div style={{ fontSize: 14, color: COLORS.dustyLilac }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          opacity: ctaOpacity,
        }}
      >
        <div style={{ fontSize: 20, color: COLORS.dustyLilac, letterSpacing: 3 }}>
          NODIAC.AI
        </div>
      </div>
    </AbsoluteFill>
  );
}

// =============================================================================
// Subtitle overlay
// =============================================================================
function SubtitleOverlay() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSecond = frame / fps;

  const segment = TRANSCRIPT_SEGMENTS.find(
    (s) => currentSecond >= s.start && currentSecond < s.end
  );

  if (!segment || !segment.text) return null;

  const segmentProgress = (currentSecond - segment.start) / (segment.end - segment.start);
  const fadeIn = interpolate(segmentProgress, [0, 0.1], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(segmentProgress, [0.85, 1], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity: fadeIn * fadeOut,
        zIndex: 100,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: 'rgba(0,0,0,0.75)',
          borderRadius: 8,
          padding: '10px 24px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ color: 'white', fontSize: 22, fontWeight: 500 }}>
          {segment.text}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Main Composition
// =============================================================================
export const UpperMidwestVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.darkBg }}>
      {/* Scene 1: Logo Reveal (0-4s = frames 0-119) */}
      <Sequence from={0} durationInFrames={120}>
        <LogoReveal />
      </Sequence>

      {/* Scene 2: Problem Statement (4-9s = frames 120-269) */}
      <Sequence from={120} durationInFrames={150}>
        <ProblemStatement />
      </Sequence>

      {/* Scene 3: Solution + Map Zoom (9-14s = frames 270-419) */}
      <Sequence from={270} durationInFrames={150}>
        <SolutionMapZoom />
      </Sequence>

      {/* Scene 4: Regional Hub Map (14-30s = frames 420-899) */}
      <Sequence from={420} durationInFrames={480}>
        <RegionalHubMap />
      </Sequence>

      {/* Scene 5: Pilot Sites (30-42s = frames 900-1259) */}
      <Sequence from={900} durationInFrames={360}>
        <PilotSitesFocus />
      </Sequence>

      {/* Scene 6: Distributed Reliability (42-53s = frames 1260-1589) */}
      <Sequence from={1260} durationInFrames={330}>
        <DistributedReliability />
      </Sequence>

      {/* Scene 7: Value Props + Scaling (53-64s = frames 1590-1919) */}
      <Sequence from={1590} durationInFrames={330}>
        <ValuePropsScaling />
      </Sequence>

      {/* Scene 8: Closing CTA (64-76s = frames 1920-2279) */}
      <Sequence from={1920} durationInFrames={360}>
        <ClosingCTA />
      </Sequence>

      {/* Subtitle overlay across entire video */}
      <SubtitleOverlay />
    </AbsoluteFill>
  );
};
