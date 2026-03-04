import { notFound } from 'next/navigation'
import { getTrackerSite, getSiteActivity, getTrackerPartners, getTrackerHubs } from '@/lib/tracker/queries'
import { SiteDetailClient } from '@/components/tracker/SiteDetailClient'

interface SiteDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SiteDetailPage({ params }: SiteDetailPageProps) {
  const { id } = await params

  const [site, activity, partners, hubs] = await Promise.all([
    getTrackerSite(id),
    getSiteActivity(id),
    getTrackerPartners(),
    getTrackerHubs(),
  ])

  if (!site) {
    notFound()
  }

  return (
    <SiteDetailClient
      initialSite={site}
      initialActivity={activity}
      partners={partners}
      hubs={hubs}
    />
  )
}
