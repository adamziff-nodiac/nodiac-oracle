'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { TimelineBuilder } from '@/components/timeline/TimelineBuilder'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { TimelineWithData, TimelineRowWithData, TimelineMilestone, TimelinePhase, TimelineAnnotation } from '@/types/timeline'

// Parse date string as local timezone (not UTC)
// "2025-01-15" should be Jan 15 local time, not Jan 14 16:00 PST
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function TimelineEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoading: authLoading, isGuest } = useAuth()
  const [timeline, setTimeline] = useState<TimelineWithData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const timelineId = params.id as string

  useEffect(() => {
    if (authLoading) return
    if (isGuest) {
      router.push('/timeline')
      return
    }

    async function loadTimeline() {
      const supabase = createClient()

      // Fetch timeline
      const { data: timelineData, error: timelineError } = await supabase
        .from('timelines')
        .select('*')
        .eq('id', timelineId)
        .single()

      if (timelineError) {
        console.error('Error fetching timeline:', timelineError)
        setError('Timeline not found')
        setIsLoading(false)
        return
      }

      // Fetch rows
      const { data: rowsData, error: rowsError } = await supabase
        .from('timeline_rows')
        .select('*')
        .eq('timeline_id', timelineId)
        .order('position')

      if (rowsError) {
        console.error('Error fetching rows:', rowsError)
      }

      // Fetch phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('timeline_phases')
        .select('*')
        .eq('timeline_id', timelineId)
        .order('position')

      if (phasesError) {
        console.error('Error fetching phases:', phasesError)
      }

      // Fetch milestones and annotations for all rows
      const rowIds = (rowsData || []).map((r) => r.id)

      let milestonesData: Array<{
        id: string
        row_id: string
        label: string
        date: string
        position: number
        created_at: string | null
        updated_at: string | null
      }> = []
      let annotationsData: Array<{
        id: string
        row_id: string
        label: string
        date: string
        created_at: string | null
        updated_at: string | null
      }> = []

      if (rowIds.length > 0) {
        const { data: mData } = await supabase
          .from('timeline_milestones')
          .select('*')
          .in('row_id', rowIds)
          .order('position')

        const { data: aData } = await supabase
          .from('timeline_annotations')
          .select('*')
          .in('row_id', rowIds)

        milestonesData = mData || []
        annotationsData = aData || []
      }

      // Build the full timeline object
      const rows: TimelineRowWithData[] = (rowsData || []).map((row) => ({
        id: row.id,
        timelineId: row.timeline_id,
        label: row.label,
        color: row.color,
        startDate: parseLocalDate(row.start_date),
        endDate: parseLocalDate(row.end_date),
        position: row.position,
        createdAt: new Date(row.created_at || Date.now()),
        updatedAt: new Date(row.updated_at || Date.now()),
        milestones: milestonesData
          .filter((m) => m.row_id === row.id)
          .map((m): TimelineMilestone => ({
            id: m.id,
            rowId: m.row_id,
            label: m.label,
            date: parseLocalDate(m.date),
            position: m.position,
            createdAt: new Date(m.created_at || Date.now()),
            updatedAt: new Date(m.updated_at || Date.now()),
          })),
        annotations: annotationsData
          .filter((a) => a.row_id === row.id)
          .map((a): TimelineAnnotation => ({
            id: a.id,
            rowId: a.row_id,
            label: a.label,
            date: parseLocalDate(a.date),
            createdAt: new Date(a.created_at || Date.now()),
            updatedAt: new Date(a.updated_at || Date.now()),
          })),
      }))

      const phases: TimelinePhase[] = (phasesData || []).map((p) => ({
        id: p.id,
        timelineId: p.timeline_id,
        label: p.label,
        date: parseLocalDate(p.date),
        position: p.position,
        createdAt: new Date(p.created_at || Date.now()),
        updatedAt: new Date(p.updated_at || Date.now()),
      }))

      const fullTimeline: TimelineWithData = {
        id: timelineData.id,
        userId: timelineData.user_id,
        title: timelineData.title,
        startYear: timelineData.start_year,
        endYear: timelineData.end_year,
        createdAt: new Date(timelineData.created_at || Date.now()),
        updatedAt: new Date(timelineData.updated_at || Date.now()),
        rows,
        phases,
      }

      setTimeline(fullTimeline)
      setIsLoading(false)
    }

    loadTimeline()
  }, [authLoading, isGuest, timelineId, router])

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nodiac-dark via-slate-900 to-nodiac-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nodiac-primary" />
      </div>
    )
  }

  if (error || !timeline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nodiac-dark via-slate-900 to-nodiac-dark">
        <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-nodiac-dark/80 backdrop-blur-sm border-b border-white/5">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nodiac-primary to-nodiac-secondary flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
            </Link>
            <Navigation />
          </div>
        </header>
        <main className="pt-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-400 mb-4">{error || 'Timeline not found'}</p>
            <Link href="/timeline" className="text-nodiac-primary hover:underline">
              Back to timelines
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-nodiac-dark via-slate-900 to-nodiac-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 bg-nodiac-dark/80 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/timeline"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nodiac-primary to-nodiac-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
            </Link>
          </div>
          <Navigation />
        </div>
      </header>

      {/* Timeline Builder */}
      <main className="pt-20 pb-8 px-4">
        <TimelineBuilder timeline={timeline} onUpdate={setTimeline} />
      </main>
    </div>
  )
}
