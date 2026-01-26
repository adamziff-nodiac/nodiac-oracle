'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { EditableText } from './EditableText'
import { dateToPosition, positionToDate } from '@/types/timeline'
import { cn } from '@/lib/utils'
import type { TimelineMilestone as TimelineMilestoneType } from '@/types/timeline'

interface TimelineMilestoneProps {
  milestone: TimelineMilestoneType
  color: string
  startYear: number
  endYear: number
  onUpdate: (updates: { label?: string; date?: Date }) => void
  onDelete: () => void
  isNew?: boolean
  onNewComplete?: () => void
  index?: number
  containerRef?: React.RefObject<HTMLDivElement | null>
  rowCount?: number
}

// Dynamic sizing based on row count - increased sizes
function getMilestoneSizing(rowCount: number) {
  if (rowCount <= 2) {
    return {
      markerSize: 20,
      labelFontSize: 18,
      deleteIconSize: 16,
    }
  } else if (rowCount <= 4) {
    return {
      markerSize: 18,
      labelFontSize: 16,
      deleteIconSize: 14,
    }
  } else if (rowCount <= 6) {
    return {
      markerSize: 16,
      labelFontSize: 15,
      deleteIconSize: 12,
    }
  } else {
    return {
      markerSize: 14,
      labelFontSize: 14,
      deleteIconSize: 12,
    }
  }
}

export function TimelineMilestone({
  milestone,
  color,
  startYear,
  endYear,
  onUpdate,
  onDelete,
  isNew = false,
  onNewComplete,
  index: _index = 0,
  containerRef,
  rowCount = 5,
}: TimelineMilestoneProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [originalPosition, setOriginalPosition] = useState(0)
  const [dragPosition, setDragPosition] = useState<number | null>(null)
  const [hasMoved, setHasMoved] = useState(false)

  const basePosition = dateToPosition(milestone.date, startYear, endYear)
  // Use drag position during drag, otherwise use the actual position
  const position = dragPosition !== null ? dragPosition : basePosition

  // Get dynamic sizing
  const sizing = useMemo(() => getMilestoneSizing(rowCount), [rowCount])

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
    if (!isDragging || !containerRef?.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const deltaPercent = ((e.clientX - dragStartX) / rect.width) * 100
    let newPosition = snapToHalfQuarter(originalPosition + deltaPercent)
    newPosition = Math.max(0, Math.min(100, newPosition))

    // Only mark as moved if position actually changed
    if (Math.abs(newPosition - originalPosition) > 0.01) {
      setHasMoved(true)
    }
    setDragPosition(newPosition)
  }, [isDragging, dragStartX, originalPosition, snapToHalfQuarter, containerRef])

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
      className="absolute top-0 bottom-0 flex flex-col items-center"
      style={{ left: `${position}%`, zIndex: isHovered || isDragging ? 30 : 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Label - always positioned above the marker */}
      <div
        className="absolute bottom-1/2 mb-4 whitespace-nowrap flex items-center gap-1"
        style={{ transform: 'translateX(-50%)' }}
      >
        <EditableText
          value={milestone.label}
          onChange={(label) => onUpdate({ label })}
          className="font-semibold text-white px-1.5 py-0.5 bg-slate-800/90 rounded"
          inputClassName="font-semibold text-white bg-slate-700 rounded px-1.5"
          style={{ fontSize: sizing.labelFontSize }}
          autoEdit={isNew}
          onEditEnd={onNewComplete}
        />

        {/* Delete button - show on hover */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-0.5 text-gray-400 hover:text-red-400 bg-slate-800/90 rounded transition-colors"
            title="Delete milestone"
            data-edit-control
          >
            <X style={{ width: sizing.deleteIconSize, height: sizing.deleteIconSize }} />
          </button>
        )}
      </div>

      {/* Vertical line connecting label to marker */}
      <div
        className="absolute bottom-1/2 w-px bg-white/40"
        style={{
          height: 12,
          transform: 'translateX(-50%)',
        }}
      />

      {/* Diamond Marker - centered on the bar, visible in exports */}
      <div
        className={cn(
          'absolute top-1/2 border-2 border-white shadow-lg cursor-grab transition-transform',
          isDragging && 'cursor-grabbing scale-125',
          isHovered && !isDragging && 'scale-110'
        )}
        style={{
          width: sizing.markerSize,
          height: sizing.markerSize,
          backgroundColor: color,
          transform: `translate(-50%, -50%) rotate(45deg)`,
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  )
}
