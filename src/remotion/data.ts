// Upper Midwest Regional Hub site data
export interface Site {
  name: string;
  state: 'MN' | 'IA' | 'WI';
  capacityMW: number;
  lat: number;
  lng: number;
  utility: string;
  isPilot?: boolean;
}

// All 42 sites from Fleet CIR Validated - MN, IA, WI (All GB Sites).csv
export const UPPER_MIDWEST_SITES: Site[] = [
  // Minnesota sites (21)
  { name: 'Albany', state: 'MN', capacityMW: 10, lat: 45.641308, lng: -94.602752, utility: 'Xcel Energy' },
  { name: 'Annandale', state: 'MN', capacityMW: 6, lat: 45.248346, lng: -94.108638, utility: 'Xcel Energy' },
  { name: 'Atwater', state: 'MN', capacityMW: 4, lat: 45.1396, lng: -94.773, utility: 'Xcel Energy' },
  { name: 'CWS', state: 'MN', capacityMW: 33, lat: 43.71763, lng: -95.80365, utility: 'Northern States Power' },
  { name: 'Chisago', state: 'MN', capacityMW: 6.5, lat: 45.325969, lng: -92.936506, utility: 'Xcel Energy' },
  { name: 'Dodge Center', state: 'MN', capacityMW: 6.5, lat: 44.026819, lng: -92.880287, utility: 'Xcel Energy' },
  { name: 'Eastwood', state: 'MN', capacityMW: 5.5, lat: 44.15727289, lng: -93.9091295, utility: 'Xcel Energy' },
  { name: 'Fountain', state: 'MN', capacityMW: 3.77, lat: 43.728699, lng: -92.144015, utility: 'MiEnergy Coop' },
  { name: 'Hastings', state: 'MN', capacityMW: 4.5, lat: 44.759084, lng: -92.825471, utility: 'Xcel Energy' },
  { name: 'Hazel', state: 'MN', capacityMW: 3.75, lat: 43.781772, lng: -91.949742, utility: 'MiEnergy Coop' },
  { name: 'Lake Emily', state: 'MN', capacityMW: 4.5, lat: 44.319483, lng: -93.899768, utility: 'Xcel Energy' },
  { name: 'Lake Pulaski', state: 'MN', capacityMW: 10.92, lat: 45.195016, lng: -93.80743, utility: 'Xcel Energy' },
  { name: 'Lawrence Creek', state: 'MN', capacityMW: 3.5, lat: 45.402705, lng: -92.693893, utility: 'Xcel Energy' },
  { name: 'Montrose', state: 'MN', capacityMW: 4.98, lat: 45.057468, lng: -93.923789, utility: 'Xcel Energy' },
  { name: 'Paynesville', state: 'MN', capacityMW: 10, lat: 45.391001, lng: -94.725671, utility: 'Xcel Energy' },
  { name: 'Pine Island', state: 'MN', capacityMW: 4, lat: 44.205424, lng: -92.663592, utility: 'Xcel Energy' },
  { name: 'Ridgewind', state: 'MN', capacityMW: 25.3, lat: 44.01774669, lng: -96.06578685, utility: 'Xcel Energy' },
  { name: 'Rushford Village', state: 'MN', capacityMW: 1.15, lat: 43.8066, lng: -91.791594, utility: 'MiEnergy Coop' },
  { name: 'Stockton', state: 'MN', capacityMW: 2.55, lat: 44.04105, lng: -91.766902, utility: 'MiEnergy Coop' },
  { name: 'Waseca', state: 'MN', capacityMW: 10, lat: 44.092198, lng: -93.52887, utility: 'Xcel Energy' },
  { name: 'West Faribault', state: 'MN', capacityMW: 5.5, lat: 44.27366, lng: -93.30777, utility: 'Xcel Energy' },
  { name: 'West Waconia', state: 'MN', capacityMW: 8.5, lat: 44.874375, lng: -93.814244, utility: 'Xcel Energy' },
  { name: 'WindShare', state: 'MN', capacityMW: 5.4, lat: 43.960767, lng: -95.979189, utility: 'Xcel Energy' },
  // Iowa sites (4)
  { name: 'Elk', state: 'IA', capacityMW: 42.75, lat: 42.583794, lng: -91.370936, utility: 'ITC Midwest' },
  { name: 'Hawkeye', state: 'IA', capacityMW: 37.8, lat: 42.932121, lng: -91.983293, utility: 'ITC Midwest' },
  { name: 'Maple City', state: 'IA', capacityMW: 1.85, lat: 43.27954745, lng: -92.79127158, utility: 'Heartland Power Coop' },
  { name: 'Rippey', state: 'IA', capacityMW: 50, lat: 42.006923, lng: -94.2379, utility: 'ITC Midwest' },
  // Wisconsin sites (15)
  { name: 'Bluff Prairie', state: 'WI', capacityMW: 1.5, lat: 43.471699, lng: -91.140559, utility: 'Vernon Electric' },
  { name: 'Blue Prairie', state: 'WI', capacityMW: 3.09, lat: 44.28615, lng: -90.91843, utility: 'OneEnergy' },
  { name: 'Georgetown', state: 'WI', capacityMW: 2, lat: 45.476919, lng: -92.368025, utility: 'Polk Burnett Coop' },
  { name: 'Hay River', state: 'WI', capacityMW: 1.5, lat: 45.046634, lng: -91.975592, utility: 'Dunn Energy Coop', isPilot: true },
  { name: 'Ledgeview', state: 'WI', capacityMW: 5, lat: 43.778833, lng: -88.345936, utility: 'WI Power & Light' },
  { name: 'Lemonweir', state: 'WI', capacityMW: 3, lat: 43.738226, lng: -90.013025, utility: 'Oakdale Electric' },
  { name: 'Ogema', state: 'WI', capacityMW: 1.4, lat: 45.448017, lng: -90.328721, utility: 'Price Electric' },
  { name: 'Popple Creek', state: 'WI', capacityMW: 2, lat: 44.895133, lng: -90.44196, utility: 'Clark Electric' },
  { name: 'Shamrock', state: 'WI', capacityMW: 3.83, lat: 44.175571, lng: -90.849712, utility: 'Jackson Electric' },
  { name: 'Strobus', state: 'WI', capacityMW: 1.85, lat: 44.43332, lng: -90.85707, utility: 'OneEnergy' },
  { name: 'Stromland', state: 'WI', capacityMW: 3.83, lat: 44.199545, lng: -91.808971, utility: 'Riverland Energy' },
  { name: 'Trimbelle', state: 'WI', capacityMW: 2, lat: 44.624648, lng: -92.576021, utility: 'Pierce Pepin Coop' },
  { name: 'Walleye', state: 'WI', capacityMW: 1.5, lat: 44.971013, lng: -91.804484, utility: 'Dunn Energy Coop', isPilot: true },
  { name: 'Webster Creek', state: 'WI', capacityMW: 1.5, lat: 43.86351, lng: -90.15579, utility: 'Oakdale Electric' },
  { name: 'Wolf River', state: 'WI', capacityMW: 1.5, lat: 44.9539112, lng: -90.964332, utility: 'Chippewa Valley Electric' },
];

export const TOTAL_CAPACITY_MW = UPPER_MIDWEST_SITES.reduce((sum, s) => sum + s.capacityMW, 0);
export const TOTAL_SITES = UPPER_MIDWEST_SITES.length;
export const MN_SITES = UPPER_MIDWEST_SITES.filter(s => s.state === 'MN');
export const IA_SITES = UPPER_MIDWEST_SITES.filter(s => s.state === 'IA');
export const WI_SITES = UPPER_MIDWEST_SITES.filter(s => s.state === 'WI');
export const PILOT_SITES = UPPER_MIDWEST_SITES.filter(s => s.isPilot);

// Map bounds for the Upper Midwest region
export const REGION_CENTER = { lat: 44.3, lng: -92.5 };
export const US_CENTER = { lat: 39.8, lng: -98.5 };

// Brand colors
export const COLORS = {
  eggplant: '#490f42',
  multiply: '#250721',
  neonTeal: '#4de2e4',
  softOrchid: '#b48fc1',
  mutedMagenta: '#e86df7',
  dustyLilac: '#928a97',
  darkBg: '#0a0a14',
  darkBg2: '#1a1a2e',
  white: '#ffffff',
  mn: '#6366f1', // indigo for MN
  ia: '#22d3ee', // cyan for IA
  wi: '#f43f5e', // rose for WI
};

// Voiceover transcript (for display as subtitles)
export const TRANSCRIPT_SEGMENTS = [
  { start: 0, end: 4, text: '' }, // Logo reveal, no text
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
];
