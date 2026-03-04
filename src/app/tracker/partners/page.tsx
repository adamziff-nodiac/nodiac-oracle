import { getPartnersWithSiteCounts, getTrackerHubs } from '@/lib/tracker/queries'
import { PartnersClient } from '@/components/tracker/PartnersClient'

export default async function PartnersPage() {
  const [partners, hubs] = await Promise.all([
    getPartnersWithSiteCounts(),
    getTrackerHubs(),
  ])

  return <PartnersClient initialPartners={partners} hubs={hubs} />
}
