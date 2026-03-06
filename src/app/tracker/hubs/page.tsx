import { getHubsWithCounts } from '@/lib/tracker/queries'
import { HubsClient } from '@/components/tracker/HubsClient'

export default async function HubsPage() {
  const hubs = await getHubsWithCounts()

  return <HubsClient initialHubs={hubs} />
}
