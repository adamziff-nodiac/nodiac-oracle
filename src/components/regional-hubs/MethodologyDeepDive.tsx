'use client'

import { useState } from 'react'

interface CollapsibleProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <span className="text-gray-900 dark:text-white font-semibold text-lg">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 text-gray-600 dark:text-gray-300 leading-relaxed text-[15px] space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

export function MethodologyDeepDive() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Technical Methodology
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          How the scoring model works, where the data comes from, and what the math actually does.
        </p>
      </div>

      <div className="space-y-3">
        {/* 1. OVERVIEW */}
        <Collapsible title="How the Composite Score Works" defaultOpen>
          <p>
            Every US county (~3,200 total) is scored across <strong className="text-gray-900 dark:text-white">six criteria</strong>,
            each normalized to a <strong className="text-gray-900 dark:text-white">0&ndash;1 scale</strong>. These six scores are
            combined into a single <strong className="text-gray-900 dark:text-white">composite score</strong> from 0 to 10
            using a weighted average. The composite score is what drives the choropleth color on the map.
          </p>
          <p>The formula is:</p>
          <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
            composite = ( &Sigma; criterion_score<sub>i</sub> &times; weight<sub>i</sub> ) / ( &Sigma; weight<sub>i</sub> ) &times; 10
          </div>
          <p>
            In plain terms: multiply each criterion&apos;s 0&ndash;1 score by its slider weight, sum those products,
            divide by the total weight, and scale to 0&ndash;10. If a weight is set to 0, that criterion is excluded
            entirely (both from the numerator and denominator). This means zeroing out a weight doesn&apos;t
            penalize counties&mdash;it simply ignores that dimension.
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">Example:</strong> If Co-op Density = 0.80, Grid Reliability = 0.65,
            and all other scores are 0.50, with Balanced weights (all 1.0):
          </p>
          <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-300">
            (0.80&times;1 + 0.65&times;1 + 0.50&times;1 + 0.50&times;1 + 0.50&times;1 + 0.50&times;1) / 6 &times; 10 = <span className="text-nodiac-secondary">5.75</span>
          </div>
          <p>
            Changing to Co-op Priority (Co-op weight = 3, Permitting = 2, Labor = 0.5, others = 1):
          </p>
          <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-300">
            (0.80&times;3 + 0.65&times;1 + 0.50&times;1 + 0.50&times;2 + 0.50&times;0.5 + 0.50&times;1) / 8.5 &times; 10 = <span className="text-nodiac-secondary">6.21</span>
          </div>
          <p>
            The reweighting happens <strong className="text-gray-900 dark:text-white">entirely client-side</strong> in your browser
            using <code className="text-nodiac-secondary bg-white/5 px-1 rounded">useMemo</code>. Moving a slider
            doesn&apos;t make a network request&mdash;it recomputes all ~3,200 composite scores in milliseconds
            and updates the map instantly.
          </p>
        </Collapsible>

        {/* 2. WEIGHT PRESETS */}
        <Collapsible title="Weight Presets Explained">
          <p>
            Each preset snaps all six sliders to a predefined configuration. You can always adjust
            individual sliders after selecting a preset (this switches to &ldquo;Custom&rdquo; mode).
            Slider range is 0.0&ndash;3.0 with 0.1 step increments.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-2 pr-3 text-gray-400 font-medium">Preset</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Co-op</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Grid</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Curtail</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Permit</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Labor</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">Fiber</th>
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
                </tr>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <td className="py-2 pr-3 text-gray-900 dark:text-white font-sans font-medium">Co-op Priority</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                  <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                  <td className="text-center py-2 px-2">1.0</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <td className="py-2 pr-3 text-gray-900 dark:text-white font-sans font-medium">Speed to Deploy</td>
                  <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                  <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-gray-900 dark:text-white font-sans font-medium">Curtailment Capture</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2">1.5</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                  <td className="text-center py-2 px-2">1.0</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <strong className="text-gray-900 dark:text-white">Rationale:</strong> &ldquo;Co-op Priority&rdquo; reflects
            Nodiac&apos;s core thesis&mdash;co-op territories and permitting friendliness matter most.
            &ldquo;Speed to Deploy&rdquo; is for conversations where time-to-power is the constraint
            (permitting, fiber, and grid readiness). &ldquo;Curtailment Capture&rdquo; targets the
            renewable arbitrage opportunity where excess generation is being wasted.
          </p>
        </Collapsible>

        {/* 3. CRITERIA DEEP DIVE */}
        <Collapsible title="The Six Criteria (What Each One Measures)">
          <div className="space-y-6">
            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-1">1. Co-op Density (coop_density_score)</h4>
              <p>
                Measures the share of a county&apos;s electric service territory served by
                rural electric cooperatives vs. investor-owned utilities (IOUs) or munis. Higher
                co-op density means more territory where Nodiac&apos;s co-op partnership model applies.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Data source:</strong> EIA Form 861 (2024 final release) &mdash;
                annual report from every US electric utility identifying their service territory at the
                county level. The <code className="text-nodiac-secondary bg-white/5 px-1 rounded text-xs">Service_Territory_2024.xlsx</code> file
                maps 2,907 utilities to counties (11,776 rows). The <code className="text-nodiac-secondary bg-white/5 px-1 rounded text-xs">Frame_2024.xlsx</code> file
                classifies each of 3,413 utilities by ownership type.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Method:</strong> For each county FIPS, we count the distinct
                utilities serving that county and calculate the fraction that are cooperatives. Score = co-op
                count / total utility count.
              </p>
              <p className="mt-1 text-sm text-nodiac-secondary">
                Status: Real data. 99% county coverage (3,097 of 3,143). FIPS match rate: 99.6%. 117 counties
                are 100% co-op served; 540 counties have zero co-op presence.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-1">2. Grid Reliability (grid_reliability_score)</h4>
              <p>
                Measures the reliability of the local electric grid using SAIDI (System Average
                Interruption Duration Index) &mdash; the average number of minutes each customer
                experiences without power per year. Lower SAIDI = higher reliability. This is an
                <strong className="text-gray-900 dark:text-white"> inverse metric</strong>: raw outage minutes are
                rank-normalized then inverted so 1 = most reliable.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Data source:</strong> EIA Form 861 Reliability
                Data (2024) &mdash; 971 utilities report SAIDI annually. We prefer the &ldquo;IEEE
                Without Major Event Days&rdquo; metric (col 8) which strips weather anomalies,
                falling back to &ldquo;All Events&rdquo; or &ldquo;Other Standard&rdquo; where unavailable.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Method:</strong> Map each utility&apos;s SAIDI to its
                service territory counties, average across utilities per county, then apply percentile-based
                inverse ranking. Median county SAIDI is ~158 minutes/year.
              </p>
              <p className="mt-1 text-sm text-nodiac-secondary">
                Status: Real data. 96% county coverage (3,025 of 3,143). 905 utilities with valid SAIDI data.
                Remaining 4% default to 0.5 (neutral).
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-1">3. Clipped/Curtailed (clipped_curtailed_score)</h4>
              <p>
                Measures the presence of variable renewable energy (solar + wind) that may be curtailed.
                High curtailment signals an opportunity: a data center co-located with these
                generators can absorb the excess power behind the meter, getting cheap energy
                that would otherwise be wasted.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Data source:</strong> EIA Form 860 (2024) &mdash;
                generator-level data for 16,132 plants. We extract all variable renewables (Solar PV,
                Wind, Solar Thermal) from the Operable sheet (8,684 generators, 277,437 MW total) and
                Proposed sheet for pipeline pressure.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Method:</strong> Three-component composite:
                (1) log-normalized installed renewable MW per county (55% weight) &mdash; uses log transform
                because distribution is extremely skewed (Kern County CA leads at 8,756 MW);
                (2) pipeline pressure ratio (proposed MW / existing MW, 20% weight);
                (3) congestion flag from balancing authority (25% weight) &mdash; counties in CAISO, ERCOT,
                MISO, SPP, or BPAT territories get a congestion bonus.
              </p>
              <p className="mt-1 text-sm text-nodiac-secondary">
                Status: Real data. 54% county coverage (1,684 of 3,143). Remaining 46% have no variable
                renewable generation and score 0.0 (no curtailment opportunity). Top counties: Kern CA,
                Riverside CA, Clark NV, Nolan TX.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-1">4. Permitting (permitting_score)</h4>
              <p>
                Measures how friendly or hostile a county&apos;s local government is toward data center
                development. This is a qualitative score derived from web research on local ordinances,
                zoning codes, moratoria, public hearing records, economic development incentives, and
                media coverage of data center proposals.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Data source:</strong> Claude Code skill
                (<code className="text-nodiac-secondary bg-white/5 px-1 rounded">permitting-sentiment</code>)
                that systematically searches for &ldquo;[County] [State] data center moratorium,&rdquo;
                &ldquo;zoning ordinance,&rdquo; &ldquo;approved,&rdquo; etc. and produces a sentiment
                score (0 = hostile/moratorium, 0.5 = neutral, 1 = actively welcoming with incentives).
                Evidence URLs and summaries are stored alongside each score.
              </p>
              <p className="mt-1 text-sm text-yellow-400/80">
                Status: All counties initialized to 0.5 (neutral). This is the only criterion without
                real data &mdash; it requires per-county web research that will be enriched in batches
                using the permitting sentiment skill.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-1">5. Skilled IT Labor (labor_score)</h4>
              <p>
                Measures the availability of IT and telecom workers in the county. Data centers need
                technicians for deployment and maintenance. Counties near metro areas with existing
                tech workforces score higher. Remote rural counties score lower unless there&apos;s a
                nearby college or military base with relevant workforce.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Data source:</strong> Census County Business
                Patterns (CBP 2023) via Census API (no key required). Three NAICS codes:
                5182 (Data Processing, Hosting &mdash; 594 counties), 5415 (Computer Systems Design &mdash;
                1,481 counties), and 517 (Telecommunications &mdash; 2,167 counties). Population denominator
                from Census Population Estimates (2024 vintage, POPESTIMATE2023).
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Method:</strong> Sum IT employees across all three NAICS
                codes per county, divide by population to get per-10K-residents density, then apply
                percentile rank normalization. Counties with zero IT establishments score at the 0th
                percentile. 2,222 of 3,143 counties have at least one IT establishment.
              </p>
              <p className="mt-1 text-sm text-nodiac-secondary">
                Status: Real data. 100% county coverage. Percentile rank normalization produces a
                uniform distribution from 0 to 1.
              </p>
            </div>

            <div>
              <h4 className="text-gray-900 dark:text-white font-semibold mb-1">6. Fiber Availability (fiber_score)</h4>
              <p>
                Measures actual fiber-to-the-premises (FTTP) availability at the county level using
                ISP-reported data from the FCC. Data centers require high-bandwidth, low-latency
                connectivity, and counties with extensive fiber infrastructure are better positioned
                for data center interconnection.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Primary data source:</strong> FCC Broadband Data Collection
                (BDC), December 2024 vintage &mdash; county-level summaries accessed via ArcGIS Living Atlas.
                Measures the percentage of Broadband Serviceable Locations (BSLs) with fiber availability
                and the number of competing fiber ISPs per county. Fallback: Census ACS 2023 broadband
                subscriptions for any counties not covered by BDC.
              </p>
              <p className="mt-2">
                <strong className="text-gray-700 dark:text-gray-200">Method:</strong> Composite score = 80% &times; (fiber BSLs
                &divide; total BSLs) + 20% &times; (provider competition, capped at 5 providers).
                Percentile rank normalization across all counties. Provider competition captures market
                depth &mdash; multiple fiber ISPs indicate robust underlying infrastructure.
              </p>
              <p className="mt-1 text-sm text-nodiac-secondary">
                Status: Real data (direct measure). ~3,234 counties via FCC BDC, remainder via ACS fallback.
                Significant upgrade from previous broadband subscription proxy.
              </p>
            </div>
          </div>
        </Collapsible>

        {/* 4. NORMALIZATION */}
        <Collapsible title="Normalization (How Raw Data Becomes 0-1 Scores)">
          <p>
            Each criterion&apos;s raw values come in different units (ratios, outage minutes, MW capacity,
            employment counts, subscription rates). To make them comparable, we normalize each to a
            0&ndash;1 scale. The pipeline uses <strong className="text-gray-900 dark:text-white">two normalization strategies</strong> depending
            on the data distribution:
          </p>

          <h4 className="text-gray-900 dark:text-white font-semibold mt-4 mb-1">1. Direct Ratio (Co-op Density)</h4>
          <p>
            Co-op density is already a natural 0&ndash;1 value (fraction of utilities that are cooperatives),
            so no further normalization is needed.
          </p>

          <h4 className="text-gray-900 dark:text-white font-semibold mt-4 mb-1">2. Percentile Rank (Grid, Labor, Fiber)</h4>
          <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
            score = rank(value) / (N &minus; 1)
          </div>
          <p>
            Produces a uniform distribution where each county gets a score proportional to how many other
            counties it outranks. Used when raw distributions are heavily skewed (e.g., labor density is
            dominated by a few metro counties). For inverse metrics like grid SAIDI, we use{' '}
            <code className="text-nodiac-secondary bg-white/5 px-1 rounded">1 &minus; rank</code> so that
            the best (lowest SAIDI) gets the highest score.
          </p>

          <h4 className="text-gray-900 dark:text-white font-semibold mt-4 mb-1">3. Log-Transform + Composite (Curtailment)</h4>
          <div className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
            score = 0.55 &times; log_norm(renewable_MW) + 0.20 &times; pipeline_pressure + 0.25 &times; congestion_flag
          </div>
          <p>
            Curtailment uses <code className="text-nodiac-secondary bg-white/5 px-1 rounded">log1p(MW)</code>{' '}
            normalization because renewable capacity is extremely right-skewed (Kern County CA has 8,756 MW
            while most counties have under 100 MW). The log transform preserves meaningful differences at
            the low end without letting California dominate the entire scale.
          </p>

          <p className="mt-3">
            All normalization happens at <strong className="text-gray-900 dark:text-white">pipeline time</strong> (when the
            data pipeline runs), so the 0&ndash;1 scores stored in the database are ready for immediate
            use by the frontend.
          </p>
        </Collapsible>

        {/* 5. COLOR SCALE */}
        <Collapsible title="Map Color Scale">
          <p>
            The choropleth uses a four-stop linear interpolation on composite score:
          </p>
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: '#2d2233' }} />
              <div>
                <span className="text-gray-900 dark:text-white font-mono text-sm">min score</span>
                <span className="text-gray-400 text-sm ml-2">&mdash; #2d2233 (muted purple, visible against dark base map)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: '#5c2d55' }} />
              <div>
                <span className="text-gray-900 dark:text-white font-mono text-sm">mid score</span>
                <span className="text-gray-400 text-sm ml-2">&mdash; #5c2d55 (mid purple)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: '#8b3578' }} />
              <div>
                <span className="text-gray-900 dark:text-white font-mono text-sm">80% of max</span>
                <span className="text-gray-400 text-sm ml-2">&mdash; #8b3578 (bright Nodiac purple)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: '#b48fc1' }} />
              <div>
                <span className="text-gray-900 dark:text-white font-mono text-sm">max score</span>
                <span className="text-gray-400 text-sm ml-2">&mdash; #b48fc1 (soft orchid, peak desirability)</span>
              </div>
            </div>
          </div>
          <p className="mt-3">
            The mid-score stop is placed at the arithmetic mean of min and max. The 80% stop
            compresses the upper range so that the top-scoring counties get a more noticeable visual
            pop (the jump from #8b3578 to #b48fc1 covers only the top 20% of scores).
            Counties with no score data render as #221d28 (near-black).
          </p>
        </Collapsible>

        {/* 6. DATA PIPELINE */}
        <Collapsible title="Data Pipeline and Current Status">
          <p>
            The data pipeline (<code className="text-nodiac-secondary bg-white/5 px-1 rounded">scripts/build-real-county-scores.py</code>)
            downloads and processes public datasets from federal agencies to compute per-county scores.
            Run with <code className="text-nodiac-secondary bg-white/5 px-1 rounded">uv run scripts/build-real-county-scores.py</code>.
          </p>

          <h4 className="text-gray-900 dark:text-white font-semibold mt-4 mb-1">Pipeline Steps</h4>
          <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
            <li>Downloads FIPS crosswalk for county name &rarr; FIPS code mapping (3,136 entries)</li>
            <li>Downloads EIA Form 861 ZIP (4.4 MB, 20 files) &rarr; co-op density + grid reliability</li>
            <li>Downloads EIA Form 860 ZIP (21 MB, 13 files) &rarr; curtailment proxy</li>
            <li>Fetches Census CBP via API (3 NAICS codes) + population estimates &rarr; labor score</li>
            <li>Queries FCC BDC county summaries via ArcGIS Living Atlas &rarr; fiber availability</li>
            <li>Fetches Census ACS broadband data via API &rarr; fiber fallback</li>
            <li>Assembles all scores per county FIPS, writes to JSON + Supabase</li>
          </ol>

          <h4 className="text-gray-900 dark:text-white font-semibold mt-4 mb-1">Data Source Coverage</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="text-left py-2 pr-3 text-gray-400 font-medium">Criterion</th>
                  <th className="text-left py-2 pr-3 text-gray-400 font-medium">Source</th>
                  <th className="text-left py-2 pr-3 text-gray-400 font-medium">Coverage</th>
                  <th className="text-left py-2 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <td className="py-2 pr-3 text-gray-900 dark:text-white">Co-op Density</td>
                  <td className="py-2 pr-3">EIA Form 861 (2024)</td>
                  <td className="py-2 pr-3">99%</td>
                  <td className="py-2 text-nodiac-secondary">Real data</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <td className="py-2 pr-3 text-gray-900 dark:text-white">Grid Reliability</td>
                  <td className="py-2 pr-3">EIA Form 861 SAIDI (2024)</td>
                  <td className="py-2 pr-3">96%</td>
                  <td className="py-2 text-nodiac-secondary">Real data</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <td className="py-2 pr-3 text-gray-900 dark:text-white">Clipped/Curtailed</td>
                  <td className="py-2 pr-3">EIA Form 860 (2024)</td>
                  <td className="py-2 pr-3">54%</td>
                  <td className="py-2 text-nodiac-secondary">Real data</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <td className="py-2 pr-3 text-gray-900 dark:text-white">Permitting</td>
                  <td className="py-2 pr-3">Claude skill (web research)</td>
                  <td className="py-2 pr-3">0%</td>
                  <td className="py-2 text-yellow-400/80">Default 0.5</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <td className="py-2 pr-3 text-gray-900 dark:text-white">Skilled IT Labor</td>
                  <td className="py-2 pr-3">Census CBP 2023</td>
                  <td className="py-2 pr-3">100%</td>
                  <td className="py-2 text-nodiac-secondary">Real data</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-gray-900 dark:text-white">Fiber</td>
                  <td className="py-2 pr-3">FCC BDC Dec 2024 + ACS fallback</td>
                  <td className="py-2 pr-3">100%</td>
                  <td className="py-2 text-nodiac-secondary">Real data (direct)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="text-gray-900 dark:text-white font-semibold mt-4 mb-1">Potential Upgrades</h4>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-sm">
            <li>
              <strong className="text-gray-700 dark:text-gray-200">Curtailment:</strong> Add EIA Form 923 generation data
              to compute capacity factor gaps (actual vs theoretical CF) as a direct curtailment proxy
            </li>
            <li>
              <strong className="text-gray-700 dark:text-gray-200">Fiber:</strong> Supplement FCC BDC FTTP data with
              long-haul fiber route proximity (e.g., InterTubes dataset) for enterprise/dark fiber scoring
            </li>
            <li>
              <strong className="text-gray-700 dark:text-gray-200">Permitting:</strong> Batch-enrich counties using the
              permitting sentiment skill, prioritizing target hub regions
            </li>
          </ul>
        </Collapsible>

        {/* 7. GEOGRAPHY */}
        <Collapsible title="County Boundaries and FIPS Codes">
          <p>
            The map uses a GeoJSON file of all US county boundaries (~3,221 features) sourced from the
            Census Bureau&apos;s TIGER/Line shapefiles (via plotly/datasets). Each feature has a{' '}
            <code className="text-nodiac-secondary bg-white/5 px-1 rounded">FIPS</code> property &mdash;
            a 5-digit code where the first 2 digits are the state and the last 3 are the county
            (e.g., 27053 = Hennepin County, MN).
          </p>
          <p>
            The choropleth rendering works by joining the GeoJSON features to the score data on FIPS code.
            Composite scores are injected directly into each GeoJSON feature&apos;s properties, then
            Mapbox GL&apos;s data-driven styling evaluates the{' '}
            <code className="text-nodiac-secondary bg-white/5 px-1 rounded">interpolate</code> expression
            per-feature to determine the fill color. This avoids the Mapbox style expression size limit
            (~3,000 entries in a{' '}
            <code className="text-nodiac-secondary bg-white/5 px-1 rounded">match</code> expression)
            and keeps rendering performant.
          </p>
        </Collapsible>

        {/* 8. LIMITATIONS */}
        <Collapsible title="Known Limitations and Caveats">
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-gray-900 dark:text-white">Permitting scores are all 0.5 by default</strong> &mdash;
              this is the most impactful criterion for real decision-making, and it&apos;s currently
              uniform across all counties. As the permitting sentiment skill enriches counties, the map
              will differentiate more meaningfully. This is the single biggest gap in the model.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Curtailment is a proxy, not a measurement</strong> &mdash;
              actual curtailment data is only reported by ISOs at the regional level (CAISO reports
              ~3.4M MWh curtailed in 2024). Our EIA-860 score measures <em>potential</em> for curtailment
              based on installed renewable MW and congestion-prone balancing authorities. Adding EIA Form
              923 generation data would give capacity factor gaps as a better proxy.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Fiber score measures FTTP, not enterprise dark fiber</strong> &mdash;
              the FCC BDC data captures ISP-reported fiber-to-the-premises availability at Broadband
              Serviceable Locations. This is a significant improvement over the previous ACS broadband
              subscription proxy, but it still measures consumer/business fiber, not dedicated dark fiber
              routes or carrier-neutral interconnection infrastructure that data centers specifically need.
              ISPs may also overstate availability in their FCC filings.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">Census CBP employment data has noise infusion</strong> &mdash;
              the Census Bureau adds random noise (2&ndash;5%) to employee counts for disclosure avoidance.
              At the county level, this is acceptable for ranking purposes but not precise enough for
              exact headcount analysis.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">46% of counties have zero curtailment score</strong> &mdash;
              this is factually correct (they have no variable renewable generation), but it creates a
              bimodal distribution that can visually distort the map when curtailment weight is high.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">No interaction effects</strong> &mdash; the weighted
              average treats criteria independently. In reality, a county with high co-op density
              AND high curtailment is more than additively valuable (that&apos;s the behind-the-meter
              arbitrage play). A multiplicative or geometric mean model could capture this.
            </li>
            <li>
              <strong className="text-gray-900 dark:text-white">No temporal dimension</strong> &mdash; scores are static
              snapshots. Grid reliability, curtailment, and permitting all change over time. Future
              versions will track <code className="text-nodiac-secondary bg-white/5 px-1 rounded">last_permitting_update</code> timestamps.
            </li>
          </ul>
        </Collapsible>
      </div>
    </section>
  )
}
