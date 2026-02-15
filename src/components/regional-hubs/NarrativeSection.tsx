'use client'

const SECTIONS = [
  {
    id: 'methodology',
    title: 'Methodology',
    content: `Our regional hub scoring framework evaluates every US county across six weighted criteria, each normalized to a 0–1 scale and combined into a composite score. The criteria were selected based on Nodiac's thesis: distributed data centers co-located with renewable energy on cooperative utility territory deliver superior economics and speed to deployment. Adjust the weights above to see how different strategic priorities reshape the landscape.`,
  },
  {
    id: 'coop-advantage',
    title: 'The Co-op Advantage',
    content: `Electric cooperatives serve ~56% of the US landmass but only ~13% of electricity customers, creating vast territories with favorable utility relationships, streamlined interconnection, and under-utilized grid infrastructure. Counties with high co-op density typically offer faster permitting, lower interconnection costs, and direct access to renewable generation assets — the core of Nodiac's distributed model.`,
  },
  {
    id: 'grid-curtailment',
    title: 'Grid Reliability & Curtailment',
    content: `Areas with significant renewable capacity additions often experience curtailment — generators forced to reduce output because the grid can't absorb it. These counties represent the highest-value targets for co-located data centers that can absorb excess generation behind the meter. Grid reliability scores inversely weight outage duration, identifying regions where infrastructure investment has maintained strong uptime despite rapid renewable buildout.`,
  },
  {
    id: 'permitting',
    title: 'Permitting Landscape',
    content: `Data center permitting varies dramatically by jurisdiction. Some counties have enacted moratoria (Loudoun County, VA; multiple GA counties), while others actively court development with expedited permitting, tax incentives, and dedicated economic development contacts. Our permitting sentiment score is continuously refined using web research on local ordinances, public hearing records, and media coverage of data center proposals.`,
  },
  {
    id: 'recommended-regions',
    title: 'Recommended Hub Regions',
    content: `Based on our composite scoring, several regions consistently emerge as strong candidates for Nodiac's regional hub model. The Upper Midwest (Minnesota, Iowa, Wisconsin) combines high co-op density with significant wind curtailment and favorable permitting. The Southern Plains (Oklahoma, Kansas) offers similar wind resources with even lower land costs. The Pacific Northwest fringe (Eastern Oregon, Eastern Washington) benefits from hydro curtailment and established fiber corridors. Region overlays on the map above highlight these priority areas.`,
  },
]

export function NarrativeSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16 space-y-16">
      {SECTIONS.map((section) => (
        <div key={section.id} id={section.id}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {section.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
            {section.content}
          </p>
        </div>
      ))}
    </section>
  )
}
