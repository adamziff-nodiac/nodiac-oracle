'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ListChecks,
  Map,
  FileSearch,
  GitBranch,
  ClipboardList,
  MessageSquare,
  BarChart3,
  BookOpen,
  Settings,
  LogOut,
  Loader2,
  MoreHorizontal,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

const primaryNav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/todo', label: 'Todo', icon: ListChecks },
  { href: '/regional-hubs', label: 'Score', icon: Map },
  { href: '/screening', label: 'Screen', icon: FileSearch },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/tracker', label: 'Develop', icon: ClipboardList },
]

const secondaryNav = [
  { href: '/chat', label: 'Oracle Chat', icon: MessageSquare },
  { href: '/timeline', label: 'Timelines', icon: BarChart3 },
  { href: '/docs', label: 'Docs', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Close more dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [moreOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setMoreOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  const isSecondaryActive = secondaryNav.some((item) => isActive(item.href))

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1.5">
        <nav className="flex items-center gap-0.5 bg-white/70 dark:bg-white/[0.04] backdrop-blur-sm rounded-xl px-1.5 py-1 border border-gray-200/80 dark:border-white/[0.08]">
          {primaryNav.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap',
                  active
                    ? 'bg-nodiac-primary text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer',
                isSecondaryActive
                  ? 'bg-nodiac-primary/10 text-nodiac-primary dark:text-nodiac-secondary'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1e1e30] rounded-xl border border-gray-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl py-1.5 z-50">
                {secondaryNav.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors',
                        active
                          ? 'text-nodiac-primary dark:text-nodiac-secondary bg-nodiac-primary/5 dark:bg-nodiac-secondary/5'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User avatar / sign out */}
        {user && (
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/70 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.08] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 cursor-pointer"
            title="Sign out"
          >
            {isSigningOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : user.user_metadata?.avatar_url ? (
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
          </button>
        )}
      </div>

      {/* Mobile nav */}
      <div className="md:hidden relative flex items-center gap-1.5">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {mobileOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#1e1e30] rounded-2xl border border-gray-200/80 dark:border-white/[0.08] shadow-xl dark:shadow-2xl py-2 z-50 max-h-[calc(100vh-6rem)] overflow-y-auto">

            {/* Primary section */}
            <div className="px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2">
                Workflow
              </span>
            </div>
            {primaryNav.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'text-nodiac-primary dark:text-nodiac-secondary bg-nodiac-primary/5 dark:bg-nodiac-secondary/5'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}

            <div className="my-1.5 mx-3 border-t border-gray-100 dark:border-white/[0.06]" />

            {/* Secondary section */}
            <div className="px-3 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-2">
                Tools
              </span>
            </div>
            {secondaryNav.map((item) => {
              const active = isActive(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'text-nodiac-primary dark:text-nodiac-secondary bg-nodiac-primary/5 dark:bg-nodiac-secondary/5'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}

            {/* Sign out */}
            {user && (
              <>
                <div className="my-1.5 mx-3 border-t border-gray-100 dark:border-white/[0.06]" />
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 w-full transition-colors cursor-pointer"
                >
                  {isSigningOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  Sign out
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
