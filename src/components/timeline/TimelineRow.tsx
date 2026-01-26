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
}

// Dynamic sizing based on row count - larger sizes for better visibility
function getSizing(rowCount: number) {
  if (rowCount <= 2) {
    return {
      barHeight: 32,
      handleSize: 36,
      containerHeight: 120,
      labelWidth: 130,
      labelFontSize: 28,
      gripSize: 28,
      controlSize: 28,
    }
  } else if (rowCount <= 4) {
    return {
      barHeight: 28,
      handleSize: 32,
      containerHeight: 100,
      labelWidth: 120,
      labelFontSize: 26,
      gripSize: 26,
      controlSize: 26,
    }
  } else if (rowCount <= 6) {
    return {
      barHeight: 24,
      handleSize: 28,
      containerHeight: 90,
      labelWidth: 110,
      labelFontSize: 24,
      gripSize: 24,
      controlSize: 24,
    }
  } else {
    return {
      barHeight: 20,
      handleSize: 24,
      containerHeight: 80,
      labelWidth: 100,
      labelFontSize: 22,
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

  // Snap to quarter boundaries or quarter midpoints (half-quarter intervals)
  const snapToHalfQuarter = useCallback((percent: number) => {
    const totalQuarters = (endYear - startYear + 1) * 4
    const halfQuarterWidth = 100 / (totalQuarters * 2) // Half-quarter intervals
    return Math.round(percent / halfQuarterWidth) * halfQuarterWidth
  }, [startYear, endYear])

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
      if (newEnd > 100) {
        newEnd = 100
        newStart = 100 - barWidth
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
      newEnd = Math.min(100, Math.max(newEnd, originalStart + 5)) // Min 5% width
      if (Math.abs(newEnd - originalEnd) > 0.01) {
        setHasMoved(true)
      }
      setDragBarEnd(newEnd)
    }
  }, [dragType, dragStartX, originalStart, originalEnd, snapToHalfQuarter])

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
        'flex items-center gap-2 py-1 group',
        (isDragging || isSortableDragging) && 'opacity-50'
      )}
    >
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
      <div className="flex-shrink-0" style={{ width: sizing.labelWidth }}>
        <EditableText
          value={row.label}
          onChange={(label) => onUpdate({ label })}
          className="font-semibold text-white truncate"
          inputClassName="font-semibold text-white w-full"
          style={{ fontSize: sizing.labelFontSize }}
        />
      </div>

      {/* Timeline Bar Container */}
      <div
        ref={containerRef}
        className="flex-1 relative"
        style={{ height: sizing.containerHeight }}
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

        {/* End handle - visible in exports */}
        <div
          className={cn(
            'absolute top-1/2 rounded-full border-2 border-white/70 cursor-ew-resize z-10 hover:scale-125 transition-transform',
            dragType === 'end' && 'scale-125'
          )}
          style={{
            left: `${barEnd}%`,
            width: sizing.handleSize,
            height: sizing.handleSize,
            backgroundColor: row.color,
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        />

        {/* Milestones */}
        {row.milestones.map((milestone, index) => (
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
            index={index}
            containerRef={containerRef}
            rowCount={rowCount}
          />
        ))}
      </div>

      {/* Row Controls */}
      <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" data-edit-control>
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
