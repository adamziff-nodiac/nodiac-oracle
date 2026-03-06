import { notFound } from 'next/navigation'
import { getTrackerSite, getSiteActivity, getTrackerPartners, getTrackerHubs } from '@/lib/tracker/queries'
import { SiteDetailClient } from '@/components/tracker/SiteDetailClient'

interface SiteDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function SiteDetailPage({ params, searchParams }: SiteDetailPageProps) {
  const { id } = await params
  const { from } = await searchParams

  const [site, activity, partners, hubs] = await Promise.all([
    getTrackerSite(id),
    getSiteActivity(id),
    getTrackerPartners(),
    getTrackerHubs(),
  ])

  if (!site) {
    notFound()
  }

  const decodedFrom = from ? decodeURIComponent(from) : null
  const safeBackHref = decodedFrom && decodedFrom.startsWith('/tracker') ? decodedFrom : '/tracker'

  return (
    <SiteDetailClient
      initialSite={site}
      initialActivity={activity}
      partners={partners}
      hubs={hubs}
      backHref={safeBackHref}
    />
  )
}
