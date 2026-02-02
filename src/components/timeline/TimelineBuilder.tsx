'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Download, Plus, Settings } from 'lucide-react'
import { toPng } from 'html-to-image'
import { EditableText } from './EditableText'
import { TimelineCanvas } from './TimelineCanvas'
import { TimelineRow } from './TimelineRow'
import { TimelineSettingsModal } from './TimelineSettingsModal'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type {
  TimelineWithData,
  TimelineRowWithData,
  CreateTimelineRow,
  TimelineMilestone,
  TimelinePhase,
  TimelineAnnotation,
} from '@/types/timeline'

// Parse date string as local timezone (not UTC)
// "2025-01-15" should be Jan 15 local time, not Jan 14 16:00 PST
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface TimelineBuilderProps {
  timeline: TimelineWithData
  onUpdate: (timeline: TimelineWithData) => void
}

export function TimelineBuilder({ timeline, onUpdate }: TimelineBuilderProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Draggable legend position (percentage-based)
  const [legendPosition, setLegendPosition] = useState({ x: 3, y: 10 })
  const [isDraggingLegend, setIsDraggingLegend] = useState(false)
  const legendDragStart = useRef({ x: 0, y: 0, startX: 0, startY: 0 })

  // Track pending writes to prevent realtime subscription from overwriting optimistic updates
  const pendingWritesRef = useRef(0)
  const realtimeDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const supabase = createClient()

  // Helper functions to track pending writes
  const startWrite = useCallback(() => {
    pendingWritesRef.current += 1
  }, [])

  const endWrite = useCallback(() => {
    pendingWritesRef.current = Math.max(0, pendingWritesRef.current - 1)
  }, [])

  // Helper to fetch all timeline data fresh from DB
  const fetchFullTimeline = useCallback(async () => {
    const [timelineResult, rowsResult, phasesResult] = await Promise.all([
      supabase.from('timelines').select('*').eq('id', timeline.id).single(),
      supabase.from('timeline_rows').select('*').eq('timeline_id', timeline.id).order('position'),
      supabase.from('timeline_phases').select('*').eq('timeline_id', timeline.id).order('position'),
    ])

    if (!timelineResult.data || !rowsResult.data) return null

    const rowIds = rowsResult.data.map((r) => r.id)
    const [milestonesResult, annotationsResult] = rowIds.length > 0
      ? await Promise.all([
          supabase.from('timeline_milestones').select('*').in('row_id', rowIds).order('position'),
          supabase.from('timeline_annotations').select('*').in('row_id', rowIds),
        ])
      : [{ data: [] }, { data: [] }]

    const rows: TimelineRowWithData[] = rowsResult.data.map((row) => ({
      id: row.id,
      timelineId: row.timeline_id,
      label: row.label,
      color: row.color,
      startDate: parseLocalDate(row.start_date),
      endDate: parseLocalDate(row.end_date),
      position: row.position,
      createdAt: new Date(row.created_at || Date.now()),
      updatedAt: new Date(row.updated_at || Date.now()),
      milestones: (milestonesResult.data || [])
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
      annotations: (annotationsResult.data || [])
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

    const phases: TimelinePhase[] = (phasesResult.data || []).map((p) => ({
      id: p.id,
      timelineId: p.timeline_id,
      label: p.label,
      date: parseLocalDate(p.date),
      position: p.position,
      createdAt: new Date(p.created_at || Date.now()),
      updatedAt: new Date(p.updated_at || Date.now()),
    }))

    const t = timelineResult.data
    return {
      id: t.id,
      userId: t.user_id,
      title: t.title,
      startYear: t.start_year,
      endYear: t.end_year,
      notes: t.notes || '',
      createdAt: new Date(t.created_at || Date.now()),
      updatedAt: new Date(t.updated_at || Date.now()),
      rows,
      phases,
    } as TimelineWithData
  }, [supabase, timeline.id])

  // Set up Supabase realtime subscriptions
  useEffect(() => {
    const handleChange = async () => {
      // Skip if there are pending writes to avoid overwriting optimistic updates
      if (pendingWritesRef.current > 0) {
        return
      }

      // Clear any existing debounce timeout
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current)
      }

      // Debounce the fetch to allow DB writes to complete
      realtimeDebounceRef.current = setTimeout(async () => {
        // Double-check no writes started during debounce
        if (pendingWritesRef.current > 0) {
          return
        }
        const freshData = await fetchFullTimeline()
        if (freshData) {
          onUpdate(freshData)
        }
      }, 300)
    }

    const channel = supabase
      .channel(`timeline-${timeline.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timelines', filter: `id=eq.${timeline.id}` },
        handleChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timeline_rows', filter: `timeline_id=eq.${timeline.id}` },
        handleChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timeline_phases', filter: `timeline_id=eq.${timeline.id}` },
        handleChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timeline_milestones' },
        handleChange
      )
      .subscribe()

    return () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [timeline.id, supabase, fetchFullTimeline, onUpdate])

  // Update timeline title
  const updateTitle = useCallback(
    async (title: string) => {
      startWrite()
      onUpdate({ ...timeline, title })
      await supabase.from('timelines').update({ title }).eq('id', timeline.id)
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Update timeline notes
  const updateNotes = useCallback(
    async (notes: string) => {
      startWrite()
      onUpdate({ ...timeline, notes })
      await supabase.from('timelines').update({ notes }).eq('id', timeline.id)
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Update timeline settings
  const updateSettings = useCallback(
    async (startYear: number, endYear: number) => {
      startWrite()
      onUpdate({ ...timeline, startYear, endYear })
      await supabase
        .from('timelines')
        .update({ start_year: startYear, end_year: endYear })
        .eq('id', timeline.id)
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Add a new row
  const addRow = useCallback(async () => {
    startWrite()
    const colors = ['#EAB308', '#14B8A6', '#F97316', '#EF4444', '#3B82F6', '#22C55E', '#A855F7', '#EC4899']
    const color = colors[timeline.rows.length % colors.length]
    const position = timeline.rows.length

    const newRow: CreateTimelineRow = {
      label: 'New Row',
      color,
      startDate: new Date(timeline.startYear, 0, 1),
      endDate: new Date(timeline.endYear, 11, 31),
    }

    const { data, error } = await supabase
      .from('timeline_rows')
      .insert({
        timeline_id: timeline.id,
        label: newRow.label,
        color: newRow.color,
        start_date: newRow.startDate.toISOString().split('T')[0],
        end_date: newRow.endDate.toISOString().split('T')[0],
        position,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding row:', error)
      endWrite()
      return
    }

    const fullRow: TimelineRowWithData = {
      id: data.id,
      timelineId: data.timeline_id,
      label: data.label,
      color: data.color,
      startDate: parseLocalDate(data.start_date),
      endDate: parseLocalDate(data.end_date),
      position: data.position,
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
      milestones: [],
      annotations: [],
    }

    onUpdate({
      ...timeline,
      rows: [...timeline.rows, fullRow],
    })
    endWrite()
  }, [timeline, onUpdate, supabase, startWrite, endWrite])

  // Add a new phase
  const addPhase = useCallback(async () => {
    startWrite()
    const position = timeline.phases.length
    const defaultDate = new Date(
      timeline.startYear + Math.floor((timeline.endYear - timeline.startYear) / 2),
      0,
      1
    )

    const { data, error } = await supabase
      .from('timeline_phases')
      .insert({
        timeline_id: timeline.id,
        label: `Phase ${position + 1}`,
        date: defaultDate.toISOString().split('T')[0],
        position,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding phase:', error)
      endWrite()
      return
    }

    onUpdate({
      ...timeline,
      phases: [
        ...timeline.phases,
        {
          id: data.id,
          timelineId: data.timeline_id,
          label: data.label,
          date: parseLocalDate(data.date),
          position: data.position,
          createdAt: new Date(data.created_at || Date.now()),
          updatedAt: new Date(data.updated_at || Date.now()),
        },
      ],
    })
    endWrite()
  }, [timeline, onUpdate, supabase, startWrite, endWrite])

  // Update a row
  const updateRow = useCallback(
    async (rowId: string, updates: Partial<TimelineRowWithData>) => {
      const rowIndex = timeline.rows.findIndex((r) => r.id === rowId)
      if (rowIndex === -1) return

      startWrite()
      const updatedRows = [...timeline.rows]
      updatedRows[rowIndex] = { ...updatedRows[rowIndex], ...updates }
      onUpdate({ ...timeline, rows: updatedRows })

      const dbUpdates: Record<string, unknown> = {}
      if (updates.label !== undefined) dbUpdates.label = updates.label
      if (updates.color !== undefined) dbUpdates.color = updates.color
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate.toISOString().split('T')[0]
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate.toISOString().split('T')[0]
      if (updates.position !== undefined) dbUpdates.position = updates.position

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('timeline_rows').update(dbUpdates).eq('id', rowId)
      }
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Delete a row
  const deleteRow = useCallback(
    async (rowId: string) => {
      startWrite()
      onUpdate({
        ...timeline,
        rows: timeline.rows.filter((r) => r.id !== rowId),
      })
      await supabase.from('timeline_rows').delete().eq('id', rowId)
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Add milestone to a row at a specific date, returns the milestone ID
  const addMilestoneAtPosition = useCallback(
    async (rowId: string, date: Date): Promise<string | undefined> => {
      const row = timeline.rows.find((r) => r.id === rowId)
      if (!row) return undefined

      startWrite()
      const position = row.milestones.length

      const { data, error } = await supabase
        .from('timeline_milestones')
        .insert({
          row_id: rowId,
          label: '',
          date: date.toISOString().split('T')[0],
          position,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding milestone:', error)
        endWrite()
        return undefined
      }

      const updatedRows = timeline.rows.map((r) => {
        if (r.id !== rowId) return r
        return {
          ...r,
          milestones: [
            ...r.milestones,
            {
              id: data.id,
              rowId: data.row_id,
              label: data.label,
              date: parseLocalDate(data.date),
              position: data.position,
              createdAt: new Date(data.created_at || Date.now()),
              updatedAt: new Date(data.updated_at || Date.now()),
            },
          ],
        }
      })

      onUpdate({ ...timeline, rows: updatedRows })
      endWrite()
      return data.id
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Update milestone
  const updateMilestone = useCallback(
    async (milestoneId: string, updates: { label?: string; date?: Date }) => {
      startWrite()
      const updatedRows = timeline.rows.map((row) => ({
        ...row,
        milestones: row.milestones.map((m) =>
          m.id === milestoneId ? { ...m, ...updates } : m
        ),
      }))
      onUpdate({ ...timeline, rows: updatedRows })

      const dbUpdates: Record<string, unknown> = {}
      if (updates.label !== undefined) dbUpdates.label = updates.label
      if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString().split('T')[0]

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('timeline_milestones').update(dbUpdates).eq('id', milestoneId)
      }
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Delete milestone
  const deleteMilestone = useCallback(
    async (milestoneId: string) => {
      startWrite()
      const updatedRows = timeline.rows.map((row) => ({
        ...row,
        milestones: row.milestones.filter((m) => m.id !== milestoneId),
      }))
      onUpdate({ ...timeline, rows: updatedRows })
      await supabase.from('timeline_milestones').delete().eq('id', milestoneId)
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Update phase
  const updatePhase = useCallback(
    async (phaseId: string, updates: { label?: string; date?: Date }) => {
      startWrite()
      const updatedPhases = timeline.phases.map((p) =>
        p.id === phaseId ? { ...p, ...updates } : p
      )
      onUpdate({ ...timeline, phases: updatedPhases })

      const dbUpdates: Record<string, unknown> = {}
      if (updates.label !== undefined) dbUpdates.label = updates.label
      if (updates.date !== undefined) dbUpdates.date = updates.date.toISOString().split('T')[0]

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('timeline_phases').update(dbUpdates).eq('id', phaseId)
      }
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Delete phase
  const deletePhase = useCallback(
    async (phaseId: string) => {
      startWrite()
      onUpdate({
        ...timeline,
        phases: timeline.phases.filter((p) => p.id !== phaseId),
      })
      await supabase.from('timeline_phases').delete().eq('id', phaseId)
      endWrite()
    },
    [timeline, onUpdate, supabase, startWrite, endWrite]
  )

  // Handle drag and drop for row reordering
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = timeline.rows.findIndex((r) => r.id === active.id)
      const newIndex = timeline.rows.findIndex((r) => r.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        startWrite()
        const newRows = [...timeline.rows]
        const [removed] = newRows.splice(oldIndex, 1)
        newRows.splice(newIndex, 0, removed)

        // Update positions
        const updatedRows = newRows.map((row, i) => ({ ...row, position: i }))
        onUpdate({ ...timeline, rows: updatedRows })

        // Persist position changes
        for (const row of updatedRows) {
          await supabase
            .from('timeline_rows')
            .update({ position: row.position })
            .eq('id', row.id)
        }
        endWrite()
      }
    }
  }

  // Legend drag handlers
  const handleLegendMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingLegend(true)
    legendDragStart.current = {
      x: e.clientX,
      y: e.clientY,
      startX: legendPosition.x,
      startY: legendPosition.y,
    }
  }, [legendPosition])

  useEffect(() => {
    if (!isDraggingLegend) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const deltaX = ((e.clientX - legendDragStart.current.x) / rect.width) * 100
      const deltaY = ((e.clientY - legendDragStart.current.y) / rect.height) * 100

      const newX = Math.max(5, Math.min(95, legendDragStart.current.startX + deltaX))
      const newY = Math.max(2, Math.min(95, legendDragStart.current.startY + deltaY))

      setLegendPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDraggingLegend(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingLegend])

  // Export to PNG
  const exportToPng = async () => {
    if (!canvasRef.current) return

    setIsExporting(true)

    try {
      // Hide edit controls
      const editControls = canvasRef.current.querySelectorAll('[data-edit-control]')
      editControls.forEach((el) => ((el as HTMLElement).style.visibility = 'hidden'))

      // Capture at actual screen size with high pixel ratio for quality
      // The element maintains 16:9 aspect ratio via CSS
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 3, // High quality
        backgroundColor: '#1a1a2e',
      })

      // Restore edit controls
      editControls.forEach((el) => ((el as HTMLElement).style.visibility = 'visible'))

      // Download
      const link = document.createElement('a')
      link.download = `${timeline.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-timeline.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const activeRow = activeId ? timeline.rows.find((r) => r.id === activeId) : null

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toolbar - outside the export area */}
      <div className="flex items-center justify-end mb-4 flex-wrap gap-2" data-edit-control>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </button>
        <button
          onClick={addPhase}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Phase</span>
        </button>
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Row</span>
        </button>
        {!timeline.notes && (
          <button
            onClick={() => updateNotes(' ')}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Notes</span>
          </button>
        )}
        <button
          onClick={exportToPng}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-nodiac-primary hover:bg-nodiac-primary/80 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PNG'}</span>
        </button>
      </div>

      {/* Timeline Canvas - this is what gets exported */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={canvasRef}
          className="bg-nodiac-dark rounded-2xl border border-white/10 flex flex-col overflow-hidden relative"
          style={{ aspectRatio: '16 / 9' }}
        >
          {/* Draggable Legend */}
          <div
            className={`absolute z-50 flex items-center gap-1.5 text-sm text-white/70 border border-white/20 rounded-md px-2 py-1 cursor-move select-none whitespace-nowrap ${isDraggingLegend ? 'opacity-80' : 'hover:border-white/40'}`}
            style={{
              left: `${legendPosition.x}%`,
              top: `${legendPosition.y}%`,
            }}
            onMouseDown={handleLegendMouseDown}
            title="Drag to reposition"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <polygon points="5,0 10,5 5,10 0,5" fill="currentColor" />
            </svg>
            <span>= COD</span>
          </div>

          {/* Title Header - included in export */}
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <EditableText
              value={timeline.title}
              onChange={updateTitle}
              className="text-3xl font-bold text-white"
              inputClassName="text-3xl font-bold text-white"
              as="h1"
            />
          </div>

          {/* Canvas content - flex-1 to fill remaining space */}
          <div className="flex-1 min-h-0">
            <TimelineCanvas
              timeline={timeline}
              onUpdateRow={updateRow}
              onDeleteRow={deleteRow}
              onAddMilestoneAtPosition={addMilestoneAtPosition}
              onUpdateMilestone={updateMilestone}
              onDeleteMilestone={deleteMilestone}
              onUpdatePhase={updatePhase}
              onDeletePhase={deletePhase}
              onUpdateNotes={updateNotes}
            />
          </div>
        </div>

        <DragOverlay>
          {activeRow ? (
            <div className="opacity-80">
              <TimelineRow
                row={activeRow}
                startYear={timeline.startYear}
                endYear={timeline.endYear}
                onUpdate={() => {}}
                onDelete={() => {}}
                onAddMilestoneAtPosition={async () => undefined}
                onUpdateMilestone={() => {}}
                onDeleteMilestone={() => {}}
                isDragging
                leftMargin={150}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Settings Modal */}
      {showSettings && (
        <TimelineSettingsModal
          startYear={timeline.startYear}
          endYear={timeline.endYear}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
