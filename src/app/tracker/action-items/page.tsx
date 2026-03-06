import { TodoPage } from '@/components/todo/TodoPage'
import { getActionItems, getTeamMembers, getTeamMemberByUserId, getTrackerSites } from '@/lib/tracker/queries'
import { createClient } from '@/lib/supabase/server'

export default async function ActionItemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [items, teamMembers, sites] = await Promise.all([
    getActionItems({ status: ['next', 'waiting', 'done'] }),
    getTeamMembers(),
    getTrackerSites(),
  ])

  // Find current user's team member record
  let currentMemberId: string | null = null
  if (user) {
    const member = await getTeamMemberByUserId(user.id)
    currentMemberId = member?.id ?? null
  }

  return (
    <TodoPage
      initialItems={items}
      teamMembers={teamMembers}
      currentMemberId={currentMemberId}
      sites={sites}
    />
  )
}
