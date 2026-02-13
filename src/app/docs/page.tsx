'use client'

import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ArrowLeft, ExternalLink } from 'lucide-react'

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10">
      {title && (
        <div className="px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-gray-400 font-mono">
          {title}
        </div>
      )}
      <pre className="px-4 py-3 bg-white/[0.02] overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
        {children}
      </pre>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
        <span className="w-1 h-7 bg-nodiac-secondary rounded-full" />
        {title}
      </h2>
      <div className="space-y-4 text-gray-300 leading-relaxed">{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="space-y-3 text-gray-300 leading-relaxed">{children}</div>
    </div>
  )
}

const TOC = [
  { id: 'architecture', label: 'Architecture Overview' },
  { id: 'data-pipeline', label: 'Data Pipeline' },
  { id: 'scoring-math', label: 'Scoring Math' },
  { id: 'six-criteria', label: 'The Six Criteria' },
  { id: 'normalization', label: 'Normalization' },
  { id: 'weight-profiles', label: 'Weight Profiles' },
  { id: 'site-screening', label: 'Site Screening Flow' },
  { id: 'utility-classification', label: 'Utility Classification' },
  { id: 'fips-resolution', label: 'FIPS Resolution' },
  { id: 'map-rendering', label: 'Map Rendering' },
  { id: 'api-reference', label: 'API Reference' },
  { id: 'data-sources', label: 'Data Sources' },
  { id: 'limitations', label: 'Known Limitations' },
  { id: 'extending', label: 'Extending the Model' },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-transparent backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nodiac-primary to-nodiac-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-white font-semibold text-xl hidden sm:inline">Nodiac</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto flex gap-10">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">On this page</p>
            {TOC.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-sm text-gray-400 hover:text-white transition-colors py-1 px-2 rounded hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 space-y-2">
            <Link href="/regional-hubs" className="flex items-center gap-2 text-sm text-nodiac-secondary hover:text-nodiac-secondary/80">
              <ArrowLeft className="w-3.5 h-3.5" /> Regional Hubs
            </Link>
            <Link href="/screening" className="flex items-center gap-2 text-sm text-nodiac-secondary hover:text-nodiac-secondary/80">
              <ArrowLeft className="w-3.5 h-3.5" /> Site Screening
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 max-w-4xl space-y-16">
          {/* Title */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link href="/regional-hubs" className="text-sm text-nodiac-secondary hover:underline">Hubs</Link>
              <span className="text-gray-600">/</span>
              <Link href="/screening" className="text-sm text-nodiac-secondary hover:underline">Screening</Link>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-gray-400">Developer Docs</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Developer Documentation
            </h1>
            <p className="mt-4 text-lg text-nodiac-dusty-lilac max-w-2xl leading-relaxed">
              Technical reference for the Regional Hub scoring model and Site Screening pipeline.
              Written for Adam Stratton and Eric Shannon.
            </p>
          </div>

          {/* Architecture */}
          <Section id="architecture" title="Architecture Overview">
            <p>
              The system has three layers: a <strong className="text-white">data pipeline</strong> (Python, runs offline),
              a <strong className="text-white">Next.js 15 app</strong> (Bun runtime, Tailwind v4), and
              a <strong className="text-white">Supabase backend</strong> (Postgres + Auth).
            </p>
            <CodeBlock title="Directory Structure">{`src/
├── app/
│   ├── regional-hubs/page.tsx    # Choropleth map page
│   ├── screening/page.tsx        # Portfolio screening page
│   ├── docs/page.tsx             # This page
│   └── api/
│       ├── county-scores/        # GET — all county scores
│       ├── hub-regions/          # GET — hub region GeoJSON overlays
│       ├── upload-csv/           # POST — upload IPP portfolio CSV
│       ├── portfolio/[id]/       # GET — portfolio detail
│       │   └── score/            # POST — trigger FIPS lookup + scoring
│       └── summary/              # GET — AI narrative summary
├── components/
│   ├── regional-hubs/            # Map, choropleth, weights, methodology
│   └── screening/                # CSV uploader, table, map, tier badges
├── hooks/
│   ├── useCountyScores.ts        # Fetch + cache county scores
│   ├── useWeightedScores.ts      # Client-side composite scoring
│   ├── useHubRegions.ts          # Hub region GeoJSON data
│   └── usePortfolio.ts           # Portfolio upload + scoring flow
├── lib/
│   ├── scoring/
│   │   ├── county-scorer.ts      # computeCompositeScore() — weighted average
│   │   ├── site-scorer.ts        # scoreSite(), scoreSiteWeighted()
│   │   ├── normalize.ts          # minMaxNormalize, inverseNormalize
│   │   ├── weight-profiles.ts    # 4 preset profiles
│   │   └── utility-classifier.ts # Co-op/IOU/Muni detection from CSV
│   └── geo/
│       └── fips-lookup.ts        # FCC Area API → FIPS code
└── types/
    ├── regional-hubs.ts          # CriterionKey, CountyScore, WeightProfile
    └── screening.ts              # SiteTier, PortfolioSite, ParsedSite
scripts/
└── build-real-county-scores.py   # Offline data pipeline`}</CodeBlock>
            <p>
              <strong className="text-white">Key design decision:</strong> All weight changes happen client-side.
              The API returns raw 0–1 scores per criterion per county. The frontend computes composite scores
              in <code className="text-nodiac-secondary bg-white/5 px-1 rounded">useMemo</code> — moving a
              slider recomputes ~3,200 composites in milliseconds with zero network requests.
            </p>
          </Section>

          {/* Data Pipeline */}
          <Section id="data-pipeline" title="Data Pipeline">
            <p>
              The Python script <code className="text-nodiac-secondary bg-white/5 px-1 rounded">scripts/build-real-county-scores.py</code> downloads
              federal datasets and computes per-county scores. Run with:
            </p>
            <CodeBlock>{`uv run scripts/build-real-county-scores.py`}</CodeBlock>

            <SubSection title="Pipeline Steps">
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li><strong className="text-white">FIPS crosswalk</strong> — Downloads county name → FIPS code mapping (3,136 entries)</li>
                <li><strong className="text-white">EIA Form 861</strong> — Downloads ZIP (4.4 MB, 20 files) → processes <code className="text-nodiac-secondary bg-white/5 px-1 rounded">Service_Territory_2024.xlsx</code> for co-op density and <code className="text-nodiac-secondary bg-white/5 px-1 rounded">Reliability_2024.xlsx</code> for grid SAIDI</li>
                <li><strong className="text-white">EIA Form 860</strong> — Downloads ZIP (21 MB, 13 files) → extracts solar/wind generators from Operable + Proposed sheets for curtailment proxy</li>
                <li><strong className="text-white">Census CBP</strong> — API calls for NAICS 5182, 5415, 517 + population estimates → labor score</li>
                <li><strong className="text-white">Census ACS</strong> — API call for B28002 broadband subscriptions → fiber proxy</li>
                <li><strong className="text-white">Assembly</strong> — Joins all scores by FIPS, writes to <code className="text-nodiac-secondary bg-white/5 px-1 rounded">public/data/county-scores.json</code> and Supabase <code className="text-nodiac-secondary bg-white/5 px-1 rounded">county_scores</code> table</li>
              </ol>
            </SubSection>

            <SubSection title="Data Loading in the Frontend">
              <p>
                <code className="text-nodiac-secondary bg-white/5 px-1 rounded">useCountyScores</code> tries
                the Supabase API first (<code className="text-nodiac-secondary bg-white/5 px-1 rounded">/api/county-scores</code>),
                then falls back to the static JSON file if the API returns fewer than 2,000 rows (Supabase
                defaults to 1,000 row limit). The API route explicitly sets <code className="text-nodiac-secondary bg-white/5 px-1 rounded">limit(5000)</code>.
              </p>
            </SubSection>
          </Section>

          {/* Scoring Math */}
          <Section id="scoring-math" title="Scoring Math">
            <SubSection title="Composite Score Formula">
              <p>
                Each county has six criterion scores, each in the range [0, 1]. The composite score is a
                weighted average scaled to [0, 10]:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
                composite = ( Σ criterion_score<sub>i</sub> × weight<sub>i</sub> ) / ( Σ weight<sub>i</sub> ) × 10
              </div>
              <p>
                If a weight is 0, that criterion is excluded from both numerator and denominator — it&apos;s
                as if that dimension doesn&apos;t exist. This means zeroing out a criterion never penalizes
                a county; it just ignores that dimension.
              </p>
            </SubSection>

            <SubSection title="Implementation">
              <CodeBlock title="src/lib/scoring/county-scorer.ts">{`export function computeCompositeScore(
  county: CountyScore,
  weights: Record<CriterionKey, number>
): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const key of Object.keys(weights) as CriterionKey[]) {
    const w = weights[key]
    if (w <= 0) continue
    weightedSum += getCriterionValue(county, key) * w
    totalWeight += w
  }

  if (totalWeight === 0) return 0
  return (weightedSum / totalWeight) * 10
}`}</CodeBlock>
            </SubSection>

            <SubSection title="Worked Example">
              <p>
                Given a county with: Co-op = 0.80, Grid = 0.65, Curtailment = 0.50, Permitting = 0.50,
                Labor = 0.50, Fiber = 0.50
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-3 text-gray-400 font-medium">Profile</th>
                      <th className="text-left py-2 pr-3 text-gray-400 font-medium">Calculation</th>
                      <th className="text-left py-2 text-gray-400 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    <tr className="border-b border-white/5">
                      <td className="py-2 pr-3 text-white font-sans text-sm">Balanced</td>
                      <td className="py-2 pr-3 text-gray-300">(0.80+0.65+0.50+0.50+0.50+0.50)/6 × 10</td>
                      <td className="py-2 text-nodiac-secondary font-bold">5.75</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-2 pr-3 text-white font-sans text-sm">Co-op Priority</td>
                      <td className="py-2 pr-3 text-gray-300">(0.80×3+0.65×1+0.50×1+0.50×2+0.50×0.5+0.50×1)/8.5 × 10</td>
                      <td className="py-2 text-nodiac-secondary font-bold">6.21</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-3 text-white font-sans text-sm">Curtailment Capture</td>
                      <td className="py-2 pr-3 text-gray-300">(0.80×1+0.65×1.5+0.50×3+0.50×1+0.50×0.5+0.50×1)/8 × 10</td>
                      <td className="py-2 text-nodiac-secondary font-bold">5.91</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </SubSection>

            <SubSection title="Site Scoring & Tier Assignment">
              <p>Sites use the same formula. Tier thresholds:</p>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#4de2e4]" />
                  <span className="text-sm"><strong className="text-white">Strong Fit:</strong> ≥ 6.5</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#b48fc1]" />
                  <span className="text-sm"><strong className="text-white">Moderate Fit:</strong> ≥ 4.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <span className="text-sm"><strong className="text-white">Weak Fit:</strong> &lt; 4.0</span>
                </div>
              </div>
              <CodeBlock title="src/lib/scoring/site-scorer.ts">{`const TIER_THRESHOLDS = {
  good: 6.5,   // "Strong Fit"
  okay: 4.0,   // "Moderate Fit"
}
// Anything below 4.0 is "Weak Fit" (bad)`}</CodeBlock>
            </SubSection>
          </Section>

          {/* Six Criteria */}
          <Section id="six-criteria" title="The Six Criteria">
            <div className="space-y-8">
              <SubSection title="1. Co-op Density (coop_density_score)">
                <p>Share of a county&apos;s electric service territory served by rural electric cooperatives.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> EIA Form 861 (2024) — Service_Territory_2024.xlsx (11,776 rows mapping 2,907 utilities to counties) + Frame_2024.xlsx (3,413 utilities classified by ownership type)</p>
                  <p><strong className="text-gray-200">Method:</strong> Count distinct utilities per county, calculate fraction that are cooperatives. Score = co-op count / total count.</p>
                  <p><strong className="text-gray-200">Range:</strong> Natural 0–1 ratio. No normalization needed.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> 3,097 of 3,143 counties (99%). 117 counties are 100% co-op; 540 have zero co-op presence.</p>
                </div>
              </SubSection>

              <SubSection title="2. Grid Reliability (grid_reliability_score)">
                <p>Grid uptime measured by SAIDI (average outage minutes per customer per year). <strong className="text-white">Inverse metric</strong> — lower SAIDI = higher score.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> EIA Form 861 Reliability Data (2024) — 971 utilities report SAIDI. Prefers &ldquo;IEEE Without Major Event Days&rdquo; metric.</p>
                  <p><strong className="text-gray-200">Method:</strong> Map utility SAIDI to service territory counties, average per county, inverse percentile rank. Median SAIDI: ~158 min/yr.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> 3,025 of 3,143 counties (96%). Remaining 4% default to 0.5.</p>
                </div>
              </SubSection>

              <SubSection title="3. Clipped/Curtailed (clipped_curtailed_score)">
                <p>Presence of variable renewable energy (solar + wind) that may be curtailed — an opportunity for behind-the-meter data centers.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> EIA Form 860 (2024) — 8,684 variable renewable generators, 277,437 MW total.</p>
                  <p><strong className="text-gray-200">Method:</strong> Three-component composite:</p>
                  <div className="bg-white/5 border border-white/10 rounded px-3 py-2 font-mono text-xs text-nodiac-secondary">
                    score = 0.55 × log_norm(installed_MW) + 0.20 × pipeline_pressure + 0.25 × congestion_flag
                  </div>
                  <p>Congestion bonus for CAISO, ERCOT, MISO, SPP, BPAT balancing authorities.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> 1,684 of 3,143 counties (54%). Remaining 46% score 0.0 (no renewables).</p>
                </div>
              </SubSection>

              <SubSection title="4. Permitting (permitting_score)">
                <p>Local government friendliness toward data center development.</p>
                <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-yellow-400/80">⚠ Status: All counties default to 0.5 (neutral).</strong> This is the only criterion without real data.</p>
                  <p><strong className="text-gray-200">Planned source:</strong> Claude Code &ldquo;permitting-sentiment&rdquo; skill — web research on moratoria, zoning, incentives. Score: 0 (hostile) → 0.5 (neutral) → 1 (welcoming with incentives).</p>
                </div>
              </SubSection>

              <SubSection title="5. Skilled IT Labor (labor_score)">
                <p>IT and telecom workforce density per capita.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> Census CBP 2023 — NAICS 5182 (Data Processing), 5415 (Computer Systems Design), 517 (Telecom). Population from Census 2024 vintage.</p>
                  <p><strong className="text-gray-200">Method:</strong> Sum IT employees across all three NAICS per county, divide by population for per-10K density, percentile rank normalize.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> 100%. 2,222 of 3,143 counties have at least one IT establishment.</p>
                </div>
              </SubSection>

              <SubSection title="6. Fiber Availability (fiber_score)">
                <p>Broadband infrastructure proxy for fiber availability.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> Census ACS 5-Year (2023), Table B28002 — cable/fiber/DSL subscriptions ÷ total households. Median: 85.1%.</p>
                  <p><strong className="text-gray-200">Method:</strong> Subscription rate per county → percentile rank normalization.</p>
                  <p><strong className="text-gray-200">Note:</strong> This is a proxy. FCC BDC location-level fiber data would be more precise but requires registration.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> 100%.</p>
                </div>
              </SubSection>
            </div>
          </Section>

          {/* Normalization */}
          <Section id="normalization" title="Normalization">
            <p>
              Raw data arrives in different units. Three normalization strategies are used to produce 0–1 scores:
            </p>

            <SubSection title="1. Direct Ratio">
              <p>Co-op density is already a natural 0–1 value (fraction of cooperatives). No transform needed.</p>
            </SubSection>

            <SubSection title="2. Percentile Rank">
              <p>Used for Grid Reliability, Labor, and Fiber. Produces a uniform distribution:</p>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
                score = rank(value) / (N − 1)
              </div>
              <p>For inverse metrics (SAIDI): <code className="text-nodiac-secondary bg-white/5 px-1 rounded">1 − rank</code>.</p>
            </SubSection>

            <SubSection title="3. Log-Transform + Composite">
              <p>Used for Curtailment. Renewable MW is extremely right-skewed (Kern County CA: 8,756 MW vs. median &lt; 100 MW):</p>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
                score = 0.55 × minmax(log1p(MW)) + 0.20 × pipeline_ratio + 0.25 × congestion_flag
              </div>
            </SubSection>

            <SubSection title="Client-Side Utilities">
              <CodeBlock title="src/lib/scoring/normalize.ts">{`// Min-max normalization: [min, max] → [0, 1], clamped
function minMaxNormalize(value, min, max): number

// Inverse: higher raw → lower score (e.g., outage minutes)
function inverseNormalize(value, min, max): number

// Normalize an entire array using min/max of that array
function normalizeArray(values): number[]`}</CodeBlock>
              <p className="text-sm text-gray-400">
                Note: These utilities exist for client-side use but the main normalization happens in the Python pipeline.
              </p>
            </SubSection>
          </Section>

          {/* Weight Profiles */}
          <Section id="weight-profiles" title="Weight Profiles">
            <p>
              Four preset profiles snap all six sliders to predefined configurations.
              Slider range: 0.0–3.0, step: 0.1. Adjusting any slider after selecting a preset switches to &ldquo;Custom&rdquo; mode.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-3 text-gray-400 font-medium">Preset</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium">Co-op</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium">Grid</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium">Curtail</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium">Permit</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium">Labor</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium">Fiber</th>
                    <th className="text-left py-2 pl-3 text-gray-400 font-medium">Rationale</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white font-sans font-medium">Balanced</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-400 text-xs">Equal weight baseline</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white font-sans font-medium">Co-op Priority</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-400 text-xs">Core thesis: co-op territories + permitting</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white font-sans font-medium">Speed to Deploy</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-400 text-xs">Time-to-power constraint</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-white font-sans font-medium">Curtailment Capture</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-400 text-xs">Renewable arbitrage opportunity</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CodeBlock title="Adding a new profile — src/lib/scoring/weight-profiles.ts">{`// Add to the WEIGHT_PROFILES array:
{
  id: 'my-profile',
  name: 'My Profile',
  description: 'What this profile optimizes for',
  weights: {
    coop_density: 2,
    grid_reliability: 1,
    clipped_curtailed: 1.5,
    permitting: 2,
    labor: 1,
    fiber: 0.5,
  },
}`}</CodeBlock>
          </Section>

          {/* Site Screening */}
          <Section id="site-screening" title="Site Screening Flow">
            <p>The screening pipeline processes an uploaded CSV through several stages:</p>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                  <div>
                    <p className="text-white font-medium">CSV Upload</p>
                    <p className="text-gray-400">File parsed by <code className="text-nodiac-secondary bg-white/5 px-1 rounded">parseFleetCSV()</code> → extracts site_name, lat/lon, utility info, raw data.</p>
                    <p className="text-gray-400">Sites inserted into <code className="text-nodiac-secondary bg-white/5 px-1 rounded">portfolio_sites</code> table with county/state from raw CSV data.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                  <div>
                    <p className="text-white font-medium">FIPS Resolution</p>
                    <p className="text-gray-400">Three-strategy cascade: (a) county+state name match against county_scores table, (b) FCC Area API batch lookup by lat/lon, (c) null if unresolvable.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                  <div>
                    <p className="text-white font-medium">Score Lookup</p>
                    <p className="text-gray-400">FIPS code → county_scores row. The site inherits all six criterion scores from its county.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">4</span>
                  <div>
                    <p className="text-white font-medium">Utility Blending</p>
                    <p className="text-gray-400">If CSV identifies the utility type, override coop_density: Co-op → 1.0, IOU → 0.2, Municipal → 0.6.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">5</span>
                  <div>
                    <p className="text-white font-medium">Scoring & Tiering</p>
                    <p className="text-gray-400">Server-side: Balanced (equal weight) average → score + tier. Client-side: real-time re-scoring with any weight profile.</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Utility Classification */}
          <Section id="utility-classification" title="Utility Classification">
            <p>
              The <code className="text-nodiac-secondary bg-white/5 px-1 rounded">classifyUtilityType()</code> function
              detects utility type from CSV raw data and applies a co-op density override:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-3 text-gray-400 font-medium">Detected Type</th>
                    <th className="text-left py-2 pr-3 text-gray-400 font-medium">Keywords Matched</th>
                    <th className="text-left py-2 text-gray-400 font-medium">coop_density Override</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Co-op</td>
                    <td className="py-2 pr-3 text-gray-300 text-xs font-mono">coop, cooperative, co-op</td>
                    <td className="py-2 text-nodiac-secondary font-mono">1.0</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">IOU</td>
                    <td className="py-2 pr-3 text-gray-300 text-xs font-mono">investor, iou, investor-owned</td>
                    <td className="py-2 text-gray-300 font-mono">0.2</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Municipal</td>
                    <td className="py-2 pr-3 text-gray-300 text-xs font-mono">municipal, muni, city of, public power</td>
                    <td className="py-2 text-gray-300 font-mono">0.6</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-white">Unknown</td>
                    <td className="py-2 pr-3 text-gray-300 text-xs font-mono">(no match)</td>
                    <td className="py-2 text-gray-400 font-mono">null (uses county score)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-400">
              This override reflects site-level knowledge: if the CSV says the site is on co-op territory,
              that&apos;s more precise than the county-wide co-op density average.
            </p>
          </Section>

          {/* FIPS Resolution */}
          <Section id="fips-resolution" title="FIPS Resolution">
            <p>
              Every site needs a FIPS code to look up county scores. Resolution uses a three-step cascade:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li><strong className="text-white">County + State name match</strong> — Normalized lowercase lookup against the county_scores table. Fast, no API call.</li>
              <li><strong className="text-white">FCC Area API</strong> — <code className="text-nodiac-secondary bg-white/5 px-1 rounded">geo.fcc.gov/api/census/area?lat=X&lon=Y</code> — returns county FIPS from coordinates. Batched with concurrency limit of 5.</li>
              <li><strong className="text-white">Null</strong> — If both fail, the site gets null scores (unscored).</li>
            </ol>
            <CodeBlock title="FCC API call">{`GET https://geo.fcc.gov/api/census/area?lat=37.7749&lon=-122.4194&format=json
→ { results: [{ county_fips: "06075", county_name: "San Francisco", ... }] }`}</CodeBlock>
          </Section>

          {/* Map Rendering */}
          <Section id="map-rendering" title="Map Rendering">
            <SubSection title="Choropleth (Regional Hubs)">
              <p>
                Uses Mapbox GL with a GeoJSON source of ~3,221 US county boundaries (Census TIGER/Line).
                Composite scores are injected into each feature&apos;s <code className="text-nodiac-secondary bg-white/5 px-1 rounded">properties.compositeScore</code> field,
                then Mapbox&apos;s <code className="text-nodiac-secondary bg-white/5 px-1 rounded">interpolate</code> expression determines fill color.
              </p>
              <p className="text-sm text-gray-400">
                This avoids the Mapbox <code className="text-nodiac-secondary bg-white/5 px-1 rounded">match</code> expression size limit (~3,000 entries).
              </p>
            </SubSection>

            <SubSection title="Color Scale">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#2d2233' }} />
                  <span className="text-xs text-gray-400">min</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#5c2d55' }} />
                  <span className="text-xs text-gray-400">mid</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#8b3578' }} />
                  <span className="text-xs text-gray-400">80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded" style={{ backgroundColor: '#b48fc1' }} />
                  <span className="text-xs text-gray-400">max</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                The 80% stop compresses the upper range so top counties get visual pop. Counties with no data render as #221d28.
              </p>
            </SubSection>

            <SubSection title="Site Markers (Screening)">
              <p>
                Sites render as colored circle markers using <code className="text-nodiac-secondary bg-white/5 px-1 rounded">react-map-gl Marker</code> components.
                Color is determined by tier. Selected sites get a white border and glow effect. Tier filter buttons toggle visibility.
              </p>
            </SubSection>
          </Section>

          {/* API Reference */}
          <Section id="api-reference" title="API Reference">
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="font-mono text-sm text-nodiac-secondary mb-2">GET /api/county-scores</p>
                <p className="text-sm text-gray-400">Returns all ~3,200 county scores. Cached for 1 hour (s-maxage=3600). Falls back to static JSON if Supabase unavailable.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="font-mono text-sm text-nodiac-secondary mb-2">GET /api/hub-regions</p>
                <p className="text-sm text-gray-400">Returns hub region GeoJSON overlays for the map.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="font-mono text-sm text-nodiac-secondary mb-2">POST /api/upload-csv</p>
                <p className="text-sm text-gray-400">Upload a CSV file. Requires auth. Returns upload_id and site_count. Body: FormData with &ldquo;file&rdquo; and optional &ldquo;name&rdquo;.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="font-mono text-sm text-nodiac-secondary mb-2">POST /api/portfolio/[id]/score</p>
                <p className="text-sm text-gray-400">Triggers FIPS resolution + scoring for all sites in the upload. Returns scored results. Requires auth.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="font-mono text-sm text-nodiac-secondary mb-2">GET /api/portfolio/[id]</p>
                <p className="text-sm text-gray-400">Returns upload metadata + all sites with scores. Requires auth.</p>
              </div>
            </div>
          </Section>

          {/* Data Sources */}
          <Section id="data-sources" title="Data Sources">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-3 text-gray-400 font-medium">Dataset</th>
                    <th className="text-left py-2 pr-3 text-gray-400 font-medium">Agency</th>
                    <th className="text-left py-2 pr-3 text-gray-400 font-medium">Vintage</th>
                    <th className="text-left py-2 text-gray-400 font-medium">Used For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">EIA Form 861</td>
                    <td className="py-2 pr-3">Energy Information Admin</td>
                    <td className="py-2 pr-3">2024</td>
                    <td className="py-2">Co-op density + Grid reliability</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">EIA Form 860</td>
                    <td className="py-2 pr-3">Energy Information Admin</td>
                    <td className="py-2 pr-3">2024</td>
                    <td className="py-2">Curtailment proxy (renewable MW)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Census CBP</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2023</td>
                    <td className="py-2">IT labor density</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Census ACS B28002</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2023 (5-yr)</td>
                    <td className="py-2">Fiber proxy (broadband)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Census Population</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2024 vintage</td>
                    <td className="py-2">Labor normalization denominator</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">TIGER/Line Counties</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2024</td>
                    <td className="py-2">County boundary GeoJSON</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-white">FCC Area API</td>
                    <td className="py-2 pr-3">FCC</td>
                    <td className="py-2 pr-3">Live</td>
                    <td className="py-2">Lat/lon → FIPS lookup</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Limitations */}
          <Section id="limitations" title="Known Limitations">
            <ul className="space-y-3 ml-2">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Permitting is uniform</strong> — All counties at 0.5. Single biggest gap. Enrichment via permitting-sentiment skill is pending.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Curtailment is a proxy</strong> — Measures installed MW, not actual curtailment. CAISO reports ~3.4M MWh curtailed in 2024. Adding EIA Form 923 capacity factor gaps would improve this.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Fiber is a subscription proxy</strong> — ACS broadband rates ≠ actual fiber presence. FCC BDC bulk data requires registration.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">No interaction effects</strong> — Weighted average treats criteria independently. A county with high co-op density AND high curtailment is more than additively valuable. Geometric mean or multiplicative model could capture this.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Census noise</strong> — CBP employment counts have 2–5% noise infusion for disclosure avoidance.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">46% zero curtailment</strong> — Counties with no variable renewables score 0.0. Bimodal distribution can distort the map when curtailment weight is high.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Static snapshot</strong> — No temporal dimension. Grid reliability, curtailment, and permitting all change over time.</span>
              </li>
            </ul>
          </Section>

          {/* Extending */}
          <Section id="extending" title="Extending the Model">
            <SubSection title="Adding a New Criterion">
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Add the key to <code className="text-nodiac-secondary bg-white/5 px-1 rounded">CriterionKey</code> union type in <code className="text-nodiac-secondary bg-white/5 px-1 rounded">src/types/regional-hubs.ts</code></li>
                <li>Add label + description to <code className="text-nodiac-secondary bg-white/5 px-1 rounded">CRITERION_LABELS</code> and <code className="text-nodiac-secondary bg-white/5 px-1 rounded">CRITERION_DESCRIPTIONS</code></li>
                <li>Add <code className="text-nodiac-secondary bg-white/5 px-1 rounded">[key]_score: number</code> field to <code className="text-nodiac-secondary bg-white/5 px-1 rounded">CountyScore</code> interface</li>
                <li>Add to <code className="text-nodiac-secondary bg-white/5 px-1 rounded">ALL_CRITERIA</code> array</li>
                <li>Update <code className="text-nodiac-secondary bg-white/5 px-1 rounded">getCriterionValue()</code> in <code className="text-nodiac-secondary bg-white/5 px-1 rounded">county-scorer.ts</code></li>
                <li>Add default weight to all profiles in <code className="text-nodiac-secondary bg-white/5 px-1 rounded">weight-profiles.ts</code></li>
                <li>Add to <code className="text-nodiac-secondary bg-white/5 px-1 rounded">SiteScoreBreakdown</code> in <code className="text-nodiac-secondary bg-white/5 px-1 rounded">screening.ts</code></li>
                <li>Add to <code className="text-nodiac-secondary bg-white/5 px-1 rounded">buildSiteBreakdown()</code> in <code className="text-nodiac-secondary bg-white/5 px-1 rounded">site-scorer.ts</code></li>
                <li>Add column to <code className="text-nodiac-secondary bg-white/5 px-1 rounded">county_scores</code> Supabase table</li>
                <li>Update the Python pipeline to compute the new score</li>
              </ol>
            </SubSection>

            <SubSection title="Planned Upgrades">
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                <li><strong className="text-gray-200">EIA Form 923</strong> — Generation data for capacity factor gap analysis (better curtailment proxy)</li>
                <li><strong className="text-gray-200">FCC BDC</strong> — Location-level fiber availability (replace ACS broadband proxy)</li>
                <li><strong className="text-gray-200">Permitting enrichment</strong> — Batch web research via Claude skill, prioritizing target hub regions</li>
                <li><strong className="text-gray-200">Temporal tracking</strong> — Store score history, show trends over time</li>
                <li><strong className="text-gray-200">Geometric mean option</strong> — Capture interaction effects between criteria</li>
              </ul>
            </SubSection>
          </Section>
        </main>
      </div>
    </div>
  )
}
