'use client'

import { useMemo, useRef } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TimelineRow } from './TimelineRow'
import { TimelinePhase } from './TimelinePhase'
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
}

// Dynamic sizing based on row count for the canvas - increased sizes
function getCanvasSizing(rowCount: number) {
  if (rowCount <= 2) {
    return {
      yearFontSize: 22,
      quarterFontSize: 16,
      leftMargin: 140,
    }
  } else if (rowCount <= 4) {
    return {
      yearFontSize: 20,
      quarterFontSize: 15,
      leftMargin: 130,
    }
  } else if (rowCount <= 6) {
    return {
      yearFontSize: 18,
      quarterFontSize: 14,
      leftMargin: 120,
    }
  } else {
    return {
      yearFontSize: 16,
      quarterFontSize: 13,
      leftMargin: 110,
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
}: TimelineCanvasProps) {
  const { startYear, endYear, rows, phases } = timeline
  const totalYears = endYear - startYear + 1
  const years = Array.from({ length: totalYears }, (_, i) => startYear + i)

  // Calculate year width percentage
  const yearWidth = 100 / totalYears

  const rowCount = Math.max(rows.length, 1)
  const contentRef = useRef<HTMLDivElement>(null)

  // Get dynamic sizing
  const sizing = useMemo(() => getCanvasSizing(rowCount), [rowCount])

  return (
    <div className="relative h-full flex flex-col px-4 pb-2">
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
      <div ref={contentRef} className="flex-1 relative min-h-0">
        {/* Vertical grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ marginLeft: sizing.leftMargin }}>
          {years.map((year, yearIndex) =>
            ['Q1', 'Q2', 'Q3', 'Q4'].map((q, qIndex) => {
              const position = (yearIndex * 4 + qIndex) / (totalYears * 4) * 100
              return (
                <div
                  key={`grid-${year}-${q}`}
                  className="absolute top-0 bottom-0 border-l border-white/5"
                  style={{ left: `${position}%` }}
                />
              )
            })
          )}
          {/* Final line */}
          <div className="absolute top-0 bottom-0 right-0 border-l border-white/5" />
        </div>

        {/* Phase Lines */}
        {phases.map((phase) => (
          <TimelinePhase
            key={phase.id}
            phase={phase}
            startYear={startYear}
            endYear={endYear}
            onUpdate={(updates) => onUpdatePhase(phase.id, updates)}
            onDelete={() => onDeletePhase(phase.id)}
            rowCount={rowCount}
            leftMargin={sizing.leftMargin}
            containerRef={contentRef}
          />
        ))}

        {/* Rows - use flexbox to distribute space evenly */}
        <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="relative z-10 h-full flex flex-col justify-evenly">
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
      </div>

      {/* Bottom axis */}
      <div className="flex-shrink-0 mt-2">
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
    </div>
  )
}
