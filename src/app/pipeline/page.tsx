'use client'

import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LogoLink } from '@/components/LogoLink'
import { PipelineDashboard } from '@/components/pipeline/PipelineDashboard'

export default function PipelinePage() {
  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-[#0f0f1a]">
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-[#0f0f1a]/80 backdrop-blur-sm border-b border-zinc-200/50 dark:border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <LogoLink />
          <div className="flex items-center gap-2 min-w-0">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      <main className="pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Pipeline Stats
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Full-funnel metrics from screening through construction
            </p>
          </div>
          <PipelineDashboard />
        </div>
      </main>
    </div>
  )
}
