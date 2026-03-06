'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogoLink } from '@/components/LogoLink'
import { Plus, Clock, Trash2, MoreVertical, BarChart3 } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthButton } from '@/components/auth/AuthButton'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Timeline } from '@/types/timeline'

export default function TimelineListPage() {
  const { user, isLoading: authLoading, isGuest } = useAuth()
  const router = useRouter()
  const [timelines, setTimelines] = useState<Timeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (isGuest) {
      setIsLoading(false)
      return
    }

    async function fetchTimelines() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('timelines')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching timelines:', error)
      } else {
        setTimelines(
          data.map((t) => ({
            id: t.id,
            userId: t.user_id,
            title: t.title,
            startYear: t.start_year,
            endYear: t.end_year,
            notes: t.notes || '',
            createdAt: new Date(t.created_at || Date.now()),
            updatedAt: new Date(t.updated_at || Date.now()),
          }))
        )
      }
      setIsLoading(false)
    }

    fetchTimelines()
  }, [authLoading, isGuest])

  const createNewTimeline = async () => {
    if (isGuest || !user) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('timelines')
      .insert({
        user_id: user.id,
        title: 'Untitled Timeline',
        start_year: new Date().getFullYear(),
        end_year: new Date().getFullYear() + 5,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating timeline:', error)
      return
    }

    router.push(`/timeline/${data.id}`)
  }

  const deleteTimeline = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('timelines').delete().eq('id', id)

    if (error) {
      console.error('Error deleting timeline:', error)
      return
    }

    setTimelines((prev) => prev.filter((t) => t.id !== id))
    setMenuOpen(null)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-nodiac-light dark:bg-gradient-to-br dark:from-nodiac-dark dark:via-slate-900 dark:to-nodiac-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-white/80 dark:bg-nodiac-dark/80 backdrop-blur-sm border-b border-gray-200 dark:border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <LogoLink />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Navigation />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Timelines</h1>
            {!isGuest && (
              <button
                onClick={createNewTimeline}
                className="flex items-center gap-2 px-4 py-2 bg-nodiac-primary hover:bg-nodiac-primary/80 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Timeline
              </button>
            )}
          </div>

          {isGuest ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-nodiac-primary to-nodiac-soft-orchid flex items-center justify-center mb-6">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Create project timelines</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-center">
                Build and export professional project timelines for data center development presentations
              </p>
              <div className="max-w-xs mx-auto">
                <AuthButton />
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nodiac-primary" />
            </div>
          ) : timelines.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No timelines yet</p>
              <button
                onClick={createNewTimeline}
                className="text-nodiac-primary hover:underline"
              >
                Create your first timeline
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {timelines.map((timeline) => (
                <div
                  key={timeline.id}
                  className="group relative bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-sm"
                >
                  <Link href={`/timeline/${timeline.id}`} className="block">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {timeline.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {timeline.startYear} - {timeline.endYear}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(timeline.updatedAt)}
                      </span>
                    </div>
                  </Link>

                  <div className="absolute top-4 right-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        setMenuOpen(menuOpen === timeline.id ? null : timeline.id)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {menuOpen === timeline.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[120px]">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            deleteTimeline(timeline.id)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-red-500 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
