import { Suspense } from 'react'
import { getTrackerSites, getTrackerHubs } from '@/lib/tracker/queries'
import { TrackerGridClient } from '@/components/tracker/TrackerGridClient'
import TrackerLoading from './loading'

async function TrackerGrid() {
  const [sites, hubs] = await Promise.all([
    getTrackerSites(),
    getTrackerHubs(),
  ])

  return <TrackerGridClient initialSites={sites} hubs={hubs} />
}

export default function TrackerPage() {
  return (
    <Suspense fallback={<TrackerLoading />}>
      <TrackerGrid />
    </Suspense>
  )
}
