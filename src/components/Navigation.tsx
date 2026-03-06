'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, BarChart3, Home, Map, FileSearch, GitBranch, BookOpen, ClipboardList, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/chat', label: 'Oracle', icon: MessageSquare },
  { href: '/timeline', label: 'Timelines', icon: BarChart3 },
  { href: '/regional-hubs', label: 'Hubs', icon: Map },
  { href: '/screening', label: 'Screening', icon: FileSearch },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/scoring', label: 'Scoring', icon: BookOpen },
  { href: '/tracker', label: 'Tracker', icon: ClipboardList },
]

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex items-center gap-2 min-w-0">
      <nav className="flex items-center gap-1 bg-white/70 dark:bg-nodiac-dark/50 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200 dark:border-white/10 overflow-x-auto min-w-0" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 xl:px-4 sm:py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-0',
                isActive
                  ? 'bg-nodiac-primary text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {user && (
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/70 dark:bg-nodiac-dark/50 border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0 min-h-[44px] sm:min-h-0 cursor-pointer"
          title="Sign out"
        >
          {isSigningOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt=""
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-nodiac-primary flex items-center justify-center">
                  <span className="text-white text-[10px] font-medium">
                    {(user.email || '?')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <LogOut className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
