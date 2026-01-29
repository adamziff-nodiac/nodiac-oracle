'use client'

import { useMemo, useRef } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TimelineRow } from './TimelineRow'
import { TimelinePhase } from './TimelinePhase'
import { dateToPosition } from '@/types/timeline'
import type { TimelineWithData, TimelineRowWithData } from '@/types/timeline'

interface TimelineCanvasProps {
  timeline: TimelineWithData
  onUpdateRow: (rowId: string, updates: Partial<TimelineRowWithData>) => void
  onDeleteRow: (rowId: string) => void
  onAddMilestoneAtPosition: (rowId: string, date: Date) => Promise<string | undefined>
  onUpdateMilestone: (milestoneId: string, updates: { label?: string; date?: Date }) => void
  onDeleteMilestone: (milestoneId: string) => void
  onUpdatePhase: (phaseId: string, updates: { label?: string; date?: Date }) => void
  onDeletePhase: (phaseId: string) => void
  onUpdateNotes: (notes: string) => void
}

// Dynamic sizing based on row count for the canvas - larger sizes for better visibility
function getCanvasSizing(rowCount: number) {
  if (rowCount <= 2) {
    return {
      yearFontSize: 26,
      quarterFontSize: 18,
      leftMargin: 280,
    }
  } else if (rowCount <= 4) {
    return {
      yearFontSize: 24,
      quarterFontSize: 17,
      leftMargin: 260,
    }
  } else if (rowCount <= 6) {
    return {
      yearFontSize: 22,
      quarterFontSize: 16,
      leftMargin: 240,
    }
  } else {
    return {
      yearFontSize: 20,
      quarterFontSize: 15,
      leftMargin: 220,
    }
  }
}

export function TimelineCanvas({
  timeline,
  onUpdateRow,
  onDeleteRow,
  onAddMilestoneAtPosition,
  onUpdateMilestone,
  onDeleteMilestone,
  onUpdatePhase,
  onDeletePhase,
  onUpdateNotes,
}: TimelineCanvasProps) {
  const { startYear, endYear, rows, phases, notes } = timeline
  const totalYears = endYear - startYear + 1
  const years = Array.from({ length: totalYears }, (_, i) => startYear + i)

  // Calculate year width percentage
  const yearWidth = 100 / totalYears

  const rowCount = Math.max(rows.length, 1)
  const contentRef = useRef<HTMLDivElement>(null)

  // Get dynamic sizing
  const sizing = useMemo(() => getCanvasSizing(rowCount), [rowCount])

  // Calculate phase stagger levels based on overlap detection
  // Estimate label width based on character count (only first line if label has colon)
  const phaseStaggerLevels = useMemo(() => {
    const CHAR_WIDTH_PERCENT = 0.8 // Each character takes ~0.8% of timeline width
    const PADDING_PERCENT = 3 // Extra padding between labels

    const sortedPhases = [...phases]
      .map(p => {
        const position = dateToPosition(p.date, startYear, endYear)
        // Only count characters before first ": " since that's the first line
        const colonIndex = p.label.indexOf(': ')
        const firstLineLength = colonIndex !== -1 ? colonIndex + 1 : p.label.length
        const labelWidth = firstLineLength * CHAR_WIDTH_PERCENT
        return {
          id: p.id,
          position,
          left: position,
          right: position + labelWidth,
        }
      })
      .sort((a, b) => a.position - b.position)

    const levels: Record<string, number> = {}
    // Track rightmost extent at each level (support up to 6 levels)
    const levelRightEdges: number[] = [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity, -Infinity]

    for (const phase of sortedPhases) {
      // Try each level in order
      let assigned = false
      for (let level = 0; level < 6; level++) {
        if (phase.left > levelRightEdges[level] + PADDING_PERCENT) {
          levels[phase.id] = level
          levelRightEdges[level] = phase.right
          assigned = true
          break
        }
      }
      // All levels would overlap - use level 0 anyway
      if (!assigned) {
        levels[phase.id] = 0
        levelRightEdges[0] = phase.right
      }
    }

    return levels
  }, [phases, startYear, endYear])

  return (
    <div className="relative h-full flex flex-col px-4 pb-2">
      {/* Legend */}
      <div className="flex-shrink-0 mb-3 flex items-center gap-2 text-sm text-white/70">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" className="text-white/60">
            <rect x="6" y="0" width="8.5" height="8.5" transform="rotate(45 6 6)" fill="currentColor" />
          </svg>
          <span>= COD</span>
        </div>
      </div>

      {/* Time Axis Header */}
      <div className="flex-shrink-0 mb-2">
        {/* Year labels */}
        <div className="flex" style={{ marginLeft: sizing.leftMargin }}>
          {years.map((year) => (
            <div
              key={year}
              className="text-center font-semibold text-white/80"
              style={{ width: `${yearWidth}%`, fontSize: sizing.yearFontSize }}
            >
              {year}
            </div>
          ))}
        </div>
        {/* Quarter labels */}
        <div className="flex mt-1" style={{ marginLeft: sizing.leftMargin }}>
          {years.map((year) => (
            <div key={year} className="flex" style={{ width: `${yearWidth}%` }}>
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                <div
                  key={`${year}-${q}`}
                  className="text-center text-gray-500"
                  style={{ width: '25%', fontSize: sizing.quarterFontSize }}
                >
                  {q}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main content area with rows */}
      <div ref={contentRef} className="flex-1 relative min-h-0 flex flex-col">
        {/* Vertical grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ marginLeft: sizing.leftMargin }}>
          {years.map((year, yearIndex) =>
            ['Q1', 'Q2', 'Q3', 'Q4'].map((q, qIndex) => {
              const position = (yearIndex * 4 + qIndex) / (totalYears * 4) * 100
              const isYearBoundary = qIndex === 0
              return (
                <div
                  key={`grid-${year}-${q}`}
                  className={`absolute top-0 bottom-0 border-l ${isYearBoundary ? 'border-white/20' : 'border-white/5'}`}
                  style={{ left: `${position}%` }}
                />
              )
            })
          )}
          {/* Final line (end of last year) */}
          <div className="absolute top-0 bottom-0 right-0 border-l border-white/20" />
        </div>

        {/* Phase Lines - positioned in a container with left margin like the grid */}
        <div className="absolute inset-0 z-[12] pointer-events-none" style={{ marginLeft: sizing.leftMargin }}>
          {phases.map((phase) => (
            <TimelinePhase
              key={phase.id}
              phase={phase}
              startYear={startYear}
              endYear={endYear}
              onUpdate={(updates) => onUpdatePhase(phase.id, updates)}
              onDelete={() => onDeletePhase(phase.id)}
              rowCount={rowCount}
              staggerLevel={phaseStaggerLevels[phase.id] || 0}
            />
          ))}
        </div>

        {/* Rows - use flexbox to distribute space evenly, with top padding for phase labels */}
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="relative z-10 flex-1 flex flex-col justify-evenly pt-8">
            {rows.map((row) => (
              <TimelineRow
                key={row.id}
                row={row}
                startYear={startYear}
                endYear={endYear}
                onUpdate={(updates) => onUpdateRow(row.id, updates)}
                onDelete={() => onDeleteRow(row.id)}
                onAddMilestoneAtPosition={(date) => onAddMilestoneAtPosition(row.id, date)}
                onUpdateMilestone={onUpdateMilestone}
                onDeleteMilestone={onDeleteMilestone}
                rowCount={rowCount}
                leftMargin={sizing.leftMargin}
              />
            ))}
          </div>
        </SortableContext>

        {/* Empty state */}
        {rows.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Click &quot;+ Row&quot; to add your first timeline row
          </div>
        )}

        {/* Notes section - edge-to-edge background to hide grid and phase lines */}
        {notes !== undefined && notes !== '' && (
          <div className="flex-shrink-0 relative z-[15] -mx-4 px-4 py-3 mt-6 bg-[var(--background)]">
            <textarea
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Add notes..."
              className="w-full bg-transparent text-gray-400 text-sm leading-relaxed resize-none outline-none placeholder:text-gray-600 px-4"
              style={{ fontSize: 14, minHeight: 40 }}
              rows={Math.max(notes.split('\n').length, 2)}
            />
          </div>
        )}
      </div>

      {/* Bottom section - axis (when no notes) */}
      {!(notes !== undefined && notes !== '') && (
        <div className="flex-shrink-0 mt-2">
          {/* Bottom axis */}
          <div className="flex" style={{ marginLeft: sizing.leftMargin }}>
            {years.map((year) => (
              <div key={year} className="flex" style={{ width: `${yearWidth}%` }}>
                {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                  <div
                    key={`bottom-${year}-${q}`}
                    className="text-center text-gray-500"
                    style={{ width: '25%', fontSize: sizing.quarterFontSize }}
                  >
                    {q}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex mt-1" style={{ marginLeft: sizing.leftMargin }}>
            {years.map((year) => (
              <div
                key={year}
                className="text-center font-semibold text-white/80"
                style={{ width: `${yearWidth}%`, fontSize: sizing.yearFontSize }}
              >
                {year}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
