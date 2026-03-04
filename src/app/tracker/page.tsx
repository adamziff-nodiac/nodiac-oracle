import { getTrackerSites, getTrackerHubs } from '@/lib/tracker/queries'
import { TrackerGridClient } from '@/components/tracker/TrackerGridClient'

export default async function TrackerPage() {
  const [sites, hubs] = await Promise.all([
    getTrackerSites(),
    getTrackerHubs(),
  ])

  return <TrackerGridClient initialSites={sites} hubs={hubs} />
}
