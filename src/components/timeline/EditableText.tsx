'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
  as?: 'span' | 'h1' | 'h2' | 'p'
  autoEdit?: boolean
  onEditEnd?: () => void
  style?: React.CSSProperties
}

export function EditableText({
  value,
  onChange,
  className,
  inputClassName,
  placeholder = 'Enter text...',
  as: Component = 'span',
  autoEdit = false,
  onEditEnd,
  style,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(autoEdit)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(value)
  }, [value])

  // Handle autoEdit prop changes
  useEffect(() => {
    if (autoEdit) {
      setIsEditing(true)
    }
  }, [autoEdit])

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== value) {
      onChange(trimmed)
    } else {
      setEditValue(value)
    }
    setIsEditing(false)
    onEditEnd?.()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
      onEditEnd?.()
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          'bg-transparent border-b border-nodiac-primary outline-none',
          inputClassName
        )}
        style={style}
        placeholder={placeholder}
        data-edit-control
      />
    )
  }

  // Display mode - no data-edit-control so it appears in exports
  return (
    <Component
      onClick={() => setIsEditing(true)}
      className={cn(
        'cursor-pointer hover:bg-white/10 rounded px-1 -mx-1 transition-colors',
        className
      )}
      style={style}
    >
      {value || placeholder}
    </Component>
  )
}
