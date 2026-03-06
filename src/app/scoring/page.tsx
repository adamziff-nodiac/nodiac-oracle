'use client'

import Link from 'next/link'
import { LogoLink } from '@/components/LogoLink'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ArrowLeft, ExternalLink } from 'lucide-react'

/* ── Helper Components ─────────────────────────────── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
        <span className="w-1 h-7 bg-nodiac-secondary rounded-full" />
        {title}
      </h2>
      <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">{children}</div>
    </section>
  )
}

function SubSection({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3" id={id}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed">{children}</div>
    </div>
  )
}

function DataBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4 space-y-2 text-sm">
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <strong className="text-gray-700 dark:text-gray-200">{children}</strong>
}

function MethodDropdown({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <details className="group mt-3">
      <summary className="text-sm text-nodiac-secondary cursor-pointer hover:underline select-none font-medium">
        {title || 'Methodology Details'}
      </summary>
      <div className="mt-3 pl-4 border-l-2 border-nodiac-secondary/20 space-y-3 text-sm text-gray-600 dark:text-gray-300">
        {children}
      </div>
    </details>
  )
}

function FormulaBlock({ children }: { children: string }) {
  return (
    <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
      {children}
    </div>
  )
}

function Assumption({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-yellow-500 mt-0.5 flex-shrink-0">⚠</span>
      <span>{children}</span>
    </div>
  )
}

function CodeBlock({ children, title }: { children: string; title?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
      {title && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400 font-mono">
          {title}
        </div>
      )}
      <pre className="px-4 py-3 bg-gray-50 dark:bg-white/[0.02] overflow-x-auto text-sm font-mono text-gray-600 dark:text-gray-300 leading-relaxed">
        {children}
      </pre>
    </div>
  )
}

/* ── Table of Contents ─────────────────────────────── */

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'seven-criteria', label: 'The Seven Criteria' },
  { id: 'weight-profiles', label: 'Weight Profiles' },
  { id: 'site-screening', label: 'Site Screening' },
  { id: 'data-sources', label: 'Data Sources & Quality' },
  { id: 'limitations', label: 'Assumptions & Limitations' },
  { id: 'roadmap', label: 'Planned Improvements' },
  { id: 'technical', label: 'Technical Reference' },
]

/* ── Page ──────────────────────────────────────────── */

export default function ScoringPage() {
  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-[#0f0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-transparent backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <LogoLink />
          <div className="flex items-center gap-2 min-w-0">
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
                className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10 space-y-2">
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
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <Link href="/screening" className="text-sm text-nodiac-secondary hover:underline">Screening</Link>
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Methodology</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Site Scoring Methodology
            </h1>
            <p className="mt-4 text-lg text-gray-500 dark:text-nodiac-dusty-lilac max-w-2xl leading-relaxed">
              How we evaluate counties and sites for distributed data center development at renewable energy sites.
            </p>
          </div>

          {/* ═══ OVERVIEW ═══ */}
          <Section id="overview" title="Overview">
            <p>
              Nodiac&apos;s scoring model evaluates every U.S. county across <strong className="text-gray-900 dark:text-white">seven criteria</strong> that
              determine suitability for distributed data center development at IPP and utility sites. The model produces a
              composite score (0&ndash;10) that captures power infrastructure, renewable energy opportunity, regulatory
              environment, workforce availability, connectivity, and interconnection pipeline.
            </p>
            <p>
              The tool serves two functions:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-gray-900 dark:text-white">Regional Hub Analysis</strong> &mdash; County-level heat map identifying the best regions for distributed deployment</li>
              <li><strong className="text-gray-900 dark:text-white">Site Screening</strong> &mdash; Evaluate specific IPP portfolio sites against the same criteria, with site-level overrides where available (e.g., co-op territory check)</li>
            </ul>
            <p>
              Each criterion is independently scored 0&ndash;1, then combined via a weighted average (arithmetic or geometric mean). Four preset weight
              profiles let you emphasize different development strategies (co-op partnerships, curtailment capture,
              speed to deploy). Changing weights is instant &mdash; all recomputation happens in the browser.
            </p>

            <DataBox>
              <p><Label>Data vintage:</Label> Scores are built from federal datasets (EIA, FCC, Census, LBNL) and ArcGIS spatial data. Most sources are 2023&ndash;2024 vintage. Permitting scores are refreshed quarterly.</p>
              <p><Label>Coverage:</Label> All 3,143 U.S. counties are scored. Individual criterion coverage ranges from 54% (curtailment &mdash; counties with no renewables score 0) to 100% (co-op density, labor, fiber).</p>
              <p><Label>Tiering:</Label> Both the county map and site screening use percentile-based ranking &mdash; no fixed score thresholds. Tiers reflect relative position within the dataset, so they stay meaningful regardless of scoring mode or weight profile.</p>
            </DataBox>
          </Section>

          {/* ═══ THE SEVEN CRITERIA ═══ */}
          <Section id="seven-criteria" title="The Seven Criteria">
            <p>
              Each criterion captures a distinct dimension of site suitability. All are scored 0&ndash;1 independently
              before being combined. The sections below explain what each measures, why it matters for development
              decisions, and how the score is computed.
            </p>

            <div className="space-y-10">

              {/* ── 1. Co-op Density ── */}
              <SubSection title="1. Co-op Density">
                <p>
                  <strong className="text-gray-900 dark:text-white">What it measures:</strong> Whether the site or county is served by cooperative
                  or public power utilities, and what fraction of the county&apos;s land area falls within co-op/public power
                  service territories.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Co-ops and public power districts are Nodiac&apos;s ideal
                  utility partners. They control their own generation and distribution infrastructure, can offer
                  behind-the-meter power purchase arrangements, typically have faster interconnection timelines than
                  IOUs, and are actively seeking new load to fill underutilized capacity. A site inside a co-op territory
                  has a fundamentally different development timeline than one served by an IOU with a 5-year
                  interconnection queue.
                </p>

                <DataBox>
                  <p><Label>Source:</Label> ArcGIS &ldquo;America Electrical Coop Service Territories&rdquo; &mdash; 833 co-op and public power district service territory polygons. Data from Oak Ridge National Lab (ORNL), Los Alamos National Lab (LANL), Idaho National Lab (INL), and the National Geospatial-Intelligence Agency (NGA).</p>
                  <p><Label>Vintage:</Label> 2025</p>
                  <p><Label>Coverage:</Label> 100% of counties. Every county is checked for territory overlap.</p>
                  <p><Label>Confidence:</Label> High &mdash; authoritative federal spatial data covering all known co-op and public power territories.</p>
                </DataBox>

                <MethodDropdown>
                  <p><strong className="text-gray-900 dark:text-white">County-level score (Regional Hubs):</strong></p>
                  <FormulaBlock>score = co-op territory area within county / total county area</FormulaBlock>
                  <p>
                    The pipeline downloads all 833 co-op/public power territory polygons from ArcGIS, builds a unified
                    coverage geometry, then for each county computes the intersection area as a fraction of total county area.
                    A county fully covered by co-op territories scores 1.0; a county with no coverage scores 0.0.
                  </p>
                  <p><strong className="text-gray-900 dark:text-white">Site-level score (Screening):</strong></p>
                  <FormulaBlock>score = 1.0 if site lat/lon is inside a co-op territory, else 0.0</FormulaBlock>
                  <p>
                    A spatial point-in-polygon query via the ArcGIS REST API checks whether the site&apos;s coordinates fall
                    within any co-op/public power territory. This is binary: in territory = 1.0, not in territory = 0.0.
                    If the site is inside a territory, the utility name is returned (e.g., &ldquo;Dairyland Power Cooperative&rdquo;).
                  </p>
                  <p>
                    <strong className="text-gray-900 dark:text-white">Fallback:</strong> If coordinates aren&apos;t available,
                    the system falls back to keyword classification from the CSV data &mdash; matching utility names against
                    known patterns (Co-op &rarr; 1.0, IOU &rarr; 0.2, Municipal &rarr; 0.6).
                  </p>
                  <Assumption>
                    ArcGIS boundaries may not reflect recent service territory changes. Some territories overlap at boundaries.
                    The spatial check doesn&apos;t distinguish between a site with 100 MW of available capacity at a co-op vs. one
                    with 2 MW &mdash; both score 1.0.
                  </Assumption>
                </MethodDropdown>
              </SubSection>

              {/* ── 2. Grid Reliability ── */}
              <SubSection title="2. Grid Reliability">
                <p>
                  <strong className="text-gray-900 dark:text-white">What it measures:</strong> How reliable the local power grid is, based on
                  historical outage duration data (SAIDI &mdash; System Average Interruption Duration Index, measured in
                  minutes of outage per customer per year).
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Grid reliability directly affects data center uptime
                  and backup requirements. A county with 80 minutes/year average outage (top quartile nationally) vs.
                  200 minutes/year (bottom quartile) represents a fundamentally different operational environment.
                  More reliable grids mean less reliance on backup generators, lower fuel costs, and simpler SLA
                  compliance. This is <em>inverse-scored</em>: lower outage = higher score.
                </p>

                <DataBox>
                  <p><Label>Source:</Label> EIA Form 861 Reliability Data &mdash; annual SAIDI reporting from ~900&ndash;1,000 U.S. electric utilities. We use the &ldquo;IEEE Without Major Event Days&rdquo; metric, which removes extreme weather events to better reflect structural grid quality.</p>
                  <p><Label>Vintage:</Label> 2013&ndash;2024 (12 years of data)</p>
                  <p><Label>Coverage:</Label> ~3,025 of 3,143 counties (96%). The remaining 4% (mostly small rural counties with non-reporting utilities) default to 0.5.</p>
                  <p><Label>Confidence:</Label> High &mdash; 12 years of data with ~900+ utilities per year. Multi-year averaging makes individual-year anomalies negligible.</p>
                </DataBox>

                <MethodDropdown>
                  <p>The scoring pipeline works in five steps:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>
                      <strong className="text-gray-900 dark:text-white">Map utilities to counties.</strong> Using the EIA Form 861 Service Territory
                      data (2024 vintage), build a lookup of which counties each utility serves. A single utility may serve
                      multiple counties.
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-white">Download annual SAIDI.</strong> For each year 2013&ndash;2024, download the EIA
                      Reliability file and extract SAIDI values per utility. Priority: IEEE Without Major Event Days (col 8)
                      → IEEE All Events (col 5) → Other Standard (col 17).
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-white">Average utilities per county per year.</strong> If a county is served by
                      utilities A (120 min), B (110 min), and C (130 min), the county&apos;s SAIDI for that year = (120 + 110 + 130) / 3 = 120 min.
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-white">Average across years per county.</strong> If a county has data for
                      2015&ndash;2024 (10 years), take the arithmetic mean of all 10 annual averages. Counties with more years of
                      data produce more stable scores.
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-white">Inverse percentile rank.</strong> Rank all counties by their multi-year SAIDI
                      average. The county with the lowest SAIDI (most reliable grid) gets score 1.0; the county with the highest
                      SAIDI (least reliable) gets score 0.0. Percentile ranking handles outliers better than min-max normalization.
                    </li>
                  </ol>
                  <FormulaBlock>score = 1 - rank(multi_year_avg_SAIDI) / (N - 1)</FormulaBlock>
                  <Assumption>
                    Utility-to-county mapping uses the 2024 service territory for all years, which may not perfectly reflect
                    historical territory boundaries. Utilities are weighted equally when averaging per county &mdash; ideally
                    we&apos;d weight by customer count, but that data isn&apos;t available in this pipeline.
                  </Assumption>
                  <Assumption>
                    The 4% of counties without data default to 0.5 (neutral). Averaging from neighboring counties could improve
                    this, but the impact on overall rankings is minimal given 96% real coverage.
                  </Assumption>
                </MethodDropdown>
              </SubSection>

              {/* ── 3. Clipped / Curtailed ── */}
              <SubSection title="3. Clipped / Curtailed">
                <p>
                  <strong className="text-gray-900 dark:text-white">What it measures:</strong> How much renewable energy generation exists in
                  the area and how likely it is to be curtailed &mdash; representing an opportunity for behind-the-meter
                  data center load to monetize stranded power.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Why it matters:</strong> The Nodiac thesis depends on deploying compute where
                  power is being wasted. Nationally, ~20 million MWh of renewable energy are curtailed annually across
                  U.S. ISOs. Counties in congested regions &mdash; ERCOT West Texas (8+ TWh curtailed in 2024), CAISO
                  Southern California (3.4M MWh), SPP Great Plains (6x increase since 2020) &mdash; represent the highest-value
                  opportunities for behind-the-meter deployment.
                </p>

                <DataBox>
                  <p><Label>Sources:</Label> EIA Form 860 (2024) for installed renewable capacity (8,684 variable generators, 277,437 MW total) + EIA Form 923 for plant-level generation data (capacity factor gap analysis) + ISO/RTO market reports (CAISO, ERCOT, SPP, MISO, PJM) for curtailment intensity by region.</p>
                  <p><Label>Vintage:</Label> EIA 860 (2024), EIA 923 (2023&ndash;2024), ISO market data (2023&ndash;2024)</p>
                  <p><Label>Coverage:</Label> 1,684 of 3,143 counties (54%) have variable renewable generation. The remaining 46% score 0.0 &mdash; no renewables means no curtailment opportunity.</p>
                  <p><Label>Confidence:</Label> Medium-High &mdash; installed capacity data is solid, and the CF gap analysis provides plant-level curtailment signals. The ISO intensity scores are calibrated from published market reports but are zone-level approximations, not county-level measurements.</p>
                </DataBox>

                <MethodDropdown>
                  <p>The score uses a four-component composite when EIA Form 923 data is available, or a three-component fallback:</p>

                  <p><strong className="text-gray-900 dark:text-white">Primary formula (with 923 CF gap):</strong></p>
                  <FormulaBlock>{'score = 0.30 × log_norm(installed_MW) + 0.15 × pipeline_pressure\n     + 0.20 × ISO_curtailment_intensity + 0.35 × CF_gap_923'}</FormulaBlock>

                  <p><strong className="text-gray-900 dark:text-white">Fallback formula (without 923 data):</strong></p>
                  <FormulaBlock>score = 0.40 × log_norm(installed_MW) + 0.20 × pipeline_pressure + 0.40 × ISO_curtailment_intensity</FormulaBlock>

                  <p><strong className="text-gray-900 dark:text-white">Component 1: CF Gap from EIA 923 (35%)</strong></p>
                  <p>
                    The most direct measurement of actual curtailment. For each renewable plant in EIA Form 923, the pipeline
                    computes the gap between <em>expected</em> capacity factor (from NREL ATB state-level benchmarks) and
                    <em>actual</em> capacity factor (generation / nameplate / hours). A large gap indicates the plant is producing
                    less than it should, likely due to curtailment. Plant-level gaps are aggregated to county level.
                  </p>

                  <p><strong className="text-gray-900 dark:text-white">Component 2: Installed Renewable MW (30%)</strong></p>
                  <p>
                    Total nameplate capacity of solar PV, solar thermal, and onshore/offshore wind generators in the county,
                    from EIA Form 860 &ldquo;Operable&rdquo; sheet. Log-transformed and min-max normalized because the distribution is
                    extremely skewed (Kern County CA: 8,756 MW vs. national median &lt; 100 MW). Log transform prevents a few
                    mega-counties from dominating the scale.
                  </p>

                  <p><strong className="text-gray-900 dark:text-white">Component 3: ISO Curtailment Intensity (20%)</strong></p>
                  <p>
                    Each county&apos;s generators are mapped to their balancing authority. The BA receives a curtailment intensity
                    score (0&ndash;1) based on published ISO/RTO market data:
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs mt-2">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                          <th className="text-left py-1.5 pr-3 text-gray-500 dark:text-gray-400">ISO/RTO</th>
                          <th className="text-left py-1.5 pr-3 text-gray-500 dark:text-gray-400">Score</th>
                          <th className="text-left py-1.5 text-gray-500 dark:text-gray-400">Basis</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">ERCOT</td><td className="py-1.5 pr-3">0.95</td><td className="py-1.5">8+ TWh curtailed (2024), worst in U.S. West/Panhandle zones most affected</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">CAISO</td><td className="py-1.5 pr-3">0.85</td><td className="py-1.5">3.4M MWh curtailed (2024), 93% solar, SP15 zone midday shoulder seasons</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">SPP</td><td className="py-1.5 pr-3">0.80</td><td className="py-1.5">1,097 MW avg hourly wind curtailment (2023), 6x increase since 2020</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">MISO</td><td className="py-1.5 pr-3">0.60</td><td className="py-1.5">508 MW avg hourly wind curtailment (2023), West Region most congested</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">BPA</td><td className="py-1.5 pr-3">0.55</td><td className="py-1.5">Hydro/wind interaction during spring runoff; Pacific NW wind curtailment</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">IID</td><td className="py-1.5 pr-3">0.50</td><td className="py-1.5">Small but congested Southern California desert territory</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">PJM</td><td className="py-1.5 pr-3">0.40</td><td className="py-1.5">Curtailment jumped 6x in 2024 (Northern Virginia data center congestion)</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">NEVP</td><td className="py-1.5 pr-3">0.35</td><td className="py-1.5">Growing solar curtailment with Nevada buildout</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">NYISO</td><td className="py-1.5 pr-3">0.25</td><td className="py-1.5">Moderate, growing with offshore wind pipeline</td></tr>
                        <tr className="border-b border-gray-100 dark:border-white/5"><td className="py-1.5 pr-3 text-gray-900 dark:text-white">ISO-NE</td><td className="py-1.5 pr-3">0.20</td><td className="py-1.5">Lower curtailment, but growing</td></tr>
                        <tr><td className="py-1.5 pr-3 text-gray-900 dark:text-white">Other</td><td className="py-1.5 pr-3">0.10</td><td className="py-1.5">Default for balancing authorities with minimal reported curtailment</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Sources: CAISO Production &amp; Curtailments Data (2024), Modo Energy ERCOT analysis (2024),
                    SPP 2024 Annual State of the Market Report, MISO/Potomac Economics 2024 State of Market Report,
                    PJM 2025 Renewable Dispatch Data Request Results, EIA Today in Energy (2024).
                  </p>

                  <p><strong className="text-gray-900 dark:text-white">Component 4: Pipeline Pressure (15%)</strong></p>
                  <p>
                    Ratio of proposed renewable MW (from EIA Form 860 &ldquo;Proposed&rdquo; sheet) to existing renewable MW in each county.
                    High pipeline pressure means new generation is being built that will increase future curtailment risk.
                    Counties with large proposed-to-existing ratios are where the grid is about to get more congested.
                  </p>

                  <Assumption>
                    ISO curtailment intensity scores are zone-level approximations applied to all counties within a BA.
                    Actual curtailment varies significantly by node and season &mdash; ERCOT West Zone accounts for the
                    majority of ERCOT curtailment, but all ERCOT counties receive the same BA-level score.
                  </Assumption>
                  <Assumption>
                    Counties with no renewable generation score 0.0. This is intentional &mdash; no generation means no
                    curtailment opportunity &mdash; but creates a bimodal distribution (46% at zero, 54% above) that can
                    distort the map when curtailment weight is high.
                  </Assumption>
                </MethodDropdown>
              </SubSection>

              {/* ── 4. Permitting ── */}
              <SubSection title="4. Permitting">
                <p>
                  <strong className="text-gray-900 dark:text-white">What it measures:</strong> How favorable the regulatory environment is for
                  data center development &mdash; combining state incentive programs, regulatory posture, moratorium risk,
                  and tax policy.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Permitting timelines and regulatory risk can make
                  or break a project. Texas offers sales tax exemptions and fast-track permitting for data centers.
                  Wyoming has no corporate income tax and streamlined siting. Meanwhile, Virginia&apos;s Loudoun County
                  (the largest data center market in the world) has imposed restrictions, and several Georgia counties
                  have enacted outright moratoria. Understanding the regulatory landscape before selecting a site prevents
                  multi-year delays.
                </p>

                <DataBox>
                  <p><Label>Method:</Label> Scores are generated by an AI-powered research workflow that systematically finds and analyzes news articles, policy changes, legislation, and regulatory actions related to data center permitting at the state level.</p>
                  <p><Label>Process:</Label> The workflow (1) searches for recent news, legislative actions, and regulatory filings related to data center siting in each state, (2) categorizes findings into four scoring components, (3) assigns state-level scores with county-level adjustments where specific moratorium or opposition data exists, and (4) generates verified citation URLs for every finding.</p>
                  <p><Label>Scoring components:</Label> State incentive programs (30%), regulatory environment (25%), moratorium/opposition risk (25%), tax policy (20%).</p>
                  <p><Label>Refresh:</Label> Runs on the first day of each quarter. Frequency can be increased for regions of active interest.</p>
                  <p><Label>Citations:</Label> 42 verified source URLs in the current dataset, linked per-county via the citation registry.</p>
                  <p><Label>Range:</Label> 0.30 (hostile, active moratoria) → 0.50 (neutral) → 0.85+ (welcoming with strong incentives).</p>
                </DataBox>

                <MethodDropdown>
                  <p><strong className="text-gray-900 dark:text-white">How articles map to scores:</strong></p>
                  <p>
                    The AI research workflow searches for news articles, legislation, and policy documents related to data center
                    permitting in each state. Articles are classified into the four scoring components:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 ml-2">
                    <li>
                      <strong className="text-gray-900 dark:text-white">Incentive programs (30%):</strong> Tax exemptions (sales, property, income),
                      enterprise zones, utility rate programs, fast-track permitting programs. Articles about new incentive
                      legislation or expansion of existing programs increase this component. States like Texas (sales tax
                      exemption), Virginia (custom rate programs), and Ohio (tax abatements) score high.
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-white">Regulatory environment (25%):</strong> Speed and predictability of permitting
                      processes, utility commission attitudes, environmental review requirements. States with streamlined
                      siting processes and supportive utility commissions score higher. California&apos;s CEQA requirements and
                      multi-agency review lower this component.
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-white">Moratorium/opposition risk (25%):</strong> Active or proposed moratoria,
                      community opposition movements, restrictive zoning changes. Articles about moratoria (e.g., Loudoun
                      County VA, several GA counties) significantly lower this component. This is the most county-specific
                      component &mdash; a state may be generally favorable but have pockets of local opposition.
                    </li>
                    <li>
                      <strong className="text-gray-900 dark:text-white">Tax policy (20%):</strong> Corporate income tax rates, property tax structures,
                      data center-specific tax frameworks. States with no corporate income tax (WY, SD, NV, TX) or specific
                      data center tax incentives score highest.
                    </li>
                  </ul>
                  <p className="text-sm">
                    <strong className="text-gray-900 dark:text-white">Example scores:</strong> TX = 0.85 (strong incentives, no income tax, fast permitting),
                    WY = 0.83 (no taxes, minimal regulation), ND = 0.80 (emerging incentives, favorable environment),
                    NJ = 0.39 (high taxes, complex permitting, community opposition in some areas).
                  </p>
                  <Assumption>
                    Scores are primarily state-level with county adjustments. Granular county-by-county zoning research
                    would further improve accuracy. The AI workflow may miss very recent policy changes between quarterly runs.
                  </Assumption>
                </MethodDropdown>
              </SubSection>

              {/* ── 5. Skilled IT Labor ── */}
              <SubSection title="5. Skilled IT Labor">
                <p>
                  <strong className="text-gray-900 dark:text-white">What it measures:</strong> The density of existing technology businesses in
                  a county &mdash; a proxy for available technical workforce. Counts data processing facilities, IT consulting
                  firms, and telecom companies relative to population.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Data centers need qualified technicians, network
                  engineers, and operations staff. Counties with an existing IT sector presence have a proven talent pool
                  and established training pipelines. A county near a metro area with multiple data processing firms is
                  more likely to support rapid staffing than a remote county with no tech presence.
                </p>

                <DataBox>
                  <p><Label>Source:</Label> Census County Business Patterns (CBP) 2023 &mdash; establishment counts under NAICS 5182 (Data Processing &amp; Hosting), 5415 (Computer Systems Design), and 517 (Telecommunications). Population from Census 2024 vintage estimates.</p>
                  <p><Label>Vintage:</Label> CBP 2023, Population 2024</p>
                  <p><Label>Coverage:</Label> 100% of counties. 2,222 of 3,143 have at least one IT establishment; 921 score 0.</p>
                  <p><Label>Confidence:</Label> Medium &mdash; CBP is the best freely available county-level business data, but has 2&ndash;5% noise infusion for disclosure avoidance and doesn&apos;t capture remote workers or commuters.</p>
                </DataBox>

                <MethodDropdown>
                  <p><strong className="text-gray-900 dark:text-white">Calculation:</strong></p>
                  <ol className="list-decimal list-inside space-y-1.5 ml-2">
                    <li>Sum establishment counts across NAICS 5182, 5415, and 517 for each county</li>
                    <li>Divide by county population and multiply by 10,000 (density per 10K residents)</li>
                    <li>Percentile rank normalize across all counties</li>
                  </ol>
                  <FormulaBlock>{"density = (NAICS_5182 + NAICS_5415 + NAICS_517) / population × 10,000\nscore = percentile_rank(density) / (N - 1)"}</FormulaBlock>

                  <p><strong className="text-gray-900 dark:text-white">Neighboring county influence:</strong></p>
                  <p>
                    Labor markets don&apos;t stop at county lines. A site in a rural county adjacent to a metro area benefits from
                    the metro&apos;s workforce, even though the county itself may have few IT businesses. To capture this, the
                    pipeline applies a neighbor-blended score using county boundary adjacency from the GeoJSON data:
                  </p>
                  <FormulaBlock>blended_score = 0.75 × county_score + 0.25 × avg(neighbor_scores)</FormulaBlock>
                  <p>
                    This gives a 25% weight to the average labor score of geographically adjacent counties. A rural county
                    scoring 0.1 that borders a metro county scoring 0.9 would receive a blended score of approximately 0.30
                    instead of 0.10 &mdash; reflecting the reality that workers commute across county lines.
                  </p>

                  <Assumption>
                    CBP counts business <em>establishments</em>, not individual workers. A county with one large employer (e.g.,
                    a single data center campus) may score high despite limited labor market depth. Conversely, counties near
                    major metros may have accessible talent that commutes in but isn&apos;t captured in CBP data &mdash; the neighbor
                    blending partially addresses this.
                  </Assumption>
                  <Assumption>
                    CBP data has 2&ndash;5% noise infusion for disclosure avoidance. This is negligible for ranking purposes
                    but means exact establishment counts shouldn&apos;t be treated as precise.
                  </Assumption>
                </MethodDropdown>
              </SubSection>

              {/* ── 6. Fiber Availability ── */}
              <SubSection title="6. Fiber Availability">
                <p>
                  <strong className="text-gray-900 dark:text-white">What it measures:</strong> The share of locations in a county where at least
                  one ISP offers fiber-to-the-premises (FTTP) service, plus the number of competing fiber providers.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Data centers require reliable, high-bandwidth
                  connectivity. While FTTP availability doesn&apos;t directly measure enterprise dark fiber or carrier-neutral
                  interconnection points, counties with extensive consumer/business fiber deployment almost always have
                  better underlying fiber trunk infrastructure. Multiple competing providers indicate a mature fiber market
                  with redundant routes &mdash; critical for data center connectivity.
                </p>

                <DataBox>
                  <p><Label>Primary source:</Label> FCC Broadband Data Collection (BDC), December 2024 &mdash; county-level summaries via ArcGIS Living Atlas. Measures the percentage of Broadband Serviceable Locations (BSLs) with FTTP availability and the number of competing fiber providers.</p>
                  <p><Label>Fallback source:</Label> Census ACS 5-Year (2023), Table B28002 &mdash; broadband subscription rates, used only for counties missing from BDC.</p>
                  <p><Label>Vintage:</Label> FCC BDC December 2024 (primary), ACS 2023 5-year (fallback)</p>
                  <p><Label>Coverage:</Label> ~3,234 counties via FCC BDC, remainder via ACS fallback. Effectively 100%.</p>
                  <p><Label>Confidence:</Label> Medium-High &mdash; FCC BDC is the most comprehensive fiber infrastructure dataset available, based on ISP-reported data. Quality improved significantly since BDC replaced Form 477 in 2023.</p>
                </DataBox>

                <MethodDropdown>
                  <p><strong className="text-gray-900 dark:text-white">Composite score:</strong></p>
                  <FormulaBlock>{"raw = 0.80 × (fiber_BSLs / total_BSLs) + 0.20 × (providers / 5, capped at 1.0)\nscore = percentile_rank(raw) / (N - 1)"}</FormulaBlock>
                  <p>
                    The 80/20 split weights actual fiber availability heavily while giving credit for provider
                    competition. The provider count is capped at 5 because additional providers beyond 5 add diminishing
                    value for infrastructure assessment.
                  </p>
                  <Assumption>
                    ISP-reported data may overstate actual availability &mdash; ISPs sometimes report planned coverage as
                    available. This measures consumer/business FTTP, not enterprise dark fiber, lit fiber routes, or
                    carrier-neutral interconnection points. A county with high residential fiber may still lack the dedicated
                    infrastructure a 50 MW data center needs. However, extensive FTTP deployment is a strong signal of
                    underlying trunk fiber.
                  </Assumption>
                </MethodDropdown>
              </SubSection>

              {/* ── 7. Queue Pressure ── */}
              <SubSection title="7. Queue Pressure">
                <p>
                  <strong className="text-gray-900 dark:text-white">What it measures:</strong> The volume of renewable and storage projects sitting
                  in the interconnection queue for each county, from Lawrence Berkeley National Lab&apos;s &ldquo;Queued Up&rdquo; dataset.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Why it matters:</strong> Interconnection queues are a leading indicator of where
                  renewable energy investment is headed. Counties with large queued MW relative to existing capacity will see
                  more generation come online in the next 3&ndash;5 years &mdash; and with it, more potential curtailment. For Nodiac,
                  high queue pressure signals future behind-the-meter opportunity: developers are already committing capital to
                  these areas, but transmission constraints mean much of that generation may be clipped or curtailed.
                </p>

                <DataBox>
                  <p><Label>Source:</Label> LBNL &ldquo;Queued Up&rdquo; dataset (2025 Edition) &mdash; covers ~97% of U.S. generating capacity in interconnection queues across all major ISOs/RTOs and non-ISO utilities.</p>
                  <p><Label>Vintage:</Label> 2025</p>
                  <p><Label>Coverage:</Label> Counties with active queue entries. Counties with no queued projects score 0.</p>
                  <p><Label>Confidence:</Label> Medium-High &mdash; LBNL data is the most comprehensive public source for queue data, but queue entries are notoriously volatile (many projects withdraw before completion).</p>
                </DataBox>

                <MethodDropdown>
                  <p><strong className="text-gray-900 dark:text-white">Calculation:</strong></p>
                  <ol className="list-decimal list-inside space-y-1.5 ml-2">
                    <li>Download the LBNL Queued Up dataset (renewable + storage projects)</li>
                    <li>Map each project to its county using plant location data</li>
                    <li>Sum queued MW per county</li>
                    <li>Percentile rank normalize across all counties with queue entries</li>
                  </ol>
                  <FormulaBlock>score = percentile_rank(total_queued_MW) / (N - 1)</FormulaBlock>
                  <Assumption>
                    Many queued projects never reach commercial operation &mdash; historically, only ~20&ndash;25% of projects
                    entering U.S. interconnection queues are completed. The score treats all queue entries equally regardless
                    of development stage, which may overstate actual future generation in some counties.
                  </Assumption>
                </MethodDropdown>
              </SubSection>

            </div>
          </Section>

          {/* ═══ WEIGHT PROFILES ═══ */}
          <Section id="weight-profiles" title="Weight Profiles">
            <p>
              Four preset profiles configure all seven weights for different development strategies. You can also adjust
              weights manually &mdash; any manual change switches to &ldquo;Custom&rdquo; mode. Weight range: 0.0&ndash;3.0.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <th className="text-left py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">Preset</th>
                    <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Co-op</th>
                    <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Grid</th>
                    <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Curtail</th>
                    <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Permit</th>
                    <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Labor</th>
                    <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Fiber</th>
                    <th className="text-center py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Queue</th>
                    <th className="text-left py-2 pl-3 text-gray-500 dark:text-gray-400 font-medium">When to use</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white font-sans font-medium">Balanced</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-500 dark:text-gray-400 text-xs">General screening with no strong priors</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white font-sans font-medium">Co-op Priority</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="py-2 pl-3 font-sans text-gray-500 dark:text-gray-400 text-xs">Prioritizing co-op partnerships and favorable permitting</td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white font-sans font-medium">Speed to Deploy</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-500 dark:text-gray-400 text-xs">Minimizing time-to-power &mdash; fast permitting, reliable grid, fiber ready</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-gray-900 dark:text-white font-sans font-medium">Curtailment Capture</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2">1.5</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                    <td className="text-center py-2 px-2">1.0</td>
                    <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                    <td className="py-2 pl-3 font-sans text-gray-500 dark:text-gray-400 text-xs">Maximizing stranded renewable energy opportunity</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* ═══ SITE SCREENING ═══ */}
          <Section id="site-screening" title="Site Screening">
            <p>
              The site screening tool evaluates individual sites from an uploaded CSV portfolio. Each site inherits
              county-level scores with a site-specific co-op territory override:
            </p>

            <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4">
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Upload Portfolio CSV</p>
                    <p className="text-gray-500 dark:text-gray-400">CSV with site names, lat/lon coordinates, and optionally utility info. Supports Fleet CIR Validated and consolidated formats.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">County Resolution</p>
                    <p className="text-gray-500 dark:text-gray-400">Each site is matched to a U.S. county using county/state names from the CSV, or via the FCC Area API (lat/lon → FIPS code) if names aren&apos;t available.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Score Inheritance</p>
                    <p className="text-gray-500 dark:text-gray-400">The site inherits all seven criterion scores from its county (co-op density, grid reliability, curtailment, permitting, labor, fiber, queue pressure).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">4</span>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Site-Level Co-op Check</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      If coordinates are available, an ArcGIS spatial query checks whether the site is inside a co-op territory (1.0 if yes, 0.0 if no).
                      If coordinates aren&apos;t available, falls back to keyword classification from CSV utility data (Co-op → 1.0, IOU → 0.2, Municipal → 0.6).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-nodiac-secondary/20 text-nodiac-secondary text-xs font-bold flex items-center justify-center mt-0.5">5</span>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Composite Score & Tier</p>
                    <p className="text-gray-500 dark:text-gray-400">Weighted average produces a 0&ndash;10 composite → Strong/Moderate/Weak tier. You can re-score with different weight profiles instantly in the browser.</p>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ═══ DATA SOURCES & QUALITY ═══ */}
          <Section id="data-sources" title="Data Sources & Quality">
            <p>
              All scoring data comes from publicly available federal datasets and authoritative geospatial sources.
              No proprietary data is used.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <th className="text-left py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">Dataset</th>
                    <th className="text-left py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">Agency</th>
                    <th className="text-left py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">Vintage</th>
                    <th className="text-left py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">Used For</th>
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">ArcGIS Co-op Territories</td>
                    <td className="py-2 pr-3">ORNL / LANL / INL / NGA</td>
                    <td className="py-2 pr-3">2025</td>
                    <td className="py-2 pr-3">Co-op density (area-based + site check)</td>
                    <td className="py-2"><span className="text-green-500 font-medium">High</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">EIA Form 861 Reliability</td>
                    <td className="py-2 pr-3">Energy Information Admin</td>
                    <td className="py-2 pr-3">2013&ndash;2024</td>
                    <td className="py-2 pr-3">Grid reliability (multi-year SAIDI)</td>
                    <td className="py-2"><span className="text-green-500 font-medium">High</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">EIA Form 861 Service Territory</td>
                    <td className="py-2 pr-3">Energy Information Admin</td>
                    <td className="py-2 pr-3">2024</td>
                    <td className="py-2 pr-3">Utility-to-county mapping</td>
                    <td className="py-2"><span className="text-green-500 font-medium">High</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">EIA Form 860</td>
                    <td className="py-2 pr-3">Energy Information Admin</td>
                    <td className="py-2 pr-3">2024</td>
                    <td className="py-2 pr-3">Curtailment (renewable MW + BA)</td>
                    <td className="py-2"><span className="text-green-500 font-medium">High</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">EIA Form 923</td>
                    <td className="py-2 pr-3">Energy Information Admin</td>
                    <td className="py-2 pr-3">2023&ndash;2024</td>
                    <td className="py-2 pr-3">Curtailment CF gap analysis</td>
                    <td className="py-2"><span className="text-green-500 font-medium">High</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">ISO/RTO Market Reports</td>
                    <td className="py-2 pr-3">CAISO, ERCOT, SPP, MISO, PJM</td>
                    <td className="py-2 pr-3">2023&ndash;2024</td>
                    <td className="py-2 pr-3">Curtailment intensity by region</td>
                    <td className="py-2"><span className="text-yellow-500 font-medium">Medium</span> <span className="text-xs text-gray-500">(zone-level)</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">LBNL Queued Up</td>
                    <td className="py-2 pr-3">Lawrence Berkeley National Lab</td>
                    <td className="py-2 pr-3">2025</td>
                    <td className="py-2 pr-3">Queue pressure (interconnection queues)</td>
                    <td className="py-2"><span className="text-green-500 font-medium">Medium-High</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">AI Research Workflow</td>
                    <td className="py-2 pr-3">NCSL, SDI Alliance, H5 DC, NAIOP, DCW</td>
                    <td className="py-2 pr-3">Quarterly</td>
                    <td className="py-2 pr-3">Permitting scores + citations</td>
                    <td className="py-2"><span className="text-yellow-500 font-medium">Medium</span> <span className="text-xs text-gray-500">(state-level)</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">Census CBP</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2023</td>
                    <td className="py-2 pr-3">IT labor density</td>
                    <td className="py-2"><span className="text-yellow-500 font-medium">Medium</span> <span className="text-xs text-gray-500">(proxy)</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">FCC BDC</td>
                    <td className="py-2 pr-3">Federal Communications Commission</td>
                    <td className="py-2 pr-3">Dec 2024</td>
                    <td className="py-2 pr-3">Fiber availability (FTTP)</td>
                    <td className="py-2"><span className="text-green-500 font-medium">Medium-High</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">Census ACS B28002</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2023 (5-yr)</td>
                    <td className="py-2 pr-3">Fiber fallback (broadband subs)</td>
                    <td className="py-2"><span className="text-yellow-500 font-medium">Medium</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-white/5">
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">Census Population</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2024 vintage</td>
                    <td className="py-2 pr-3">Labor normalization</td>
                    <td className="py-2"><span className="text-green-500 font-medium">High</span></td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">TIGER/Line Counties</td>
                    <td className="py-2 pr-3">Census Bureau</td>
                    <td className="py-2 pr-3">2024</td>
                    <td className="py-2 pr-3">County boundary GeoJSON</td>
                    <td className="py-2"><span className="text-green-500 font-medium">High</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* ═══ ASSUMPTIONS & LIMITATIONS ═══ */}
          <Section id="limitations" title="Assumptions & Limitations">
            <p>
              This model is a screening tool, not a site selection decision. It identifies promising regions and
              flags potential issues, but every site requires boots-on-the-ground due diligence. Key assumptions
              and known limitations:
            </p>
            <ul className="space-y-4 ml-2">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Permitting is primarily state-level.</strong> The AI research workflow captures state-level policy and county-specific moratoria, but doesn&apos;t assess individual township zoning codes, conditional use permit requirements, or neighborhood-level opposition. A state-level &ldquo;friendly&rdquo; score doesn&apos;t guarantee a specific site will permit smoothly.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Curtailment is zone-level, not node-level.</strong> ISO curtailment intensity scores are applied uniformly across a balancing authority. In reality, curtailment is highly localized &mdash; in ERCOT, 20% of nodes account for 77% of total curtailment. County-level variation within an ISO is partially captured by the EIA 923 CF gap analysis, but node-level precision is not yet available.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Fiber measures FTTP, not enterprise dark fiber.</strong> FCC BDC data captures ISP-reported fiber-to-the-premises coverage, not enterprise dark fiber routes, carrier-neutral interconnection points, or data center-grade connectivity. Counties with high residential fiber usually have better trunk infrastructure, but this isn&apos;t guaranteed.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Labor is a business-count proxy.</strong> Census CBP counts business establishments, not individual workers available for hire. The neighbor-blending helps account for commuting patterns, but the score doesn&apos;t capture remote workers, staffing agency availability, or training program pipelines.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Queue entries are volatile.</strong> Only ~20&ndash;25% of projects entering U.S. interconnection queues are completed. The queue pressure score treats all entries equally, which may overstate future generation in some counties. However, even a high withdrawal rate indicates developer interest in the area.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">46% of counties have zero curtailment.</strong> Counties with no renewable generation score 0.0 for curtailment. This is intentional (no generation = no curtailment opportunity) but creates a bimodal distribution that can distort the map when curtailment weight is high.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Snapshot data.</strong> Grid reliability uses 12-year averaging for stability. Other criteria are single-vintage snapshots. Permitting scores refresh quarterly; all other data refreshes when the pipeline is re-run (typically when EIA/FCC publish new vintages).</span>
              </li>
            </ul>
          </Section>

          {/* ═══ PLANNED IMPROVEMENTS ═══ */}
          <Section id="roadmap" title="Planned Improvements">
            <ul className="space-y-3 ml-2">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-nodiac-secondary mt-1.5 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Negative LMP frequency</strong> &mdash; Count hours with negative locational marginal prices per pricing node, then aggregate to counties. Negative pricing is the market signal that directly causes economic curtailment. Available from all major ISOs via the gridstatus open-source library.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-nodiac-secondary mt-1.5 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Enterprise fiber routes</strong> &mdash; Proximity to long-haul backbone fiber (e.g., InterTubes dataset) for direct measurement of data center-grade connectivity instead of the FTTP proxy.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-nodiac-secondary mt-1.5 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Temporal tracking</strong> &mdash; Store score history over time to show trends. Useful for tracking how a region&apos;s attractiveness changes as policies shift, grid upgrades complete, or new generation comes online.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-nodiac-secondary mt-1.5 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Water availability criterion</strong> &mdash; Data centers require cooling water. Integrating USGS water availability data or drought severity indices could add a valuable eighth criterion, particularly for air-cooled vs. water-cooled site decisions.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-nodiac-secondary mt-1.5 flex-shrink-0" />
                <span><strong className="text-gray-900 dark:text-white">Sub-county zoning data</strong> &mdash; Township-level zoning and land use data would sharpen the permitting score beyond state-level policy, identifying specific parcels that are already zoned for industrial/commercial use.</span>
              </li>
            </ul>
          </Section>

          {/* ═══ TECHNICAL REFERENCE ═══ */}
          <Section id="technical" title="Technical Reference">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Scoring formulas, visualization modes, and implementation details.
            </p>

            <details className="group mt-4">
              <summary className="text-sm text-nodiac-secondary cursor-pointer hover:underline select-none font-medium">
                Composite Score Formulas
              </summary>
              <div className="mt-3 space-y-4">
                <p>
                  Each county and site receives a composite score from 0 to 10. Two scoring modes are available:
                </p>
                <p><strong className="text-gray-900 dark:text-white">Arithmetic Mean (default):</strong></p>
                <FormulaBlock>composite = ( &Sigma; criterion_score_i &times; weight_i ) / ( &Sigma; weight_i ) &times; 10</FormulaBlock>
                <p>
                  Each criterion score is 0&ndash;1. Weights range from 0 to 3. If a weight is set to 0, that criterion is
                  excluded entirely &mdash; it doesn&apos;t penalize the county, it&apos;s simply ignored.
                </p>
                <p><strong className="text-gray-900 dark:text-white">Geometric Mean:</strong></p>
                <FormulaBlock>{'composite = exp( Σ(weight_i × ln(score_i + ε)) / Σ(weight_i) ) × 10'}</FormulaBlock>
                <p>
                  The geometric mean naturally penalizes counties that score near zero on any criterion, rewarding
                  balanced performance across all dimensions. A county scoring 0.0 on co-op density but 1.0 on everything
                  else would be heavily penalized under geometric mean but only slightly affected under arithmetic.
                  Uses epsilon (&epsilon; = 0.001) to handle zero scores. Toggle between modes in the Advanced Controls panel.
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-4">Worked Example</p>
                <p>
                  County with: Co-op = 0.80, Grid = 0.65, Curtailment = 0.50, Permitting = 0.50, Labor = 0.50, Fiber = 0.50, Queue = 0.40
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="text-left py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">Profile</th>
                        <th className="text-left py-2 pr-3 text-gray-500 dark:text-gray-400 font-medium">Weights</th>
                        <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Arithmetic</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 dark:border-white/5">
                        <td className="py-2 pr-3 text-gray-900 dark:text-white font-medium">Balanced</td>
                        <td className="py-2 pr-3 text-sm">All = 1.0</td>
                        <td className="py-2 text-nodiac-secondary font-bold">5.50</td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-white/5">
                        <td className="py-2 pr-3 text-gray-900 dark:text-white font-medium">Co-op Priority</td>
                        <td className="py-2 pr-3 text-sm">Co-op 3, Permit 2, Queue 0.5, rest 0.5&ndash;1</td>
                        <td className="py-2 text-nodiac-secondary font-bold">6.04</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-3 text-gray-900 dark:text-white font-medium">Curtailment Capture</td>
                        <td className="py-2 pr-3 text-sm">Curtail 3, Queue 2, Grid 1.5, rest 0.5&ndash;1</td>
                        <td className="py-2 text-nodiac-secondary font-bold">5.05</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </details>

            <details className="group mt-4">
              <summary className="text-sm text-nodiac-secondary cursor-pointer hover:underline select-none font-medium">
                Map Visualization & Site Tiers
              </summary>
              <div className="mt-3 space-y-4">
                <p>
                  The county map uses a <strong className="text-gray-900 dark:text-white">continuous color scale</strong> &mdash; not discrete tier buckets. Two modes are available:
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Percentile (default):</strong> Counties are ranked by composite score and colored by quantile.
                  The top ~5% appear in neon teal, tapering through orchid to dark purple. This highlights relative
                  standouts regardless of the absolute score distribution. Switching weight profiles or scoring modes
                  re-ranks instantly.
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Absolute:</strong> Colors are mapped to a fixed 0&ndash;10 scale
                  with an adjustable highlight threshold (default 6.5). Counties above the threshold appear in teal;
                  those below fade toward purple. This mode is only available with arithmetic scoring &mdash;
                  geometric scores don&rsquo;t distribute evenly on a fixed scale.
                </p>

                <p className="text-sm font-medium text-gray-900 dark:text-white mt-4" id="site-screening-tiers">Site Screening Tiers</p>
                <p>
                  When screening individual sites (via CSV upload), each site is assigned a tier
                  based on its <strong className="text-gray-900 dark:text-white">percentile rank within the uploaded portfolio</strong>:
                </p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#4de2e4]" />
                    <span className="text-sm"><strong className="text-gray-900 dark:text-white">Strong Fit:</strong> top ~33% of sites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#b48fc1]" />
                    <span className="text-sm"><strong className="text-gray-900 dark:text-white">Moderate Fit:</strong> middle ~34%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                    <span className="text-sm"><strong className="text-gray-900 dark:text-white">Weak Fit:</strong> bottom ~33%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Changing weights or switching between arithmetic and geometric scoring re-ranks the portfolio and
                  tiers shift accordingly.
                </p>
              </div>
            </details>

            <details className="group mt-4">
              <summary className="text-sm text-nodiac-secondary cursor-pointer hover:underline select-none font-medium">
                Architecture & Directory Structure
              </summary>
              <div className="mt-3 space-y-4">
                <p>
                  Three layers: <strong className="text-gray-900 dark:text-white">Python data pipeline</strong> (runs offline),
                  <strong className="text-gray-900 dark:text-white"> Next.js 16 app</strong> (Bun runtime, Tailwind v4),
                  <strong className="text-gray-900 dark:text-white"> Supabase backend</strong> (Postgres + Auth).
                  All weight changes happen client-side for zero-latency interaction.
                </p>
                <CodeBlock title="Key Files">{`scripts/build-real-county-scores.py   # Offline data pipeline (7 criteria)
src/lib/scoring/county-scorer.ts      # computeCompositeScore() — arithmetic + geometric
src/lib/scoring/site-scorer.ts        # scoreSite(), scoreSiteWeighted()
src/lib/scoring/weight-profiles.ts    # 4 preset weight profiles
src/lib/scoring/normalize.ts          # minMaxNormalize, inverseNormalize
src/lib/geo/fips-lookup.ts            # FCC Area API → FIPS code
src/lib/geo/coop-territory-lookup.ts  # ArcGIS co-op territory spatial query
src/hooks/useCountyScores.ts          # Fetch + cache county scores
src/hooks/useWeightedScores.ts        # Client-side composite scoring`}</CodeBlock>
              </div>
            </details>

            <details className="group mt-4">
              <summary className="text-sm text-nodiac-secondary cursor-pointer hover:underline select-none font-medium">
                API Reference
              </summary>
              <div className="mt-3 space-y-3">
                <DataBox>
                  <p className="font-mono text-sm text-nodiac-secondary">GET /api/county-scores</p>
                  <p className="text-gray-500 dark:text-gray-400">All ~3,200 county scores. Cached 1 hour.</p>
                </DataBox>
                <DataBox>
                  <p className="font-mono text-sm text-nodiac-secondary">GET /api/hub-regions</p>
                  <p className="text-gray-500 dark:text-gray-400">Hub region GeoJSON overlays.</p>
                </DataBox>
                <DataBox>
                  <p className="font-mono text-sm text-nodiac-secondary">POST /api/upload-csv</p>
                  <p className="text-gray-500 dark:text-gray-400">Upload portfolio CSV. Requires auth. Returns upload_id.</p>
                </DataBox>
                <DataBox>
                  <p className="font-mono text-sm text-nodiac-secondary">POST /api/portfolio/[id]/score</p>
                  <p className="text-gray-500 dark:text-gray-400">Trigger FIPS resolution + scoring. Returns scored results.</p>
                </DataBox>
                <DataBox>
                  <p className="font-mono text-sm text-nodiac-secondary">GET /api/portfolio/[id]</p>
                  <p className="text-gray-500 dark:text-gray-400">Upload metadata + all scored sites.</p>
                </DataBox>
              </div>
            </details>

            <details className="group mt-4">
              <summary className="text-sm text-nodiac-secondary cursor-pointer hover:underline select-none font-medium">
                Normalization Strategies
              </summary>
              <div className="mt-3 space-y-3">
                <p><strong className="text-gray-900 dark:text-white">1. Area Ratio</strong> &mdash; Co-op density. Natural 0&ndash;1 value, no transform needed.</p>
                <p><strong className="text-gray-900 dark:text-white">2. Percentile Rank</strong> &mdash; Grid reliability, labor, fiber, queue pressure. Produces uniform distribution. For inverse metrics (SAIDI): 1 &minus; rank.</p>
                <FormulaBlock>score = rank(value) / (N - 1)</FormulaBlock>
                <p><strong className="text-gray-900 dark:text-white">3. Log-Transform + Composite</strong> &mdash; Curtailment. Handles extreme skew in renewable MW distribution.</p>
                <p><strong className="text-gray-900 dark:text-white">4. CF Gap</strong> &mdash; Curtailment (923 component). Expected minus actual capacity factor, aggregated to county.</p>
              </div>
            </details>

            <details className="group mt-4">
              <summary className="text-sm text-nodiac-secondary cursor-pointer hover:underline select-none font-medium">
                Adding a New Criterion
              </summary>
              <div className="mt-3 space-y-2">
                <ol className="list-decimal list-inside space-y-1.5 ml-2 text-sm">
                  <li>Add key to <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">CriterionKey</code> union in <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">types/regional-hubs.ts</code></li>
                  <li>Add label + description to <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">CRITERION_LABELS</code></li>
                  <li>Add <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">[key]_score: number</code> to <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">CountyScore</code> interface</li>
                  <li>Update <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">getCriterionValue()</code> in county-scorer.ts</li>
                  <li>Add default weight to all profiles in weight-profiles.ts</li>
                  <li>Add to <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">SiteScoreBreakdown</code> + <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">buildSiteBreakdown()</code></li>
                  <li>Add column to Supabase <code className="text-nodiac-secondary bg-gray-100 dark:bg-white/5 px-1 rounded">county_scores</code> table</li>
                  <li>Update Python pipeline to compute the new score</li>
                </ol>
              </div>
            </details>
          </Section>
        </main>
      </div>
    </div>
  )
}
