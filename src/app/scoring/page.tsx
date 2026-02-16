'use client'

import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ArrowLeft } from 'lucide-react'

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
  { id: 'overview', label: 'Model Overview' },
  { id: 'scoring-math', label: 'Scoring Math' },
  { id: 'six-criteria', label: 'The Six Criteria' },
  { id: 'normalization', label: 'How Data Is Normalized' },
  { id: 'weight-profiles', label: 'Weight Profiles' },
  { id: 'color-modes', label: 'Map Color Modes' },
  { id: 'site-screening', label: 'Site Screening' },
  { id: 'utility-overrides', label: 'Utility Type Overrides' },
  { id: 'data-sources', label: 'Data Sources' },
  { id: 'assumptions', label: 'Assumptions & Limitations' },
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
              <ArrowLeft className="w-3.5 h-3.5" /> Regional Hubs Map
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
              <span className="text-sm text-gray-400">Scoring Methodology</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Scoring Methodology
            </h1>
            <p className="mt-4 text-lg text-nodiac-dusty-lilac max-w-2xl leading-relaxed">
              How every US county is scored, what data feeds the model, and what assumptions are baked in.
            </p>
          </div>

          {/* Model Overview */}
          <Section id="overview" title="Model Overview">
            <p>
              The Regional Hub scoring model evaluates every US county (~3,200 total) across
              <strong className="text-white"> six criteria</strong> relevant to siting distributed data centers
              on cooperative utility territory near renewable generation. Each criterion produces a score
              between 0 and 1. These six scores are combined into a single <strong className="text-white">composite score</strong> from
              0 to 10 using a weighted average.
            </p>
            <p>
              The six criteria were chosen to reflect Nodiac&apos;s thesis: distributed data centers
              co-located with renewable energy on cooperative territory deliver superior economics,
              faster interconnection, and lower permitting risk. The criteria are:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong className="text-white">Co-op Density</strong> — share of county served by electric cooperatives</li>
              <li><strong className="text-white">Grid Reliability</strong> — grid uptime based on 12 years of outage data</li>
              <li><strong className="text-white">Clipped/Curtailed</strong> — presence of renewable generation that may be curtailed</li>
              <li><strong className="text-white">Permitting</strong> — local/state regulatory friendliness toward data centers</li>
              <li><strong className="text-white">Skilled IT Labor</strong> — tech business density as a proxy for available talent</li>
              <li><strong className="text-white">Fiber Availability</strong> — fiber-to-the-premises coverage from FCC data</li>
            </ol>
            <p>
              You can adjust the relative importance of each criterion using weight sliders on the map.
              Four preset profiles are available for common strategic perspectives, or you can set
              custom weights. All scoring updates happen instantly — no waiting for recalculation.
            </p>
          </Section>

          {/* Scoring Math */}
          <Section id="scoring-math" title="Scoring Math">
            <SubSection title="Arithmetic Mean (Default)">
              <p>
                The default composite score is a weighted arithmetic mean. Each county&apos;s six criterion
                scores (0–1 each) are multiplied by their respective weights, summed, divided by the
                total weight, and scaled to 0–10:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
                composite = ( Σ criterion_score<sub>i</sub> × weight<sub>i</sub> ) / ( Σ weight<sub>i</sub> ) × 10
              </div>
              <p>
                If a weight is set to 0, that criterion is excluded from both the numerator and denominator.
                This means zeroing out a criterion never penalises a county — it simply removes that dimension
                from consideration entirely.
              </p>
            </SubSection>

            <SubSection title="Geometric Mean (Optional)">
              <p>
                The geometric mean is available as an alternative scoring mode in Advanced Controls.
                It uses weighted log-space averaging:
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
                composite = exp( Σ weight<sub>i</sub> × ln(score<sub>i</sub> + ε) / Σ weight<sub>i</sub> ) × 10
              </div>
              <p>
                <strong className="text-white">Why use geometric mean?</strong> It penalises counties that
                score near zero on <em>any</em> criterion, even if their other scores are high. A county with
                excellent co-op density but zero curtailment will score much lower under geometric mean than
                arithmetic mean. This rewards <strong className="text-white">balanced performance</strong> across
                all dimensions you care about.
              </p>
              <p className="text-sm text-gray-400">
                The epsilon (ε = 0.001) prevents log(0) errors while keeping near-zero scores heavily penalised.
              </p>
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
              <p className="text-sm text-gray-400">
                Notice how Co-op Priority boosts this county&apos;s score from 5.75 to 6.21 because
                its strongest attribute (co-op density = 0.80) gets 3× weight.
              </p>
            </SubSection>

            <SubSection title="Tier Thresholds (Site Screening)">
              <p>When screening individual sites, composite scores map to three tiers:</p>
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
            </SubSection>
          </Section>

          {/* Six Criteria */}
          <Section id="six-criteria" title="The Six Criteria">
            <div className="space-y-8">
              <SubSection title="1. Co-op Density">
                <p>Share of a county&apos;s electric service territory served by rural electric cooperatives.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> EIA Form 861 (2024) — Service Territory file (11,776 utility-to-county mappings) cross-referenced with the Frame file (3,413 utilities classified by ownership type: cooperative, investor-owned, municipal, etc.).</p>
                  <p><strong className="text-gray-200">Method:</strong> For each county, count the distinct utilities serving it. Calculate the fraction that are cooperatives. Score = co-op count / total count.</p>
                  <p><strong className="text-gray-200">Range:</strong> Natural 0–1 ratio. A county with 3 co-ops out of 4 total utilities scores 0.75. No additional normalization needed.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> 3,097 of 3,143 counties (99%). 117 counties are 100% co-op; 540 have zero co-op presence.</p>
                  <p><strong className="text-gray-200">Assumption:</strong> We count utility <em>presence</em>, not territory area or customer share. A county with one large IOU and one small co-op scores 0.5, even if the IOU serves 95% of load. This was a deliberate simplification — utility service territory boundary data would improve precision but is not freely available at county resolution.</p>
                </div>
              </SubSection>

              <SubSection title="2. Grid Reliability">
                <p>Grid uptime measured by SAIDI (System Average Interruption Duration Index — average outage minutes per customer per year). <strong className="text-white">Inverse metric</strong> — lower SAIDI = higher score. Uses <strong className="text-white">multi-year averaging</strong> across up to 12 years of data.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> EIA Form 861 Reliability files (2013–2024). Approximately 900–1,000 utilities report SAIDI each year. We use the &ldquo;IEEE Standard, Without Major Event Days&rdquo; metric when available, which excludes extreme outlier events (hurricanes, ice storms) for a clearer picture of day-to-day reliability.</p>
                  <p><strong className="text-gray-200">Method:</strong> For each year, map each reporting utility&apos;s SAIDI to the counties in its service territory. Average across utilities within each county to get a single annual SAIDI per county. Then average across all available years per county. Finally, inverse percentile rank: the county with the <em>lowest</em> multi-year SAIDI gets a score near 1.0.</p>
                  <p><strong className="text-gray-200">Why multi-year:</strong> Single-year SAIDI can be skewed by one bad storm or one unusually good year. Averaging across 12 years smooths out anomalies and better reflects structural grid quality — the thing that actually matters for siting a data center.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> ~3,025 of 3,143 counties (96%). The remaining 4% (mostly very small or rural counties with no reporting utility) default to 0.5 (neutral). Each county includes metadata on how many years of data contributed to its score.</p>
                  <p><strong className="text-gray-200">Assumption:</strong> We&apos;re measuring utility-reported reliability, not site-specific reliability. A data center with its own substation or redundant feeds may experience better uptime than the county average suggests. Conversely, a county may score well overall but have pockets of weak distribution infrastructure.</p>
                </div>
              </SubSection>

              <SubSection title="3. Clipped/Curtailed">
                <p>Presence of variable renewable energy (solar + wind) that may be curtailed — an opportunity for behind-the-meter data centers to absorb excess generation.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> EIA Form 860 (2024) — generator-level data for 8,684 variable renewable generators totalling 277,437 MW.</p>
                  <p><strong className="text-gray-200">Method:</strong> Three-component composite score:</p>
                  <div className="bg-white/5 border border-white/10 rounded px-3 py-2 font-mono text-xs text-nodiac-secondary my-2">
                    score = 0.55 × log_norm(installed_MW) + 0.20 × pipeline_pressure + 0.25 × congestion_flag
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                    <li><strong className="text-gray-200">Installed MW (55%)</strong> — Total solar + wind capacity in the county, log-transformed and min-max normalized. Log transform prevents extreme outliers (Kern County CA: 8,756 MW) from dominating.</li>
                    <li><strong className="text-gray-200">Pipeline pressure (20%)</strong> — Ratio of proposed-to-operable generators. Counties with a large buildout pipeline are likely to experience more curtailment as new capacity comes online.</li>
                    <li><strong className="text-gray-200">Congestion flag (25%)</strong> — Binary bonus for counties within known congestion-prone balancing authorities (CAISO, ERCOT, MISO, SPP, BPAT). These ISOs have documented curtailment issues.</li>
                  </ul>
                  <p><strong className="text-gray-200">Coverage:</strong> 1,684 of 3,143 counties (54%). The remaining 46% score 0.0 — they have no variable renewable generation.</p>
                  <p><strong className="text-gray-200">Key assumption:</strong> This is a <em>proxy</em> for curtailment, not a direct measurement. We measure installed renewable capacity and structural congestion risk, not actual MWh curtailed. CAISO reported ~3.4M MWh curtailed in 2024, but county-level curtailment data is not publicly available. A county with large installed solar doesn&apos;t guarantee curtailment — it depends on transmission capacity, load patterns, and market conditions.</p>
                </div>
              </SubSection>

              <SubSection title="4. Permitting">
                <p>Local and state government friendliness toward data center development.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-emerald-400">All 3,143 counties scored using research-based methodology.</strong> 42 verified source citations tracked in a per-county citation registry.</p>
                  <p><strong className="text-gray-200">Sources:</strong> NCSL state incentive database, SDI Alliance policy tracker, H5 Data Centers 2025–2026 state rankings, NAIOP development reports, Data Center Watch moratorium tracker, state regulatory environment assessments.</p>
                  <p><strong className="text-gray-200">Method:</strong> Multi-component scoring:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong className="text-gray-200">State incentive programs (30%)</strong> — tax abatements, enterprise zones, expedited permitting programs</li>
                    <li><strong className="text-gray-200">Regulatory environment (25%)</strong> — overall state regulatory burden, energy policy stance</li>
                    <li><strong className="text-gray-200">Moratorium/opposition risk (25%)</strong> — active moratoria, community opposition, pending restrictive legislation</li>
                    <li><strong className="text-gray-200">Tax policy (20%)</strong> — property tax rates, sales tax exemptions for data center equipment</li>
                  </ul>
                  <p><strong className="text-gray-200">Range:</strong> 0.30 (hostile, active moratoria) → 0.50 (neutral) → 0.85+ (welcoming with strong incentives). Examples: TX = 0.85, WY = 0.83, NJ = 0.39.</p>
                  <p><strong className="text-gray-200">County-level adjustments:</strong> Where specific local data exists, county scores are adjusted. For example, Loudoun County VA is penalised for active moratorium discussions despite Virginia&apos;s otherwise friendly state-level environment. Multiple Georgia counties similarly adjusted for local opposition.</p>
                  <p><strong className="text-gray-200">Assumption:</strong> Scores are primarily state-level with county-level adjustments where moratorium or opposition data exists. Granular county-by-county zoning and planning board research would improve accuracy significantly, but the current approach captures the most material variations. Permitting environments also change — a score from early 2025 may not reflect recent legislative action.</p>
                </div>
              </SubSection>

              <SubSection title="5. Skilled IT Labor">
                <p>Existing tech business density per capita — a <strong className="text-white">proxy for available talent</strong>.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Source:</strong> Census County Business Patterns (CBP) 2023 — counts businesses under NAICS 5182 (Data Processing &amp; Hosting), 5415 (Computer Systems Design), and 517 (Telecommunications). Population from Census 2024 vintage estimates.</p>
                  <p><strong className="text-gray-200">Method:</strong> Sum employees across all three NAICS codes per county, divide by population for a per-10K density rate, then percentile rank normalize across all counties.</p>
                  <p><strong className="text-gray-200">What it measures:</strong> The density of existing tech/telecom businesses in a county. Counties with more data processing, IT consulting, and telecom firms are more likely to have a deeper pool of relevant operational talent nearby.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> 100% of counties. 2,222 of 3,143 have at least one IT establishment; the remaining 921 score 0.</p>
                  <p><strong className="text-gray-200">Limitations (important):</strong> This is a <em>proxy</em>, not a direct labour market measure. CBP counts business establishments, not individual workers available for hire. It doesn&apos;t capture remote workers, freelancers, or talent willing to relocate. A county with one large employer (e.g., a single data center) may score high despite limited market depth. Conversely, counties near major metros may have accessible commuter talent that isn&apos;t captured here. Census employment counts also include 2–5% noise infusion for disclosure avoidance.</p>
                </div>
              </SubSection>

              <SubSection title="6. Fiber Availability">
                <p>Actual fiber-to-the-premises (FTTP) availability from <strong className="text-white">ISP-reported FCC data</strong>.</p>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
                  <p><strong className="text-gray-200">Primary source:</strong> FCC Broadband Data Collection (BDC), December 2024 vintage — county-level summaries via ArcGIS Living Atlas. Measures the percentage of Broadband Serviceable Locations (BSLs) with fiber availability and the number of competing fiber providers per county.</p>
                  <p><strong className="text-gray-200">Fallback source:</strong> Census ACS 5-Year (2023), Table B28002 — broadband subscription rates. Used only for counties missing from BDC data.</p>
                  <p><strong className="text-gray-200">Method:</strong> Composite score = 80% × (fiber BSLs ÷ total BSLs) + 20% × (provider competition, capped at 5 providers). Percentile rank normalization across all counties.</p>
                  <p><strong className="text-gray-200">Why provider competition matters:</strong> A county with 3 fiber ISPs has more robust and redundant infrastructure than one with a single provider. The 20% weight on competition captures market depth beyond simple coverage percentage.</p>
                  <p><strong className="text-gray-200">Coverage:</strong> ~3,234 counties via FCC BDC (primary), remainder via ACS fallback.</p>
                  <p><strong className="text-gray-200">Limitations (important):</strong> ISP-reported data may overstate actual availability (ISPs sometimes report planned coverage as current). This measures consumer/business FTTP, <strong className="text-white">not enterprise dark fiber</strong>, lit fibre routes, or carrier-neutral interconnection points. A county with high residential fiber may still lack the dedicated dark fiber infrastructure data centers require. However, counties with extensive FTTP deployment almost always have better underlying fiber trunk infrastructure — it&apos;s a strong directional signal even if it doesn&apos;t capture the full picture.</p>
                </div>
              </SubSection>
            </div>
          </Section>

          {/* Normalization */}
          <Section id="normalization" title="How Data Is Normalized">
            <p>
              Raw data arrives in wildly different units — outage minutes, installed MW, business counts, percentages.
              To make scores comparable, each criterion is normalized to a 0–1 scale using one of three strategies:
            </p>

            <SubSection title="Direct Ratio">
              <p>
                <strong className="text-white">Used for:</strong> Co-op Density.
                The raw value is already a natural 0–1 fraction (co-op utilities / total utilities). No transformation needed.
              </p>
            </SubSection>

            <SubSection title="Percentile Rank">
              <p>
                <strong className="text-white">Used for:</strong> Grid Reliability, Labor, Fiber.
                Counties are ranked and converted to a uniform 0–1 distribution. The county with the best value
                gets 1.0, the worst gets 0.0, and everyone else is evenly spread between.
              </p>
              <p>
                For inverse metrics like SAIDI (where lower is better), the rank is flipped: lowest SAIDI → highest score.
              </p>
              <p className="text-sm text-gray-400">
                Percentile ranking means the score tells you &ldquo;this county is better than X% of all counties&rdquo;
                rather than an absolute measure. This is useful when the raw distribution is highly skewed.
              </p>
            </SubSection>

            <SubSection title="Log-Transform + Composite">
              <p>
                <strong className="text-white">Used for:</strong> Curtailment.
                Renewable installed MW is extremely right-skewed — Kern County CA has 8,756 MW while the median
                county has less than 100 MW. A straight linear normalization would compress most counties near zero.
                Log transformation spreads the distribution more evenly, then the three sub-components (installed MW,
                pipeline pressure, congestion flag) are combined with fixed weights.
              </p>
            </SubSection>

            <SubSection title="Permitting (Research-Based)">
              <p>
                <strong className="text-white">Used for:</strong> Permitting.
                Scores are assigned directly from policy research rather than computed from a single dataset.
                The multi-component methodology (incentives, regulation, moratorium risk, tax policy) produces
                scores already in the 0–1 range.
              </p>
            </SubSection>
          </Section>

          {/* Weight Profiles */}
          <Section id="weight-profiles" title="Weight Profiles">
            <p>
              Four preset profiles snap all six criteria to predefined weight configurations.
              Each weight ranges from 0.0 to 3.0. A weight of 0 completely removes that criterion
              from scoring. Adjusting any slider after selecting a preset switches to custom mode.
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
                    <td className="py-2 pl-3 font-sans text-gray-400 text-xs">Equal weight baseline — no strategic bias</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white font-sans font-medium">Co-op Priority</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-400 text-xs">Core thesis: co-op territories + permitting friendliness</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white font-sans font-medium">Speed to Deploy</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-400 text-xs">Time-to-power: permitting + reliability + fiber</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-white font-sans font-medium">Curtailment Capture</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-400 text-xs">Renewable arbitrage: find excess generation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Color Modes */}
          <Section id="color-modes" title="Map Color Modes">
            <SubSection title="Percentile (Default)">
              <p>
                Counties are colored based on their <strong className="text-white">rank relative to all other counties</strong>.
                The color ramp uses quantile breakpoints (p20, p40, p60, p80, p95) so you always see meaningful
                variation across the map regardless of how the raw scores are distributed.
              </p>
              <p>
                The top 5% of counties glow <strong className="text-[#4de2e4]">neon teal</strong>. This mode answers
                the question: <em>&ldquo;which counties are the best relative to the rest?&rdquo;</em>
              </p>
            </SubSection>

            <SubSection title="Absolute">
              <p>
                Counties are colored on a <strong className="text-white">fixed 0–10 scale</strong>. A threshold slider
                controls where the purple-to-teal transition occurs (default: 6.5). Counties above the threshold
                glow teal; below are shades of purple.
              </p>
              <p>
                This mode answers a different question: <em>&ldquo;which counties clear a specific quality bar?&rdquo;</em>
                Useful when you have a minimum score target in mind. Under some weight configurations, very few
                counties may glow teal (if the bar is hard to clear) or many may (if the bar is easy).
              </p>
            </SubSection>
          </Section>

          {/* Site Screening */}
          <Section id="site-screening" title="Site Screening">
            <p>
              When you upload a portfolio CSV (list of sites with locations and utility information),
              each site is scored through a five-step process:
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                  <div>
                    <p className="text-white font-medium">Parse the CSV</p>
                    <p className="text-gray-400">Extract site name, latitude/longitude, utility name, and any other raw data fields.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                  <div>
                    <p className="text-white font-medium">Resolve county</p>
                    <p className="text-gray-400">Determine which county each site is in using county/state name matching, or geocoding lat/lon coordinates via the FCC Area API. If neither works, the site remains unscored.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                  <div>
                    <p className="text-white font-medium">Inherit county scores</p>
                    <p className="text-gray-400">The site inherits all six criterion scores from its county. This is the baseline — every site in the same county starts with the same scores.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">4</span>
                  <div>
                    <p className="text-white font-medium">Apply utility override</p>
                    <p className="text-gray-400">If the CSV identifies the utility type (co-op, IOU, municipal), the co-op density score is overridden with a site-specific value (see <a href="#utility-overrides" className="text-nodiac-secondary hover:underline">Utility Type Overrides</a> below).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">5</span>
                  <div>
                    <p className="text-white font-medium">Score and assign tier</p>
                    <p className="text-gray-400">Compute the weighted composite score and assign Strong Fit / Moderate Fit / Weak Fit. You can re-score with different weight profiles instantly.</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Utility Overrides */}
          <Section id="utility-overrides" title="Utility Type Overrides">
            <p>
              When screening a portfolio, if the CSV identifies which utility serves a site, the co-op density
              score is overridden. This reflects <strong className="text-white">site-level knowledge</strong> — if you
              know the site is on co-op territory, that&apos;s more precise than the county-wide co-op density average.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-3 text-gray-400 font-medium">Detected Type</th>
                    <th className="text-left py-2 pr-3 text-gray-400 font-medium">Co-op Density Override</th>
                    <th className="text-left py-2 text-gray-400 font-medium">Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Co-op</td>
                    <td className="py-2 pr-3 text-nodiac-secondary font-mono font-bold">1.0</td>
                    <td className="py-2 text-gray-400">Site is directly on co-op territory — full co-op benefit</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">IOU (Investor-Owned)</td>
                    <td className="py-2 pr-3 text-gray-300 font-mono">0.2</td>
                    <td className="py-2 text-gray-400">Large utility, typically slower interconnection, less flexible</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Municipal</td>
                    <td className="py-2 pr-3 text-gray-300 font-mono">0.6</td>
                    <td className="py-2 text-gray-400">Public power — can be flexible like co-ops, but varies widely</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-white">Unknown</td>
                    <td className="py-2 pr-3 text-gray-400 font-mono">county average</td>
                    <td className="py-2 text-gray-400">Falls back to the county&apos;s co-op density score</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-400">
              The IOU override of 0.2 (not 0.0) reflects that even IOU territory has <em>some</em> value —
              wholesale or special contracts are possible, just less likely and slower than co-op partnerships.
            </p>
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
                    <td className="py-2 pr-3">Energy Information Administration</td>
                    <td className="py-2 pr-3">2013–2024</td>
                    <td className="py-2">Co-op density (2024 service territory) + Grid reliability (12-year SAIDI average)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">EIA Form 860</td>
                    <td className="py-2 pr-3">Energy Information Administration</td>
                    <td className="py-2 pr-3">2024</td>
                    <td className="py-2">Curtailment proxy — solar + wind generator MW (operable + proposed)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">FCC Broadband Data Collection</td>
                    <td className="py-2 pr-3">Federal Communications Commission</td>
                    <td className="py-2 pr-3">Dec 2024</td>
                    <td className="py-2">Fiber availability — FTTP coverage % and provider competition per county</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Census County Business Patterns</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2023</td>
                    <td className="py-2">IT labour density — NAICS 5182, 5415, 517 establishments + employees</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Census Population Estimates</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2024 vintage</td>
                    <td className="py-2">Labour normalization denominator (per-capita density)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Census ACS 5-Year (B28002)</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2023</td>
                    <td className="py-2">Fiber fallback — broadband subscription rates (used when FCC BDC data is missing)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">Permitting research sources</td>
                    <td className="py-2 pr-3">NCSL, SDI Alliance, H5, NAIOP, others</td>
                    <td className="py-2 pr-3">2024–2025</td>
                    <td className="py-2">Permitting scores — state incentives, moratoria, regulatory environment</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-3 text-white">TIGER/Line County Boundaries</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2024</td>
                    <td className="py-2">County boundary polygons for map rendering</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-white">FCC Area API</td>
                    <td className="py-2 pr-3">Federal Communications Commission</td>
                    <td className="py-2 pr-3">Live</td>
                    <td className="py-2">Geocoding — lat/lon → county FIPS code for site screening</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Assumptions & Limitations */}
          <Section id="assumptions" title="Assumptions & Limitations">
            <p>
              These are the things you should keep in mind when interpreting scores. No model captures
              ground truth perfectly — understanding the gaps is as important as understanding the scores.
            </p>
            <ul className="space-y-3 ml-2">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Curtailment is a proxy, not a measurement.</strong> We measure installed renewable MW and structural congestion risk, not actual MWh curtailed. A county with large solar farms doesn&apos;t guarantee curtailment — it depends on transmission capacity, load patterns, and market conditions. Adding EIA Form 923 capacity factor data would improve this significantly.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">46% of counties have zero curtailment score.</strong> Counties with no variable renewable generation score 0.0. This creates a bimodal distribution that can distort the map when curtailment weight is high. Many of these counties may still have viable curtailed power nearby — they just don&apos;t have generators <em>within</em> the county.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Fiber measures FTTP, not enterprise dark fiber.</strong> The FCC BDC data captures ISP-reported fiber-to-the-premises coverage, which strongly correlates with but doesn&apos;t directly measure enterprise/dark fiber infrastructure. A county with high residential fiber may still lack the dedicated dark fiber routes data centers need. Adding proximity to long-haul backbone fiber (e.g., InterTubes dataset) would fill this gap.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Labour is a proxy.</strong> CBP business establishment counts are not the same as hireable labour supply. A county near a major metro may have excellent commuter access to talent that our score doesn&apos;t capture. Conversely, a county with one large data center operator may score high but have limited actual talent availability.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Permitting is primarily state-level.</strong> County-level adjustments exist where moratorium or opposition data is available, but most counties inherit their state&apos;s score. Granular county-by-county zoning and planning board research would improve accuracy, especially in states with mixed permitting environments.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Co-op density counts presence, not territory share.</strong> A county with one large IOU and one small co-op scores 0.5, even if the IOU serves 95% of load. Utility service territory boundary data would fix this but is not freely available at county resolution.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Arithmetic mean treats criteria independently.</strong> A county with high co-op density AND high curtailment is more than additively valuable — the combination enables behind-the-meter economics that neither alone provides. The geometric mean scoring option partially addresses this by penalising weak dimensions, but a true multiplicative model would better capture synergies.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Grid reliability uses utility-reported data.</strong> SAIDI is what utilities report to EIA, not independent measurements. Utilities may under-report, exclude events, or have inconsistent reporting thresholds. The multi-year average (12 years) reduces the impact of any single year&apos;s data quality issues.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-white">Scores are a snapshot.</strong> Grid reliability uses 12-year averaging, but curtailment, permitting, and fiber data are single-vintage snapshots. Permitting environments can change quickly — a score from early 2025 may not reflect recent legislative action or moratorium developments.</span>
              </li>
            </ul>
          </Section>
        </main>
      </div>
    </div>
  )
}
