import { getTrackerSites, getTrackerHubs } from '@/lib/tracker/queries'
import { MetricsClient } from '@/components/tracker/MetricsClient'

export default async function MetricsPage() {
  const [sites, hubs] = await Promise.all([
    getTrackerSites(),
    getTrackerHubs(),
  ])

  return (
    <div className="max-w-[1400px]">
      <MetricsClient initialSites={sites} hubs={hubs} />
    </div>
  )
}
