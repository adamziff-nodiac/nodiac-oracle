// 5 distinct voiceover scripts — one per video theme
// Each script has segments timed to the 8-scene structure

export interface ScriptSegment {
  start: number; // seconds
  end: number;
  text: string;
}

export interface VideoScript {
  id: string;
  name: string;
  description: string;
  segments: ScriptSegment[];
}

// ─── Script 1: Dark Tech ────────────────────────────────────────────────────────
// Technical, data-driven. Heavy on specs and numbers.
const darkTechScript: VideoScript = {
  id: 'dark-tech',
  name: 'Data-Driven',
  description: 'Technical and metric-heavy — lets the numbers build the case',
  segments: [
    { start: 0, end: 4, text: '' }, // Logo reveal
    { start: 4, end: 9, text: "AI's bottleneck isn't chips. It's speed to power." },
    { start: 9, end: 14, text: 'Nodiac solves this by deploying AI compute where power already exists.' },
    { start: 14, end: 19, text: 'Introducing the Upper Midwest Regional Hub.' },
    { start: 19, end: 24, text: '42 sites across Minnesota, Iowa, and Wisconsin.' },
    { start: 24, end: 30, text: 'Over 340 megawatts of distributed compute capacity.' },
    { start: 30, end: 36, text: 'Each site collocated with existing renewable energy infrastructure.' },
    { start: 36, end: 42, text: 'Pilot sites at Hay River and Walleye in Wisconsin are already in development.' },
    { start: 42, end: 48, text: 'Modular data centers on trailers. No permitting delays.' },
    { start: 48, end: 53, text: 'Distributed N-plus-1 reliability. 99.999% uptime. No backup generators.' },
    { start: 53, end: 59, text: 'Powered by partnerships with Greenbacker and local electric cooperatives.' },
    { start: 59, end: 64, text: 'Faster to market. Cleaner compute. Lower grid burden. Repeatable deployments.' },
    { start: 64, end: 70, text: 'The fastest path to distributed AI compute in the Upper Midwest.' },
    { start: 70, end: 76, text: 'Nodiac. Distributed power infrastructure for AI compute.' },
  ],
};

// ─── Script 2: Eggplant Cinematic ───────────────────────────────────────────────
// Dramatic, storytelling. Builds emotional tension then resolves.
const eggplantCinematicScript: VideoScript = {
  id: 'eggplant-cinematic',
  name: 'Cinematic Narrative',
  description: 'Dramatic storytelling arc — tension, vision, resolution',
  segments: [
    { start: 0, end: 4.5, text: '' }, // Logo reveal, longer for cinematic
    { start: 4.5, end: 10, text: 'The world is building the most powerful technology in human history. And it cannot get the power it needs.' },
    { start: 10, end: 16, text: 'Every major hyperscaler is capacity-constrained. 100 gigawatts of demand. Five-year interconnection queues. 98 billion dollars in delayed projects.' },
    { start: 16, end: 22, text: 'But across the Upper Midwest, hundreds of renewable energy sites sit underutilized. The power is already there.' },
    { start: 22, end: 28, text: "Nodiac brings the compute to the power. 42 sites spanning three states. A fleet of modular data centers deployed where infrastructure already exists." },
    { start: 28, end: 34, text: 'Minnesota. Iowa. Wisconsin. Over 340 megawatts of distributed capacity, collocated with wind, solar, and grid interconnection.' },
    { start: 34, end: 40, text: 'Two pilot sites in Wisconsin are already advancing. Hay River and Walleye — first movers in a new deployment model.' },
    { start: 40, end: 46, text: 'No concrete pads. No permitting delays. Armada compute pods on trailers, deployed in weeks, not years.' },
    { start: 46, end: 52, text: 'Distributed reliability across the fleet means 99.999 percent uptime — without a single backup generator.' },
    { start: 52, end: 58, text: 'This is not incremental. This is the infrastructure layer that unlocks AI at scale.' },
    { start: 58, end: 64, text: '50 megawatts by Q4 2026. 200 megawatts by 2027. Over a gigawatt by 2028.' },
    { start: 64, end: 70, text: 'The fastest path to distributed AI compute in the Upper Midwest.' },
    { start: 70, end: 76, text: 'Nodiac.' },
  ],
};

// ─── Script 3: Clean White ──────────────────────────────────────────────────────
// Corporate, concise, professional. Investor-meeting tone.
const cleanWhiteScript: VideoScript = {
  id: 'clean-white',
  name: 'Corporate Brief',
  description: 'Concise and professional — boardroom-ready investor summary',
  segments: [
    { start: 0, end: 4, text: '' }, // Logo reveal
    { start: 4, end: 9, text: 'AI demand is growing exponentially. Power supply is not keeping pace.' },
    { start: 9, end: 14, text: 'Nodiac bridges this gap with distributed data centers at existing power sites.' },
    { start: 14, end: 20, text: 'The Upper Midwest Regional Hub: 42 sites across Minnesota, Iowa, and Wisconsin. Over 340 megawatts of compute capacity.' },
    { start: 20, end: 26, text: 'Each site is collocated with renewable energy generation, connected to grid infrastructure, and pre-qualified for rapid deployment.' },
    { start: 26, end: 32, text: 'Two pilot sites are in active development with Dunn Energy Cooperative in western Wisconsin.' },
    { start: 32, end: 38, text: 'The deployment model uses modular, trailer-mounted data centers. No new construction. No permitting delays. Energization in months, not years.' },
    { start: 38, end: 44, text: 'Fleet-level N-plus-1 redundancy delivers 99.999 percent uptime without backup generation.' },
    { start: 44, end: 50, text: 'Revenue model: capacity rental at 780 thousand dollars per megawatt per year. Triple-net lease. Stable EBITDA.' },
    { start: 50, end: 56, text: 'Partnerships with Greenbacker Renewable Energy and regional electric cooperatives provide site access across the region.' },
    { start: 56, end: 62, text: 'Target: 50 megawatts operational by Q4 2026. Scaling to one gigawatt plus by 2028.' },
    { start: 62, end: 68, text: 'Faster to market. Cleaner compute. Lower grid burden. Repeatable deployments.' },
    { start: 68, end: 76, text: 'Nodiac. Distributed power infrastructure for AI compute.' },
  ],
};

// ─── Script 4: Bold Stats ───────────────────────────────────────────────────────
// Punchy, stat-forward. Short sentences. Maximum impact per word.
const boldStatsScript: VideoScript = {
  id: 'bold-stats',
  name: 'Stats-Forward',
  description: 'Maximum impact per word — punchy stats that land hard',
  segments: [
    { start: 0, end: 3, text: '' }, // Quick logo
    { start: 3, end: 6, text: '100 gigawatts of AI demand. 5-year power queues.' },
    { start: 6, end: 9, text: '98 billion dollars in delayed data centers.' },
    { start: 9, end: 12, text: 'The bottleneck is power. Nodiac fixes it.' },
    { start: 12, end: 16, text: '42 sites. Three states. 340 plus megawatts.' },
    { start: 16, end: 20, text: 'Minnesota. Iowa. Wisconsin.' },
    { start: 20, end: 25, text: 'Every site collocated with existing renewable infrastructure.' },
    { start: 25, end: 29, text: '23 sites in Minnesota. 179 megawatts.' },
    { start: 29, end: 33, text: '4 sites in Iowa. 132 megawatts.' },
    { start: 33, end: 37, text: '15 sites in Wisconsin. 35 megawatts.' },
    { start: 37, end: 41, text: 'Two pilots already in development. Hay River. Walleye.' },
    { start: 41, end: 44, text: 'Modular pods. Trailer-mounted. Weeks to deploy.' },
    { start: 44, end: 48, text: '99.999 percent uptime. Zero backup generators.' },
    { start: 48, end: 52, text: '780K per megawatt annual revenue. Triple-net.' },
    { start: 52, end: 56, text: '50 megawatts by Q4 2026. A gigawatt by 2028.' },
    { start: 56, end: 60, text: 'Greenbacker partnership. Cooperative access. Proven team.' },
    { start: 60, end: 64, text: 'Speed to power. That is the edge.' },
    { start: 64, end: 76, text: 'Nodiac.' },
  ],
};

// ─── Script 5: Teal Network ────────────────────────────────────────────────────
// Network/connectivity focused. Emphasizes distributed architecture.
const tealNetworkScript: VideoScript = {
  id: 'teal-network',
  name: 'Network Architecture',
  description: 'Distributed infrastructure story — interconnected resilience',
  segments: [
    { start: 0, end: 4, text: '' }, // Logo reveal
    { start: 4, end: 10, text: 'Centralized data centers are hitting a wall. Power queues stretch five years. Billions in projects sit idle.' },
    { start: 10, end: 16, text: 'The answer is not bigger. It is distributed. Nodiac deploys modular AI compute across a network of existing power sites.' },
    { start: 16, end: 22, text: 'The Upper Midwest Regional Hub: a 42-node network spanning Minnesota, Iowa, and Wisconsin.' },
    { start: 22, end: 28, text: 'Each node collocated with renewable generation. Connected to grid infrastructure. Ready for rapid activation.' },
    { start: 28, end: 34, text: 'The network spans over 340 megawatts across three states, with each site operating as part of a resilient, interconnected fleet.' },
    { start: 34, end: 40, text: 'Pilot nodes at Hay River and Walleye in Wisconsin are the first to come online. Modular compute pods on trailers, energized in weeks.' },
    { start: 40, end: 46, text: 'Distributed N-plus-1 architecture means if any node goes offline, the network absorbs it. 99.999 percent uptime. No generators.' },
    { start: 46, end: 52, text: 'Geographic diversification replaces traditional redundancy. Validated by 200,000 Monte Carlo simulations.' },
    { start: 52, end: 58, text: 'The network scales from 50 megawatts in 2026 to over a gigawatt by 2028. Each new node strengthens the whole.' },
    { start: 58, end: 64, text: 'Faster to power. Cleaner compute. Resilient by design.' },
    { start: 64, end: 70, text: 'The future of AI infrastructure is not centralized. It is networked.' },
    { start: 70, end: 76, text: 'Nodiac. Distributed power infrastructure for AI compute.' },
  ],
};

export const VIDEO_SCRIPTS: VideoScript[] = [
  darkTechScript,
  eggplantCinematicScript,
  cleanWhiteScript,
  boldStatsScript,
  tealNetworkScript,
];

export function getScriptForTheme(themeId: string): VideoScript {
  return VIDEO_SCRIPTS.find(s => s.id === themeId) ?? VIDEO_SCRIPTS[0];
}
