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
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-semibold text-lg">{title}</span>
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
        <div className="px-5 pb-5 text-gray-300 leading-relaxed text-[15px] space-y-4">
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
        <h2 className="text-3xl font-black text-white tracking-tight">
          Technical Methodology
        </h2>
        <p className="mt-2 text-gray-400">
          How the scoring model works, where the data comes from, and what the math actually does.
        </p>
      </div>

      <div className="space-y-3">
        {/* 1. OVERVIEW */}
        <Collapsible title="How the Composite Score Works" defaultOpen>
          <p>
            Every US county (~3,200 total) is scored across <strong className="text-white">six criteria</strong>,
            each normalized to a <strong className="text-white">0&ndash;1 scale</strong>. These six scores are
            combined into a single <strong className="text-white">composite score</strong> from 0 to 10
            using a weighted average. The composite score is what drives the choropleth color on the map.
          </p>
          <p>The formula is:</p>
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
            composite = ( &Sigma; criterion_score<sub>i</sub> &times; weight<sub>i</sub> ) / ( &Sigma; weight<sub>i</sub> ) &times; 10
          </div>
          <p>
            In plain terms: multiply each criterion&apos;s 0&ndash;1 score by its slider weight, sum those products,
            divide by the total weight, and scale to 0&ndash;10. If a weight is set to 0, that criterion is excluded
            entirely (both from the numerator and denominator). This means zeroing out a weight doesn&apos;t
            penalize counties&mdash;it simply ignores that dimension.
          </p>
          <p>
            <strong className="text-white">Example:</strong> If Co-op Density = 0.80, Grid Reliability = 0.65,
            and all other scores are 0.50, with Balanced weights (all 1.0):
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-300">
            (0.80&times;1 + 0.65&times;1 + 0.50&times;1 + 0.50&times;1 + 0.50&times;1 + 0.50&times;1) / 6 &times; 10 = <span className="text-nodiac-secondary">5.75</span>
          </div>
          <p>
            Changing to Co-op Priority (Co-op weight = 3, Permitting = 2, Labor = 0.5, others = 1):
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-gray-300">
            (0.80&times;3 + 0.65&times;1 + 0.50&times;1 + 0.50&times;2 + 0.50&times;0.5 + 0.50&times;1) / 8.5 &times; 10 = <span className="text-nodiac-secondary">6.21</span>
          </div>
          <p>
            The reweighting happens <strong className="text-white">entirely client-side</strong> in your browser
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
                <tr className="border-b border-white/10">
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
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white font-sans font-medium">Balanced</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white font-sans font-medium">Co-op Priority</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                  <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                  <td className="text-center py-2 px-2">1.0</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white font-sans font-medium">Speed to Deploy</td>
                  <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                  <td className="text-center py-2 px-2 text-gray-500">0.5</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">3.0</td>
                  <td className="text-center py-2 px-2">1.0</td>
                  <td className="text-center py-2 px-2 text-nodiac-secondary font-bold">2.0</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-white font-sans font-medium">Curtailment Capture</td>
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
            <strong className="text-white">Rationale:</strong> &ldquo;Co-op Priority&rdquo; reflects
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
              <h4 className="text-white font-semibold mb-1">1. Co-op Density (coop_density_score)</h4>
              <p>
                Measures the share of a county&apos;s electric service territory served by
                rural electric cooperatives vs. investor-owned utilities (IOUs) or munis. Higher
                co-op density means more territory where Nodiac&apos;s co-op partnership model applies.
              </p>
              <p className="mt-2">
                <strong className="text-gray-200">Target data source:</strong> EIA Form 861 &mdash; annual
                report from every US electric utility identifying their service territory at the
                county level. The form includes utility type classification (cooperative, IOU, municipal,
                federal). We calculate the fraction of utilities serving each county that are cooperatives,
                weighted by the approximate territory share.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Current status: Seeded from state-level estimates with per-county jitter. Planned upgrade
                to actual EIA-861 service territory data.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-1">2. Grid Reliability (grid_reliability_score)</h4>
              <p>
                Measures the reliability of the local electric grid using SAIDI (System Average
                Interruption Duration Index) and SAIFI (System Average Interruption Frequency Index).
                Lower outage duration and fewer interruptions = higher score. This is an
                <strong className="text-white"> inverse metric</strong>: raw outage minutes are
                normalized to 0&ndash;1 where 1 = most reliable.
              </p>
              <p className="mt-2">
                <strong className="text-gray-200">Target data source:</strong> EIA Form 861 Reliability
                Data &mdash; utilities report SAIDI/SAIFI annually. We aggregate at the county level by
                weighting each utility&apos;s reliability metrics by the number of customers they serve in
                that county.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Current status: Seeded from state-level reliability averages. Planned upgrade
                to per-utility SAIDI/SAIFI from EIA-861 reliability tables.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-1">3. Clipped/Curtailed (clipped_curtailed_score)</h4>
              <p>
                Measures the presence of renewable energy that&apos;s being curtailed
                (generators forced to reduce output because the grid can&apos;t absorb it).
                High curtailment signals an opportunity: a data center co-located with these
                generators can absorb the excess power behind the meter, getting cheap energy
                that would otherwise be wasted.
              </p>
              <p className="mt-2">
                <strong className="text-gray-200">Target data source:</strong> EIA Form 860 (installed
                generator capacity by county) cross-referenced with LBNL interconnection queue data.
                We look at the ratio of installed renewable nameplate capacity to local grid hosting
                capacity. Counties where renewables far exceed grid capacity have the highest scores.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Current status: Seeded from state-level renewable penetration estimates. Planned upgrade
                to EIA-860 generator-level data joined to county via lat/lon.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-1">4. Permitting (permitting_score)</h4>
              <p>
                Measures how friendly or hostile a county&apos;s local government is toward data center
                development. This is a qualitative score derived from web research on local ordinances,
                zoning codes, moratoria, public hearing records, economic development incentives, and
                media coverage of data center proposals.
              </p>
              <p className="mt-2">
                <strong className="text-gray-200">Data source:</strong> Claude Code skill
                (<code className="text-nodiac-secondary bg-white/5 px-1 rounded">permitting-sentiment</code>)
                that systematically searches for &ldquo;[County] [State] data center moratorium,&rdquo;
                &ldquo;zoning ordinance,&rdquo; &ldquo;approved,&rdquo; etc. and produces a sentiment
                score (0 = hostile/moratorium, 0.5 = neutral, 1 = actively welcoming with incentives).
                Evidence URLs and summaries are stored alongside each score.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Current status: All counties initialized to 0.5 (neutral). Being enriched in batches
                using the permitting sentiment skill. Known moratoria counties (Loudoun VA, several GA
                counties, parts of SC) are prioritized for scoring.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-1">5. Skilled IT Labor (labor_score)</h4>
              <p>
                Measures the availability of IT and telecom workers in the county. Data centers need
                technicians for deployment and maintenance. Counties near metro areas with existing
                tech workforces score higher. Remote rural counties score lower unless there&apos;s a
                nearby college or military base with relevant workforce.
              </p>
              <p className="mt-2">
                <strong className="text-gray-200">Target data source:</strong> Census County Business
                Patterns (CBP) &mdash; specifically NAICS codes 5182 (Data Processing, Hosting, and
                Related Services) and 5415 (Computer Systems Design). We calculate IT employment per
                capita, then normalize across all counties.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Current status: Seeded from state-level tech employment density. Planned upgrade
                to actual CBP county-level establishment and employment data.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-1">6. Fiber Availability (fiber_score)</h4>
              <p>
                Measures broadband fiber infrastructure at the county level. Data centers require
                high-bandwidth, low-latency connectivity. Counties with extensive fiber-to-the-premises
                (FTTP) deployments typically have the backhaul infrastructure needed for data center
                interconnection.
              </p>
              <p className="mt-2">
                <strong className="text-gray-200">Target data source:</strong> FCC Broadband Data
                Collection (BDC) &mdash; the successor to Form 477. Reports broadband availability
                at the census block level by technology type. We calculate the percentage of census
                blocks in each county with fiber (technology code 50) availability, then normalize.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Current status: Seeded from state-level fiber penetration estimates. Planned upgrade
                to actual FCC BDC location-level fiber availability data.
              </p>
            </div>
          </div>
        </Collapsible>

        {/* 4. NORMALIZATION */}
        <Collapsible title="Normalization (How Raw Data Becomes 0-1 Scores)">
          <p>
            Each criterion&apos;s raw values come in different units (percentages, outage minutes, MW capacity,
            employment counts). To make them comparable and combinable, we normalize each to a 0&ndash;1 scale
            using <strong className="text-white">min-max normalization</strong>:
          </p>
          <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-nodiac-secondary">
            normalized = (value &minus; min) / (max &minus; min)
          </div>
          <p>
            Where <code className="text-nodiac-secondary bg-white/5 px-1 rounded">min</code> and
            <code className="text-nodiac-secondary bg-white/5 px-1 rounded">max</code> are the minimum
            and maximum values across all ~3,200 counties for that criterion. This maps the worst county
            to 0 and the best county to 1, with everything else distributed linearly between them.
          </p>
          <p>
            For <strong className="text-white">inverse metrics</strong> (like grid outage duration, where
            lower is better), we use{' '}
            <code className="text-nodiac-secondary bg-white/5 px-1 rounded">1 &minus; normalized</code>{' '}
            so that 1 still means &ldquo;best.&rdquo;
          </p>
          <p>
            Values are clamped to [0, 1] so outliers don&apos;t produce negative scores or scores above 1.
            When the data pipeline is fully connected, normalization happens at seed time (when data is
            ingested) so that the 0&ndash;1 scores stored in the database are ready for immediate use.
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
                <span className="text-white font-mono text-sm">min score</span>
                <span className="text-gray-400 text-sm ml-2">&mdash; #2d2233 (muted purple, visible against dark base map)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: '#5c2d55' }} />
              <div>
                <span className="text-white font-mono text-sm">mid score</span>
                <span className="text-gray-400 text-sm ml-2">&mdash; #5c2d55 (mid purple)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: '#8b3578' }} />
              <div>
                <span className="text-white font-mono text-sm">80% of max</span>
                <span className="text-gray-400 text-sm ml-2">&mdash; #8b3578 (bright Nodiac purple)</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: '#b48fc1' }} />
              <div>
                <span className="text-white font-mono text-sm">max score</span>
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
            The data pipeline has two modes: <strong className="text-white">seed data</strong> (current)
            and <strong className="text-white">live data</strong> (planned).
          </p>

          <h4 className="text-white font-semibold mt-4 mb-1">Current: Seed Data</h4>
          <p>
            A seed script (<code className="text-nodiac-secondary bg-white/5 px-1 rounded">scripts/seed-county-scores.ts</code>)
            generates scores for all ~3,200 counties:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
            <li>
              Fetches the official FIPS county code list from the Census Bureau
              (<code className="text-nodiac-secondary bg-white/5 px-1 rounded text-xs">census.gov/geo/docs/reference/codes2020/national_county2020.txt</code>)
            </li>
            <li>
              For each county, looks up its state&apos;s baseline scores &mdash; a manually researched
              set of approximate 0&ndash;1 values per criterion per state (e.g., MN co-op = 0.75,
              TX curtailment = 0.80, VA fiber = 0.90)
            </li>
            <li>
              Applies per-county <strong className="text-white">jitter</strong> of &plusmn;0.15 to create
              within-state variation (random uniform noise, clamped to [0, 1])
            </li>
            <li>
              Sets all permitting scores to 0.5 (neutral) &mdash; this is enriched separately by
              the permitting sentiment skill
            </li>
            <li>
              Writes to both Supabase (via upsert) and a static JSON fallback at{' '}
              <code className="text-nodiac-secondary bg-white/5 px-1 rounded">/data/county-scores.json</code>
            </li>
          </ol>

          <h4 className="text-white font-semibold mt-4 mb-1">Planned: Live Data Pipeline</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 pr-3 text-gray-400 font-medium">Criterion</th>
                  <th className="text-left py-2 pr-3 text-gray-400 font-medium">Source</th>
                  <th className="text-left py-2 text-gray-400 font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white">Co-op Density</td>
                  <td className="py-2 pr-3">EIA Form 861</td>
                  <td className="py-2">% of county utilities that are co-ops, weighted by territory</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white">Grid Reliability</td>
                  <td className="py-2 pr-3">EIA Form 861 (SAIDI/SAIFI)</td>
                  <td className="py-2">Customer-weighted avg outage duration, inverted</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white">Clipped/Curtailed</td>
                  <td className="py-2 pr-3">EIA Form 860 + LBNL queue</td>
                  <td className="py-2">Renewable nameplate MW / grid hosting capacity</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white">Permitting</td>
                  <td className="py-2 pr-3">Web research (Claude skill)</td>
                  <td className="py-2">Sentiment analysis of ordinances, moratoria, incentives</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-3 text-white">Skilled IT Labor</td>
                  <td className="py-2 pr-3">Census CBP (NAICS 5182, 5415)</td>
                  <td className="py-2">IT employment per capita, min-max normalized</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-white">Fiber</td>
                  <td className="py-2 pr-3">FCC Broadband Data Collection</td>
                  <td className="py-2">% of census blocks with fiber (tech code 50)</td>
                </tr>
              </tbody>
            </table>
          </div>
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
              <strong className="text-white">Seed data uses state-level baselines with jitter</strong> &mdash;
              within-state variation is random, not based on actual county-level differences.
              A county in rural western MN currently gets a similar score to one in the Twin Cities suburbs.
              The live data pipeline will fix this.
            </li>
            <li>
              <strong className="text-white">Permitting scores are all 0.5 by default</strong> &mdash;
              this is the most impactful criterion for real decision-making, and it&apos;s currently
              uniform. As the permitting sentiment skill enriches counties, the map will differentiate
              more meaningfully.
            </li>
            <li>
              <strong className="text-white">No temporal dimension</strong> &mdash; scores are static
              snapshots. Grid reliability, curtailment, and permitting all change over time. Future
              versions will include <code className="text-nodiac-secondary bg-white/5 px-1 rounded">last_permitting_update</code> timestamps
              and historical trend data.
            </li>
            <li>
              <strong className="text-white">Equal normalization across all counties</strong> &mdash;
              min-max normalization is sensitive to outliers. A single county with extreme values
              can compress the rest of the distribution. Quantile normalization may produce better
              visual differentiation.
            </li>
            <li>
              <strong className="text-white">No interaction effects</strong> &mdash; the weighted
              average treats criteria independently. In reality, a county with high co-op density
              AND high curtailment is more than additively valuable (that&apos;s the behind-the-meter
              arbitrage play). A multiplicative or geometric mean model could capture this.
            </li>
          </ul>
        </Collapsible>
      </div>
    </section>
  )
}
