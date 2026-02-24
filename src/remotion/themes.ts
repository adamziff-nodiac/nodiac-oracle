import { COLORS } from './data';

export interface VideoTheme {
  id: string;
  name: string;
  description: string;
  bg1: string;
  bg2: string;
  accent: string;
  accent2: string;
  text: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  subtitleBg: string;
  mapDotMN: string;
  mapDotIA: string;
  mapDotWI: string;
  gradientDirection: string;
  fontWeight: 700 | 800 | 900;
  titleScale: number;
  statScale: number;
  pacing: 'standard' | 'fast' | 'cinematic';
  mapStyle: 'dots' | 'glow' | 'minimal' | 'network' | 'bold';
}

export const THEMES: VideoTheme[] = [
  {
    id: 'dark-tech',
    name: 'Dark Tech',
    description: 'Dark background, neon teal accents, tech-forward',
    bg1: '#0a0a14',
    bg2: '#1a1a2e',
    accent: COLORS.neonTeal,
    accent2: COLORS.softOrchid,
    text: '#ffffff',
    textMuted: COLORS.dustyLilac,
    cardBg: `${COLORS.darkBg2}cc`,
    cardBorder: `${COLORS.neonTeal}30`,
    subtitleBg: 'rgba(0,0,0,0.75)',
    mapDotMN: '#6366f1',
    mapDotIA: '#22d3ee',
    mapDotWI: '#f43f5e',
    gradientDirection: '135deg',
    fontWeight: 800,
    titleScale: 1,
    statScale: 1,
    pacing: 'standard',
    mapStyle: 'dots',
  },
  {
    id: 'eggplant-cinematic',
    name: 'Eggplant Cinematic',
    description: 'Deep purple gradients, orchid accents, dramatic pacing',
    bg1: COLORS.multiply,
    bg2: '#1a0520',
    accent: COLORS.softOrchid,
    accent2: COLORS.mutedMagenta,
    text: '#ffffff',
    textMuted: '#c4a8d0',
    cardBg: 'rgba(73,15,66,0.35)',
    cardBorder: 'rgba(180,143,193,0.25)',
    subtitleBg: 'rgba(37,7,33,0.85)',
    mapDotMN: COLORS.softOrchid,
    mapDotIA: COLORS.mutedMagenta,
    mapDotWI: '#f9a8d4',
    gradientDirection: '160deg',
    fontWeight: 900,
    titleScale: 1.15,
    statScale: 1.1,
    pacing: 'cinematic',
    mapStyle: 'glow',
  },
  {
    id: 'clean-white',
    name: 'Clean White',
    description: 'Light backgrounds, dark text, minimal and professional',
    bg1: '#f8f8fa',
    bg2: '#eeeef2',
    accent: COLORS.eggplant,
    accent2: COLORS.neonTeal,
    text: '#1a1a2e',
    textMuted: '#6b6b7b',
    cardBg: 'rgba(255,255,255,0.9)',
    cardBorder: 'rgba(73,15,66,0.15)',
    subtitleBg: 'rgba(255,255,255,0.9)',
    mapDotMN: COLORS.eggplant,
    mapDotIA: '#0891b2',
    mapDotWI: '#dc2626',
    gradientDirection: '180deg',
    fontWeight: 700,
    titleScale: 0.95,
    statScale: 1,
    pacing: 'standard',
    mapStyle: 'minimal',
  },
  {
    id: 'bold-stats',
    name: 'Bold Stats',
    description: 'Giant numbers, rapid cuts, one-stat-per-screen energy',
    bg1: '#000000',
    bg2: '#0d0d0d',
    accent: '#00ff88',
    accent2: COLORS.neonTeal,
    text: '#ffffff',
    textMuted: '#888888',
    cardBg: 'rgba(20,20,20,0.9)',
    cardBorder: 'rgba(0,255,136,0.2)',
    subtitleBg: 'rgba(0,0,0,0.85)',
    mapDotMN: '#00ff88',
    mapDotIA: '#00ccff',
    mapDotWI: '#ff6644',
    gradientDirection: '135deg',
    fontWeight: 900,
    titleScale: 1.4,
    statScale: 1.5,
    pacing: 'fast',
    mapStyle: 'bold',
  },
  {
    id: 'teal-network',
    name: 'Teal Network',
    description: 'Deep teal palette, network-graph aesthetic, interconnected feel',
    bg1: '#041a1a',
    bg2: '#0a2e2e',
    accent: '#5eead4',
    accent2: '#2dd4bf',
    text: '#f0fdfa',
    textMuted: '#5eead4',
    cardBg: 'rgba(10,46,46,0.8)',
    cardBorder: 'rgba(94,234,212,0.2)',
    subtitleBg: 'rgba(4,26,26,0.85)',
    mapDotMN: '#5eead4',
    mapDotIA: '#22d3ee',
    mapDotWI: '#a78bfa',
    gradientDirection: '145deg',
    fontWeight: 800,
    titleScale: 1.05,
    statScale: 1,
    pacing: 'standard',
    mapStyle: 'network',
  },
];
