'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/tracker', label: 'Portfolio' },
  { href: '/tracker/action-items', label: 'Action Items' },
  { href: '/tracker/deposits', label: 'Deposits' },
  { href: '/tracker/metrics', label: 'Metrics' },
  { href: '/tracker/hubs', label: 'Hubs' },
  { href: '/tracker/partners', label: 'Partners' },
  { href: '/tracker/docs', label: 'Docs' },
]

export function SubNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-[#2a2a40]">
      {tabs.map(tab => {
        const isActive = tab.href === '/tracker'
          ? pathname === '/tracker'
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-3 py-2 text-[13px] font-medium border-b-2 transition-colors duration-100',
              isActive
                ? 'text-zinc-900 dark:text-zinc-100 border-nodiac-secondary'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
