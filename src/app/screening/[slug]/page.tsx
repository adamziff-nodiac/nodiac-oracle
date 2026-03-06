'use client'

import { use } from 'react'
import Link from 'next/link'
import { LogoLink } from '@/components/LogoLink'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ScreeningContainer } from '@/components/screening/ScreeningContainer'
import { getPortfolioBySlug } from '@/data/portfolio-registry'

export default function PrebuiltPortfolioPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const portfolio = getPortfolioBySlug(slug)

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-nodiac-light dark:bg-[#0f0f1a]">
        <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-transparent backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto flex justify-between items-center">
            <LogoLink />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Navigation />
            </div>
          </div>
        </header>
        <main className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Portfolio not found
            </h2>
            <Link href="/screening" className="text-nodiac-secondary hover:underline">
              &larr; Back to Screening
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-[#0f0f1a]">
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-transparent backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <LogoLink />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      <main className="pt-24">
        <ScreeningContainer prebuiltSlug={slug} />
      </main>
    </div>
  )
}
