'use client'

import { LogoLink } from '@/components/LogoLink'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'

interface AppHeaderProps {
  /** 'transparent' = no border, dark bg transparent. 'bordered' = subtle border + dark bg. */
  variant?: 'transparent' | 'bordered'
}

export function AppHeader({ variant = 'transparent' }: AppHeaderProps) {
  const bg = variant === 'bordered'
    ? 'bg-white/80 dark:bg-[#0f0f1a]/80 border-b border-zinc-200/50 dark:border-white/5'
    : 'bg-white/80 dark:bg-transparent'

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 p-4 backdrop-blur-sm ${bg}`}>
      <div className="max-w-[1600px] mx-auto flex justify-between items-center">
        <LogoLink />
        <div className="flex items-center gap-2 min-w-0">
          <ThemeToggle />
          <Navigation />
        </div>
      </div>
    </header>
  )
}
