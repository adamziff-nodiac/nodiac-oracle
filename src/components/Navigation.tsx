'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, BarChart3, Home, Map, FileSearch, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat', label: 'Oracle', icon: MessageSquare },
  { href: '/timeline', label: 'Timelines', icon: BarChart3 },
  { href: '/regional-hubs', label: 'Hubs', icon: Map },
  { href: '/screening', label: 'Screening', icon: FileSearch },
  { href: '/docs', label: 'Docs', icon: BookOpen },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 bg-gray-100 dark:bg-nodiac-dark/50 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200 dark:border-white/10">
      {navItems.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
              isActive
                ? 'bg-nodiac-primary text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
