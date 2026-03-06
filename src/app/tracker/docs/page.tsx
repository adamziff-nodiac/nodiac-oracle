'use client'

import { useState } from 'react'
import { PHASES, CHECKPOINTS, STATUS_OPTIONS, AMOUNT_STATUS_OPTIONS, PRIORITY_OPTIONS, OWNER_OPTIONS, getCheckpointsByPhase } from '@/lib/tracker/constants'
import { CheckpointStatusBadge } from '@/components/tracker/CheckpointStatusBadge'
import { PriorityIndicator } from '@/components/tracker/PriorityIndicator'
import { AmountStatusBadge } from '@/components/tracker/AmountStatusBadge'
import { PhaseBadge } from '@/components/tracker/PhaseBadge'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const CHECKPOINT_DESCRIPTIONS: Record<string, { description: string; complete: string; owner: string }> = {
  site_identified: {
    description: 'A potential site has been identified and logged for evaluation.',
    complete: 'Site details (location, MW potential, utility territory) are recorded.',
    owner: 'Eric or Josh',
  },
  site_qualified: {
    description: 'The site has been evaluated against key criteria (power access, zoning, proximity to fiber, land availability) and meets minimum thresholds.',
    complete: 'Site passes initial screening and is approved for development.',
    owner: 'Eric',
  },
  control_engaged: {
    description: 'Outreach to the landowner has begun -- LOI, lease negotiation, or option discussions are underway.',
    complete: 'Active engagement with landowner is in progress.',
    owner: 'Josh or Stratton',
  },
  control_secured: {
    description: 'Legal right to use the site (lease, option, or purchase agreement) is signed.',
    complete: 'Executed agreement with the landowner.',
    owner: 'Josh or Stratton',
  },
  power_capacity_check: {
    description: 'Utility capacity inquiry submitted to check available power at or near the site.',
    complete: 'Inquiry form submitted to the utility or co-op.',
    owner: 'Eric',
  },
  power_capacity_indication: {
    description: 'Utility has responded with available capacity at the location.',
    complete: 'Written indication of available MW received.',
    owner: 'Eric',
  },
  power_service_request: {
    description: 'Formal service application or interconnection request submitted to the utility.',
    complete: 'Application submitted with required documentation.',
    owner: 'Eric',
  },
  power_deposit: {
    description: 'Financial deposit paid to the utility to secure the interconnection queue position or begin engineering studies.',
    complete: 'Payment confirmed by the utility.',
    owner: 'Eric / Sara',
  },
  power_utility_design: {
    description: 'Utility has completed their engineering design for the service connection.',
    complete: 'Design documents received from the utility.',
    owner: 'Eric',
  },
  power_connection: {
    description: 'Connection agreement (service agreement, IA, or PPA) signed with the utility.',
    complete: 'Executed connection agreement.',
    owner: 'Eric / Stratton',
  },
  permit_requirements: {
    description: 'County/state permitting requirements assessed -- zoning, building permits, environmental reviews identified.',
    complete: 'Full list of required permits documented with timeline estimates.',
    owner: 'Eric',
  },
  permit_approved: {
    description: 'All required permits obtained.',
    complete: 'All permits issued and active.',
    owner: 'Eric',
  },
  fiber_identified: {
    description: 'Fiber provider and path to the site identified.',
    complete: 'Fiber provider contacted, route/path determined.',
    owner: 'Ken',
  },
  fiber_capacity: {
    description: 'Fiber provider has confirmed sufficient bandwidth capacity for the site.',
    complete: 'Written capacity confirmation received.',
    owner: 'Ken',
  },
  fiber_secured: {
    description: 'Fiber agreement signed and construction scheduled or complete.',
    complete: 'Executed fiber service agreement.',
    owner: 'Ken',
  },
  eng_design: {
    description: 'Engineering design for the data center site layout complete.',
    complete: 'Approved site plan, electrical single-line, civil drawings.',
    owner: 'Adam Z / Ken',
  },
  eng_equip_ordered: {
    description: 'Major equipment (Armada containers, switchgear, transformers, etc.) ordered.',
    complete: 'Purchase orders placed with confirmed delivery dates.',
    owner: 'Ken',
  },
  construction_equip_delivered: {
    description: 'Equipment has arrived on site.',
    complete: 'All major equipment received and inventoried.',
    owner: 'Ken',
  },
  construction_complete: {
    description: 'Physical construction and equipment installation complete.',
    complete: 'All infrastructure built, equipment installed, site ready for energization.',
    owner: 'Ken',
  },
  construction_energized: {
    description: 'Site connected to the grid and receiving power.',
    complete: 'Power flowing to the site, metering active.',
    owner: 'Eric / Ken',
  },
  construction_commissioned: {
    description: 'Site fully tested, commissioned, and operational.',
    complete: 'All systems tested, customer workloads running, site accepted.',
    owner: 'Ken',
  },
}

const sections = [
  { id: 'organization', label: 'How It\'s Organized' },
  { id: 'phases', label: 'Phases & Checkpoints' },
  { id: 'statuses', label: 'Status Definitions' },
  { id: 'financial', label: 'Financial Checkpoints' },
  { id: 'deposits', label: 'Deposits Page' },
  { id: 'metrics', label: 'Metrics Page' },
  { id: 'partners', label: 'Partners Page' },
  { id: 'priority', label: 'Priority Levels' },
  { id: 'construction-ready', label: 'Construction Ready' },
  { id: 'speed', label: 'Speed Metrics' },
  { id: 'site-management', label: 'Site Management' },
  { id: 'archiving', label: 'Archiving' },
  { id: 'assumptions', label: 'Key Assumptions' },
]

function CollapsiblePhase({ phase }: { phase: typeof PHASES[number] }) {
  const [open, setOpen] = useState(false)
  const checkpoints = getCheckpointsByPhase(phase.key)

  return (
    <div className="border border-zinc-200 dark:border-[#2a2a40] rounded-lg overflow-hidden mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-[#1a1a30] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <PhaseBadge status="In Progress" abbrev={phase.abbrev} />
          {phase.label}
        </span>
        <ChevronRight className={cn('w-4 h-4 text-zinc-400 transition-transform duration-200', open && 'rotate-90')} />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {checkpoints.map(cp => {
            const desc = CHECKPOINT_DESCRIPTIONS[cp.prefix]
            return (
              <div key={cp.prefix} className="px-4 py-3 border-t border-zinc-100 dark:border-[#22223a]">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {cp.label}
                  {cp.financial && <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">Financial</span>}
                </div>
                {desc && (
                  <>
                    <p className="text-[13px] text-zinc-600 dark:text-zinc-400 mt-1">{desc.description}</p>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-500 mt-1 italic">Complete when: {desc.complete}</p>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-500 mt-0.5">Typical owner: {desc.owner}</p>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function DocsPage() {
  return (
    <div className="max-w-[1000px]">
      <div className="flex gap-8">
        {/* TOC - desktop sidebar, tablet/mobile horizontal bar */}
        <nav className="hidden lg:block w-[200px] shrink-0 sticky top-20 self-start">
          {sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block py-1 text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors border-l-2 border-transparent hover:border-nodiac-secondary pl-3"
            >
              {s.label}
            </a>
          ))}
        </nav>

        {/* Mobile/Tablet TOC */}
        <div className="lg:hidden fixed top-[120px] left-0 right-0 z-30 bg-white/90 dark:bg-[#0f0f1a]/90 backdrop-blur-sm px-3 py-2 border-b border-zinc-200 dark:border-[#2a2a40] overflow-x-auto flex gap-1" style={{ display: 'none' }}>
          {/* Only shown on smaller screens via CSS */}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile TOC */}
          <div className="lg:hidden flex overflow-x-auto gap-1 pb-2 border-b border-zinc-200 dark:border-[#2a2a40] mb-6">
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="whitespace-nowrap px-3 py-1.5 rounded-md text-[12px] text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a30] transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>

          {/* Organization */}
          <section id="organization" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">How the Tracker is Organized</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              The tracker follows a three-level hierarchy: <strong className="text-zinc-900 dark:text-zinc-100">Sites</strong> contain <strong className="text-zinc-900 dark:text-zinc-100">Phases</strong>, and each Phase contains <strong className="text-zinc-900 dark:text-zinc-100">Checkpoints</strong>.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Every site goes through <strong className="text-zinc-900 dark:text-zinc-100">7 phases</strong> of development, from initial identification through commissioning. Each phase has between 2 and 6 checkpoints -- <strong className="text-zinc-900 dark:text-zinc-100">21 checkpoints total</strong> per site.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              The <strong className="text-zinc-900 dark:text-zinc-100">Portfolio Grid</strong> shows one row per site with 7 phase-level badges. Click any site to drill into the full 21 checkpoints on its detail page.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Beyond the portfolio, the tracker has dedicated pages: <strong className="text-zinc-900 dark:text-zinc-100">Deposits</strong> tracks financial payments across all sites, <strong className="text-zinc-900 dark:text-zinc-100">Metrics</strong> provides portfolio-level analytics (MW, speed, capex), and <strong className="text-zinc-900 dark:text-zinc-100">Partners</strong> manages utility and IPP relationships independently of specific sites.
            </p>
          </section>

          {/* Phases & Checkpoints */}
          <section id="phases" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Phase & Checkpoint Definitions</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Click each phase below to see its checkpoints, what they mean, and what &quot;Complete&quot; looks like.
            </p>
            {PHASES.map(phase => (
              <CollapsiblePhase key={phase.key} phase={phase} />
            ))}
          </section>

          {/* Status Definitions */}
          <section id="statuses" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Status Definitions</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
              Every checkpoint has one of these statuses:
            </p>
            <div className="space-y-4">
              {STATUS_OPTIONS.map(status => (
                <div key={status} className="flex items-start gap-3">
                  <CheckpointStatusBadge status={status} />
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {status === 'Not Started' && 'Work hasn\'t begun on this checkpoint yet. Use this for future work, not for things that are actively being pursued.'}
                      {status === 'In Progress' && 'Active work underway. For example: the utility capacity inquiry has been submitted and you\'re waiting for a response, or lease negotiations are happening. If someone is spending time on it, it\'s In Progress.'}
                      {status === 'Complete' && 'This checkpoint is done. The deliverable exists (signed agreement, approved permit, payment confirmed). No more work needed.'}
                      {status === 'Waiting' && 'Can\'t move forward due to an external dependency. Example: permit application rejected, utility unresponsive for 30+ days, legal issue on the land title. Use the Blockers section on the site detail page to explain what\'s blocking.'}
                      {status === 'N/A' && 'This checkpoint doesn\'t apply to this site. Example: a BTM site doesn\'t need a utility interconnection deposit. Mark it N/A so the phase can still show as Complete.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-5 mb-2">Phase-Level Status</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Phase badges on the grid are computed automatically from their checkpoints:
            </p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                If any checkpoint is <strong className="text-zinc-900 dark:text-zinc-100">Waiting</strong>, the phase shows as Waiting
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                If all checkpoints are <strong className="text-zinc-900 dark:text-zinc-100">Complete or N/A</strong>, the phase shows as Complete
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                If any checkpoint is <strong className="text-zinc-900 dark:text-zinc-100">In Progress</strong>, the phase shows as In Progress
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                Otherwise, the phase shows as <strong className="text-zinc-900 dark:text-zinc-100">Not Started</strong>
              </li>
            </ul>
          </section>

          {/* Financial Checkpoints */}
          <section id="financial" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Financial Checkpoints</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Four of the 21 checkpoints involve money. These have two extra fields: <strong className="text-zinc-900 dark:text-zinc-100">Amount</strong> (dollar value) and <strong className="text-zinc-900 dark:text-zinc-100">Amount Status</strong> (how firm the number is).
            </p>
            <div className="mb-4">
              {CHECKPOINTS.filter(c => c.financial).map(cp => (
                <div key={cp.prefix} className="flex items-center gap-2 py-1.5">
                  <span className="text-[13px] text-zinc-900 dark:text-zinc-100 font-medium">{cp.label}</span>
                  <span className="text-[13px] text-zinc-500">({cp.phase})</span>
                </div>
              ))}
            </div>
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-5 mb-2">Amount Status</h3>
            <div className="space-y-3">
              {AMOUNT_STATUS_OPTIONS.map(status => (
                <div key={status} className="flex items-start gap-3">
                  <AmountStatusBadge status={status} />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {status === 'Estimated' && 'A rough number based on comparable sites or early discussions. May change significantly.'}
                    {status === 'Quoted' && 'A formal quote from the utility or vendor. This is a real number, but hasn\'t been approved for payment yet.'}
                    {status === 'Approved' && 'Payment has been approved internally. Ready to send.'}
                    {status === 'Paid' && 'Payment sent and confirmed received by the counterparty.'}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
              The <strong className="text-zinc-900 dark:text-zinc-100">Total Capex</strong> shown on the metrics page is the sum of all four financial checkpoint amounts for each site. <strong className="text-zinc-900 dark:text-zinc-100">Capex/MW</strong> divides that total by the site&apos;s MW capacity.
            </p>
          </section>

          {/* Deposits Page */}
          <section id="deposits" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Deposits Page</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              The Deposits page aggregates all financial checkpoint deposits across sites and groups them by payment lifecycle stage:
            </p>
            <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Ready to Send</strong> -- Quoted or Approved deposits that are not waiting. These need action.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Waiting</strong> -- Quoted or Approved deposits where the checkpoint phase is Waiting. Needs resolution before payment.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Pending</strong> -- Estimated deposits. The amount is rough and needs a formal quote.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Paid</strong> -- Confirmed payments. No further action needed.
              </li>
            </ul>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Each deposit can be edited inline -- click the amount to update the dollar value, or use the dropdowns to change the <strong className="text-zinc-900 dark:text-zinc-100">Payment Status</strong> (Estimated/Quoted/Approved/Paid) or <strong className="text-zinc-900 dark:text-zinc-100">Phase Status</strong> (the checkpoint&apos;s progress status). Summary cards at the top show totals per group.
            </p>
          </section>

          {/* Metrics Page */}
          <section id="metrics" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Metrics Page</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Portfolio-level analytics across all active sites. Use the toggle at the top to include or exclude archived sites.
            </p>
            <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">MW by Stage</strong> -- Visualizes how MW capacity is distributed across development phases.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Speed Metrics</strong> -- Portfolio averages for Days to IX, Days to Ready, and Days to COD.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Capex Analysis</strong> -- Per-site breakdown of total capex, capex/MW, and a <strong className="text-zinc-900 dark:text-zinc-100">Basis</strong> column showing whether figures are Actual (all amounts paid/approved), Mixed (some paid, some estimated), or Estimated (all rough numbers).
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Hub Breakdown</strong> -- MW totals and site counts grouped by regional hub.
              </li>
            </ul>
          </section>

          {/* Partners Page */}
          <section id="partners" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Partners Page</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Tracks utility and IPP relationships across the portfolio. Partners exist independently of sites -- you can add a partner before any sites are associated (e.g., an LOI with a co-op where we haven&apos;t identified specific locations yet).
            </p>
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-4 mb-2">Partner Types</h3>
            <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Distribution Co-op</strong> -- Local electric cooperative that distributes power to end users
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">G&T Co-op</strong> -- Generation & Transmission cooperative (wholesaler to distribution co-ops)
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Municipal Utility</strong> -- City-owned utility
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">IOU</strong> -- Investor-owned utility
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">IPP</strong> -- Independent Power Producer (asset owner / capital partner)
              </li>
            </ul>
            <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mt-4 mb-2">Relationship Stages</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Each partner has a relationship stage: <strong className="text-zinc-900 dark:text-zinc-100">Identified</strong> → <strong className="text-zinc-900 dark:text-zinc-100">Initial Contact</strong> → <strong className="text-zinc-900 dark:text-zinc-100">Capacity Discussion</strong> → <strong className="text-zinc-900 dark:text-zinc-100">Under Contract</strong>.
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              The partners list shows type, stage, LOI status, associated hubs, and a count of linked sites. Click any partner to open a detail panel where you can edit all fields, view linked sites, and add notes. Partners can be created, edited, and deleted directly from this page.
            </p>
          </section>

          {/* Priority Levels */}
          <section id="priority" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Priority Levels</h2>
            <div className="space-y-3">
              {PRIORITY_OPTIONS.map(p => (
                <div key={p} className="flex items-start gap-3">
                  <PriorityIndicator priority={p} />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {p === 'Lead' && 'Highest priority. Active negotiations, near-term decisions. These sites get daily attention.'}
                    {p === 'Active' && 'Actively being developed. Regular progress being made on checkpoints.'}
                    {p === 'Pipeline' && 'Identified and qualified, but not yet in active development. Waiting for the right timing or resources.'}
                    {p === 'On Hold' && 'Development paused due to external factors (utility delays, landowner issues, etc.). Will resume when conditions change.'}
                    {p === 'Deprioritized' && 'Not currently being pursued. May be revisited later if conditions improve.'}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
              The portfolio grid defaults to sorting by priority (Lead first). Filter by priority to focus on what matters right now.
            </p>
          </section>

          {/* Construction Ready */}
          <section id="construction-ready" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Construction Ready</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              A site is <strong className="text-zinc-900 dark:text-zinc-100">Construction Ready</strong> when all pre-construction phases are complete. Specifically, these phases must all show as Complete:
            </p>
            <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              <li className="flex items-center gap-2"><PhaseBadge status="Complete" abbrev="SQ" /> Site Qualification</li>
              <li className="flex items-center gap-2"><PhaseBadge status="Complete" abbrev="SC" /> Site Control</li>
              <li className="flex items-center gap-2"><PhaseBadge status="Complete" abbrev="PWR" /> Power</li>
              <li className="flex items-center gap-2"><PhaseBadge status="Complete" abbrev="PRM" /> Permitting</li>
              <li className="flex items-center gap-2"><PhaseBadge status="Complete" abbrev="FBR" /> Fiber</li>
              <li className="flex items-center gap-2"><PhaseBadge status="Complete" abbrev="ENG" /> Eng & Procurement</li>
            </ul>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Construction Ready is a key milestone for leadership reporting. It means: we have site control, power secured, permits in hand, fiber arranged, and engineering done. The only remaining work is physical construction.
            </p>
          </section>

          {/* Speed Metrics */}
          <section id="speed" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Speed Metrics</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Three duration metrics track how fast each site moves through development. The clock starts when the site is <strong className="text-zinc-900 dark:text-zinc-100">qualified</strong> (site_qualified checkpoint completed).
            </p>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Days to IX</dt>
                <dd className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Days from site qualified to power interconnection secured (power_connection completed). Measures how fast we get through the utility process.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Days to Construction Ready</dt>
                <dd className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Days from site qualified to all pre-construction phases complete. This is the total development timeline before breaking ground.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Days to COD</dt>
                <dd className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                  Days from site qualified to commissioning complete (COD = Commercial Operation Date). The full end-to-end timeline.
                </dd>
              </div>
            </dl>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              If a metric shows an amber pulsing dot, the clock is still running -- the endpoint checkpoint hasn&apos;t been completed yet. The number shown is the elapsed days so far. Once complete, the number locks in and the dot disappears.
            </p>
          </section>

          {/* Site Management */}
          <section id="site-management" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Site Management</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              From a site&apos;s detail page, you can edit most fields inline:
            </p>
            <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400 mb-3">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Checkpoint statuses</strong> -- Click any status badge to change it
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Site details</strong> -- Hub, Utility, Asset Owner, and MW are editable in the sidebar
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Operational context</strong> -- Summary, Next Steps, Blockers, and Waiting On sections can be edited with a click
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Financial amounts</strong> -- Click the amount on any financial checkpoint to update the dollar value
              </li>
            </ul>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              The <strong className="text-zinc-900 dark:text-zinc-100">Actions</strong> panel at the bottom of the sidebar lets you archive/unarchive a site or permanently delete it. Deletion requires confirmation and cannot be undone.
            </p>
          </section>

          {/* Archiving */}
          <section id="archiving" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Archiving</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              Sites that are no longer being pursued can be archived. Archived sites:
            </p>
            <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                Are hidden from the grid by default (toggle &quot;Archived&quot; to show them)
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                Appear dimmed (50% opacity) when visible
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                Are excluded from metrics calculations by default
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                Show a banner on their detail page with the archive date and reason
              </li>
            </ul>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-3">
              Archiving preserves all data -- nothing is deleted. You can unarchive a site if circumstances change.
            </p>
          </section>

          {/* Key Assumptions */}
          <section id="assumptions" className="scroll-mt-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-8 mb-3">Key Assumptions</h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">21 checkpoints are standard across all sites.</strong> Every site has the same structure, even if some checkpoints are N/A.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Phases are sequential, but checkpoints within a phase can overlap.</strong> For example, you can submit a utility service request before the capacity indication is formally complete.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Owners are people, not roles.</strong> The {OWNER_OPTIONS.join(', ')} values map to specific team members.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Financial amounts reflect their status.</strong> Amount status indicates whether a number is an Estimate, a formal Quote, Approved for payment, or Paid. The Capex Basis column on the Metrics page shows the overall confidence level.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">Speed metrics start from site qualification.</strong> Pre-qualification time (identification, initial screening) is not counted.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-400 mt-2 shrink-0" />
                <strong className="text-zinc-900 dark:text-zinc-100">One site = one physical location.</strong> If a location has multiple phases of development, each phase is a separate site.
              </li>
            </ul>
          </section>

          <div className="h-24" />
        </div>
      </div>
    </div>
  )
}
