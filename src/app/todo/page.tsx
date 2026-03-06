import { LogoLink } from '@/components/LogoLink'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TodoPage } from '@/components/todo/TodoPage'
import { getActionItems, getTeamMembers, getTeamMemberByUserId, getTrackerSites } from '@/lib/tracker/queries'
import { createClient } from '@/lib/supabase/server'

export default async function TodoRoute() {
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
    <div className="min-h-screen bg-nodiac-light dark:bg-[#0f0f1a]">
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-sm border-b border-zinc-200/50 dark:border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
          <LogoLink />
          <div className="flex items-center gap-2 min-w-0">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4">
        <TodoPage
          initialItems={items}
          teamMembers={teamMembers}
          currentMemberId={currentMemberId}
          sites={sites}
        />
      </main>
    </div>
  )
}
