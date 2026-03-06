import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHubSites, getHubPartners } from '@/lib/tracker/queries'
import type { TrackerHub } from '@/lib/tracker/types'
import { HubDetailPage } from '@/components/tracker/HubDetailPage'

interface HubDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function HubDetailRoute({ params }: HubDetailPageProps) {
  const { id } = await params

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hub, error } = await (supabase as any)
    .from('tracker_regional_hubs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !hub) {
    notFound()
  }

  const typedHub = hub as TrackerHub

  const [sites, partners] = await Promise.all([
    getHubSites(typedHub.name),
    getHubPartners(typedHub.id),
  ])

  return (
    <HubDetailPage
      hub={typedHub}
      initialSites={sites}
      initialPartners={partners}
    />
  )
}
