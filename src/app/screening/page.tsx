'use client'

import { LogoLink } from '@/components/LogoLink'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ScreeningContainer } from '@/components/screening/ScreeningContainer'

export default function ScreeningPage() {
  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-[#0f0f1a]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-transparent backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <LogoLink />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24">
        <ScreeningContainer />
      </main>
    </div>
  )
}
