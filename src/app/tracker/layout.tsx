import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SubNav } from '@/components/tracker/SubNav'
import { LogoLink } from '@/components/LogoLink'

export const metadata = {
  title: 'Tracker - Nodiac Oracle',
  description: 'Track site development from qualification through commissioning',
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-sm border-b border-zinc-200 dark:border-[#2a2a40]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <LogoLink size="sm" />
          <div className="flex items-center gap-2 min-w-0">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      {/* Tracker content */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Project Tracker
          </h1>
        </div>
        <SubNav />
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  )
}
