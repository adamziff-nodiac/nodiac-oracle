'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { EditableText } from './EditableText'
import { DatePicker } from './DatePicker'
import { dateToPosition, positionToDate } from '@/types/timeline'
import { cn } from '@/lib/utils'
import type { TimelinePhase as TimelinePhaseType } from '@/types/timeline'

interface TimelinePhaseProps {
  phase: TimelinePhaseType
  startYear: number
  endYear: number
  onUpdate: (updates: { label?: string; date?: Date }) => void
  onDelete: () => void
  rowCount?: number
  staggerLevel?: number
}

// Dynamic sizing based on row count - smaller sizes for phase labels
function getPhaseSizing(rowCount: number) {
  if (rowCount <= 2) {
    return {
      labelFontSize: 14,
      controlFontSize: 14,
      deleteIconSize: 14,
    }
  } else if (rowCount <= 4) {
    return {
      labelFontSize: 13,
      controlFontSize: 13,
      deleteIconSize: 14,
    }
  } else if (rowCount <= 6) {
    return {
      labelFontSize: 12,
      controlFontSize: 12,
      deleteIconSize: 12,
    }
  } else {
    return {
      labelFontSize: 11,
      controlFontSize: 11,
      deleteIconSize: 12,
    }
  }
}

export function TimelinePhase({
  phase,
  startYear,
  endYear,
  onUpdate,
  onDelete,
  rowCount = 5,
  staggerLevel = 0,
}: TimelinePhaseProps) {
  const [showControls, setShowControls] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [originalPosition, setOriginalPosition] = useState(0)
  const [dragPosition, setDragPosition] = useState<number | null>(null)
  const [hasMoved, setHasMoved] = useState(false)
  const phaseRef = useRef<HTMLDivElement>(null)

  const basePosition = dateToPosition(phase.date, startYear, endYear)
  // Use drag position during drag, otherwise use the actual position
  const position = dragPosition !== null ? dragPosition : basePosition

  // Get dynamic sizing
  const sizing = useMemo(() => getPhaseSizing(rowCount), [rowCount])

  // Format label with line break after first colon - keep on single line for compactness
  const formattedLabel = useMemo(() => {
    const colonIndex = phase.label.indexOf(': ')
    if (colonIndex === -1) return null // No colon, use default display
    const firstPart = phase.label.slice(0, colonIndex + 1)
    const secondPart = phase.label.slice(colonIndex + 2)
    return (
      <>
        {firstPart}<br/>{secondPart}
      </>
    )
  }, [phase.label])

  // Snap to quarter boundaries or quarter midpoints (half-quarter intervals)
  const snapToHalfQuarter = useCallback((percent: number) => {
    const totalQuarters = (endYear - startYear + 1) * 4
    const halfQuarterWidth = 100 / (totalQuarters * 2) // Half-quarter intervals
    return Math.round(percent / halfQuarterWidth) * halfQuarterWidth
  }, [startYear, endYear])

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setHasMoved(false)
    setDragStartX(e.clientX)
    setOriginalPosition(basePosition)
    setDragPosition(basePosition)
  }, [basePosition])

  // Handle drag move - only update local visual state
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !phaseRef.current?.parentElement) return

    const rect = phaseRef.current.parentElement.getBoundingClientRect()
    const deltaPercent = ((e.clientX - dragStartX) / rect.width) * 100
    let newPosition = snapToHalfQuarter(originalPosition + deltaPercent)
    newPosition = Math.max(0, Math.min(100, newPosition))

    // Only mark as moved if position actually changed
    if (Math.abs(newPosition - originalPosition) > 0.01) {
      setHasMoved(true)
    }
    setDragPosition(newPosition)
  }, [isDragging, dragStartX, originalPosition, snapToHalfQuarter])

  // Handle drag end - only write to DB if position changed
  const handleMouseUp = useCallback(() => {
    if (isDragging && hasMoved && dragPosition !== null) {
      // Snap final position before writing
      const snappedPosition = snapToHalfQuarter(dragPosition)
      const newDate = positionToDate(snappedPosition, startYear, endYear)
      onUpdate({ date: newDate })
    }
    setIsDragging(false)
    setDragPosition(null)
    setHasMoved(false)
  }, [isDragging, hasMoved, dragPosition, snapToHalfQuarter, startYear, endYear, onUpdate])

  // Add/remove global mouse listeners when dragging
  useEffect(() => {
    if (!isDragging) return

    const moveHandler = (e: MouseEvent) => handleMouseMove(e)
    const upHandler = () => handleMouseUp()

    window.addEventListener('mousemove', moveHandler)
    window.addEventListener('mouseup', upHandler)

    return () => {
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('mouseup', upHandler)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={phaseRef}
      className={cn(
        "absolute bottom-0 z-20 group/phase pointer-events-auto",
        isDragging && "z-30"
      )}
      style={{ left: `${position}%`, top: -16 }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isDragging && setShowControls(false)}
    >
      {/* Dashed line - draggable */}
      <div
        className={cn(
          "absolute bottom-0 w-3 -ml-1.5 cursor-ew-resize flex items-center justify-center",
          isDragging && "bg-white/10"
        )}
        style={{ top: 16 }}
        onMouseDown={handleMouseDown}
        title="Drag to move phase"
      >
        <div className={cn(
          "w-px h-full border-l-2 border-dashed transition-colors",
          isDragging ? "border-white/60" : "border-white/30"
        )} />
      </div>

      {/* Label and controls container */}
      <div
        className="absolute flex flex-col"
        style={{ top: 12 + (staggerLevel * 28), left: 4 }}
      >
        {/* Label - pill with teal accent for brand connection */}
        <div className="bg-slate-700/90 backdrop-blur-sm px-1.5 py-px rounded border border-white/10 border-l-2 border-l-nodiac-secondary leading-tight shadow-sm">
          <EditableText
            value={phase.label}
            onChange={(label) => onUpdate({ label })}
            className="font-medium text-white whitespace-nowrap leading-tight"
            inputClassName="font-medium text-white bg-transparent"
            style={{ fontSize: sizing.labelFontSize }}
            displayValue={formattedLabel}
          />
        </div>

        {/* Controls */}
        {showControls && (
          <div
            className="flex items-center gap-1 bg-slate-800 border border-white/10 rounded px-1.5 py-0.5 mt-1"
            data-edit-control
          >
            <DatePicker
              value={phase.date}
              onChange={(date) => onUpdate({ date })}
              minYear={startYear}
              maxYear={endYear}
            />
            <button
              onClick={onDelete}
              className="p-0.5 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete phase"
            >
              <X style={{ width: sizing.deleteIconSize, height: sizing.deleteIconSize }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
