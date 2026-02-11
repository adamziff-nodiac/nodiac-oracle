'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { EditableText } from './EditableText'
import { ColorPicker } from './ColorPicker'
import { TimelineMilestone } from './TimelineMilestone'
import { dateToPosition, positionToDate } from '@/types/timeline'
import { cn } from '@/lib/utils'
import type { TimelineRowWithData } from '@/types/timeline'

interface TimelineRowProps {
  row: TimelineRowWithData
  startYear: number
  endYear: number
  onUpdate: (updates: Partial<TimelineRowWithData>) => void
  onDelete: () => void
  onAddMilestoneAtPosition: (date: Date) => Promise<string | undefined>
  onUpdateMilestone: (milestoneId: string, updates: { label?: string; date?: Date }) => void
  onDeleteMilestone: (milestoneId: string) => void
  isDragging?: boolean
  rowCount?: number
  leftMargin: number
}

// Dynamic sizing based on row count - larger sizes for better visibility
function getSizing(rowCount: number) {
  if (rowCount <= 2) {
    return {
      barHeight: 32,
      handleSize: 36,
      containerHeight: 120,
      labelWidth: 250,
      labelFontSize: 24,
      gripSize: 28,
      controlSize: 28,
    }
  } else if (rowCount <= 4) {
    return {
      barHeight: 28,
      handleSize: 32,
      containerHeight: 100,
      labelWidth: 230,
      labelFontSize: 22,
      gripSize: 26,
      controlSize: 26,
    }
  } else if (rowCount <= 6) {
    return {
      barHeight: 24,
      handleSize: 28,
      containerHeight: 90,
      labelWidth: 210,
      labelFontSize: 20,
      gripSize: 24,
      controlSize: 24,
    }
  } else {
    return {
      barHeight: 20,
      handleSize: 24,
      containerHeight: 80,
      labelWidth: 190,
      labelFontSize: 18,
      gripSize: 22,
      controlSize: 22,
    }
  }
}

export function TimelineRow({
  row,
  startYear,
  endYear,
  onUpdate,
  onDelete,
  onAddMilestoneAtPosition,
  onUpdateMilestone,
  onDeleteMilestone,
  isDragging,
  rowCount = 5,
  leftMargin,
}: TimelineRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: row.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const [dragType, setDragType] = useState<'move' | 'start' | 'end' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [originalStart, setOriginalStart] = useState(0)
  const [originalEnd, setOriginalEnd] = useState(0)
  const [newMilestoneId, setNewMilestoneId] = useState<string | null>(null)
  // Local drag positions - only visual, DB write happens on mouseup
  const [dragBarStart, setDragBarStart] = useState<number | null>(null)
  const [dragBarEnd, setDragBarEnd] = useState<number | null>(null)
  const [hasMoved, setHasMoved] = useState(false)

  // Get dynamic sizing
  const sizing = useMemo(() => getSizing(rowCount), [rowCount])

  // Calculate bar position and width - use drag positions during drag
  const baseBarStart = dateToPosition(row.startDate, startYear, endYear)
  const baseBarEnd = dateToPosition(row.endDate, startYear, endYear)
  const barStart = dragBarStart !== null ? dragBarStart : baseBarStart
  const barEnd = dragBarEnd !== null ? dragBarEnd : baseBarEnd
  const barWidth = Math.max(barEnd - barStart, 1)

  // Find milestone at end position (end milestone)
  const endMilestone = useMemo(() => {
    return row.milestones.find((m) => {
      const milestonePos = dateToPosition(m.date, startYear, endYear)
      return Math.abs(milestonePos - baseBarEnd) < 0.5 // Within 0.5% tolerance
    })
  }, [row.milestones, baseBarEnd, startYear, endYear])

  // Filter out end milestone from regular milestones
  const regularMilestones = useMemo(() => {
    if (!endMilestone) return row.milestones
    return row.milestones.filter((m) => m.id !== endMilestone.id)
  }, [row.milestones, endMilestone])

  // Calculate milestone stagger levels based on overlap detection
  // Estimate label width as ~1% per character, centered on position
  const milestoneStaggerLevels = useMemo(() => {
    const CHAR_WIDTH_PERCENT = 1.0 // Each character takes ~1% of timeline width
    const PADDING_PERCENT = 1 // Extra padding between labels

    // Include end milestone in overlap calculation if it exists
    const allMilestones = endMilestone
      ? [...regularMilestones, endMilestone]
      : regularMilestones

    const sortedMilestones = allMilestones
      .map(m => {
        const position = dateToPosition(m.date, startYear, endYear)
        const labelWidth = m.label.length * CHAR_WIDTH_PERCENT
        return {
          id: m.id,
          position,
          left: position - labelWidth / 2,
          right: position + labelWidth / 2,
        }
      })
      .sort((a, b) => a.position - b.position)

    const levels: Record<string, number> = {}
    // Track rightmost extent at each level
    const levelRightEdges: number[] = [-Infinity, -Infinity]

    for (const milestone of sortedMilestones) {
      // Try level 0 (above) first
      if (milestone.left > levelRightEdges[0] + PADDING_PERCENT) {
        levels[milestone.id] = 0
        levelRightEdges[0] = milestone.right
      }
      // Try level 1 (below) if level 0 would overlap
      else if (milestone.left > levelRightEdges[1] + PADDING_PERCENT) {
        levels[milestone.id] = 1
        levelRightEdges[1] = milestone.right
      }
      // Both levels would overlap - use level 0 anyway (best effort)
      else {
        levels[milestone.id] = 0
        levelRightEdges[0] = milestone.right
      }
    }

    return levels
  }, [regularMilestones, endMilestone, startYear, endYear])

  // Max valid position: last half-quarter snap point (e.g. 87.5% for a 1-year timeline)
  const maxPosition = useMemo(() => {
    const totalQuarters = (endYear - startYear + 1) * 4
    return 100 - (100 / (totalQuarters * 2))
  }, [startYear, endYear])

  // Snap to quarter boundaries or quarter midpoints (half-quarter intervals)
  const snapToHalfQuarter = useCallback((percent: number) => {
    const totalQuarters = (endYear - startYear + 1) * 4
    const halfQuarterWidth = 100 / (totalQuarters * 2) // Half-quarter intervals
    const snapped = Math.round(percent / halfQuarterWidth) * halfQuarterWidth
    return Math.max(0, Math.min(snapped, maxPosition))
  }, [startYear, endYear, maxPosition])

  // Handle mouse down on bar (move) or handles (resize)
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'start' | 'end') => {
    e.preventDefault()
    e.stopPropagation()
    setDragType(type)
    setHasMoved(false)
    setDragStartX(e.clientX)
    setOriginalStart(baseBarStart)
    setOriginalEnd(baseBarEnd)
    setDragBarStart(baseBarStart)
    setDragBarEnd(baseBarEnd)
  }, [baseBarStart, baseBarEnd])

  // Handle double-click on bar to add milestone
  const handleBarDoubleClick = useCallback(async (e: React.MouseEvent) => {
    if (!containerRef.current) return
    e.preventDefault()
    e.stopPropagation()

    const rect = containerRef.current.getBoundingClientRect()
    const clickPercent = ((e.clientX - rect.left) / rect.width) * 100
    const snappedPercent = snapToHalfQuarter(clickPercent)
    const date = positionToDate(snappedPercent, startYear, endYear)

    const milestoneId = await onAddMilestoneAtPosition(date)
    if (milestoneId) {
      setNewMilestoneId(milestoneId)
    }
  }, [snapToHalfQuarter, startYear, endYear, onAddMilestoneAtPosition])

  // Handle mouse move - only update local visual state
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragType || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const deltaPercent = ((e.clientX - dragStartX) / rect.width) * 100

    if (dragType === 'move') {
      // Move the entire bar
      const barWidth = originalEnd - originalStart
      let newStart = snapToHalfQuarter(originalStart + deltaPercent)
      let newEnd = newStart + barWidth

      // Clamp to bounds
      if (newStart < 0) {
        newStart = 0
        newEnd = barWidth
      }
      if (newEnd > maxPosition) {
        newEnd = maxPosition
        newStart = maxPosition - barWidth
      }

      // Check if actually moved
      if (Math.abs(newStart - originalStart) > 0.01) {
        setHasMoved(true)
      }
      setDragBarStart(newStart)
      setDragBarEnd(newEnd)
    } else if (dragType === 'start') {
      // Resize from start
      let newStart = snapToHalfQuarter(originalStart + deltaPercent)
      newStart = Math.max(0, Math.min(newStart, originalEnd - 5)) // Min 5% width
      if (Math.abs(newStart - originalStart) > 0.01) {
        setHasMoved(true)
      }
      setDragBarStart(newStart)
    } else if (dragType === 'end') {
      // Resize from end
      let newEnd = snapToHalfQuarter(originalEnd + deltaPercent)
      newEnd = Math.min(maxPosition, Math.max(newEnd, originalStart + 5)) // Min 5% width
      if (Math.abs(newEnd - originalEnd) > 0.01) {
        setHasMoved(true)
      }
      setDragBarEnd(newEnd)
    }
  }, [dragType, dragStartX, originalStart, originalEnd, snapToHalfQuarter, maxPosition])

  // Handle mouse up - only write to DB if position changed
  const handleMouseUp = useCallback(() => {
    if (dragType && hasMoved && (dragBarStart !== null || dragBarEnd !== null)) {
      const finalStart = snapToHalfQuarter(dragBarStart !== null ? dragBarStart : baseBarStart)
      const finalEnd = snapToHalfQuarter(dragBarEnd !== null ? dragBarEnd : baseBarEnd)

      if (dragType === 'move') {
        const newStartDate = positionToDate(finalStart, startYear, endYear)
        const newEndDate = positionToDate(finalEnd, startYear, endYear)
        onUpdate({ startDate: newStartDate, endDate: newEndDate })
      } else if (dragType === 'start') {
        const newStartDate = positionToDate(finalStart, startYear, endYear)
        onUpdate({ startDate: newStartDate })
      } else if (dragType === 'end') {
        const newEndDate = positionToDate(finalEnd, startYear, endYear)
        onUpdate({ endDate: newEndDate })
      }
    }
    setDragType(null)
    setDragBarStart(null)
    setDragBarEnd(null)
    setHasMoved(false)
  }, [dragType, hasMoved, dragBarStart, dragBarEnd, baseBarStart, baseBarEnd, snapToHalfQuarter, startYear, endYear, onUpdate])

  // Add/remove global mouse listeners when dragging
  useEffect(() => {
    if (!dragType) return

    const moveHandler = (e: MouseEvent) => handleMouseMove(e)
    const upHandler = () => handleMouseUp()

    window.addEventListener('mousemove', moveHandler)
    window.addEventListener('mouseup', upHandler)

    return () => {
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('mouseup', upHandler)
    }
  }, [dragType, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative py-1 group',
        (isDragging || isSortableDragging) && 'opacity-50'
      )}
    >
      {/* Left side controls - positioned absolutely */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center gap-2" style={{ width: leftMargin }}>
        {/* Drag Handle for row reordering */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing"
          data-edit-control
        >
          <GripVertical style={{ width: sizing.gripSize, height: sizing.gripSize }} />
        </button>

        {/* Row Label */}
        <div className="flex-1 min-w-0 pr-4 flex items-center justify-end">
          <EditableText
            value={row.label}
            onChange={(label) => onUpdate({ label })}
            className="font-semibold text-white text-right"
            inputClassName="font-semibold text-white w-full text-right"
            style={{ fontSize: sizing.labelFontSize, textWrap: 'balance' }}
          />
        </div>
      </div>

      {/* Timeline Bar Container - uses same marginLeft as grid */}
      <div
        ref={containerRef}
        className="relative"
        style={{ height: sizing.containerHeight, marginLeft: leftMargin }}
      >
        {/* The Bar - draggable for moving, double-click to add milestone */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded-full cursor-move',
            dragType === 'move' && 'opacity-70'
          )}
          style={{
            left: `${barStart}%`,
            width: `${barWidth}%`,
            height: sizing.barHeight,
            backgroundColor: row.color,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
          onDoubleClick={handleBarDoubleClick}
          title="Double-click to add milestone"
        >
          {/* Bar gradient overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Start handle - visible in exports */}
        <div
          className={cn(
            'absolute top-1/2 rounded-full border-2 border-white/70 cursor-ew-resize z-10 hover:scale-125 transition-transform',
            dragType === 'start' && 'scale-125'
          )}
          style={{
            left: `${barStart}%`,
            width: sizing.handleSize,
            height: sizing.handleSize,
            backgroundColor: row.color,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        />

        {/* End handle - diamond shape with optional milestone label */}
        <div
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${barEnd}%`, zIndex: 15 }}
        >
          {/* End milestone label (if exists) */}
          {endMilestone && (
            <div
              className={cn(
                "absolute left-0 whitespace-nowrap",
                (milestoneStaggerLevels[endMilestone.id] || 0) === 0
                  ? "bottom-1/2 mb-4"
                  : "top-1/2 mt-6"
              )}
              style={{ transform: 'translateX(-50%)' }}
            >
              <EditableText
                value={endMilestone.label}
                onChange={(label) => onUpdateMilestone(endMilestone.id, { label })}
                className="font-semibold text-white px-1.5 py-0.5 bg-slate-800/90 rounded"
                inputClassName="font-semibold text-white bg-slate-700 rounded px-1.5"
                style={{ fontSize: sizing.labelFontSize * 0.8 }}
              />
            </div>
          )}

          {/* Diamond handle */}
          <div
            className={cn(
              'absolute top-1/2 left-0 border-2 border-white cursor-ew-resize z-10 shadow-lg hover:scale-125 transition-transform',
              dragType === 'end' && 'scale-125'
            )}
            style={{
              width: sizing.handleSize,
              height: sizing.handleSize,
              backgroundColor: row.color,
              transform: 'translate(-50%, -50%) rotate(45deg)',
            }}
            onMouseDown={(e) => handleMouseDown(e, 'end')}
          />
        </div>

        {/* Milestones (excluding end milestone) */}
        {regularMilestones.map((milestone) => (
          <TimelineMilestone
            key={milestone.id}
            milestone={milestone}
            color={row.color}
            startYear={startYear}
            endYear={endYear}
            onUpdate={(updates) => onUpdateMilestone(milestone.id, updates)}
            onDelete={() => onDeleteMilestone(milestone.id)}
            isNew={milestone.id === newMilestoneId}
            onNewComplete={() => setNewMilestoneId(null)}
            staggerLevel={milestoneStaggerLevels[milestone.id] || 0}
            containerRef={containerRef}
            rowCount={rowCount}
          />
        ))}
      </div>

      {/* Row Controls - positioned absolutely on the right */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        data-edit-control
      >
        <ColorPicker value={row.color} onChange={(color) => onUpdate({ color })} />
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
          title="Delete row"
        >
          <Trash2 style={{ width: sizing.controlSize, height: sizing.controlSize }} />
        </button>
      </div>
    </div>
  )
}
