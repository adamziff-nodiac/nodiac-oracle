'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePerspectives } from '@/hooks/usePerspectives'
import { Perspective } from '@/types'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Portal wrapper to render modals at document body level
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null
  return createPortal(children, document.body)
}

type EditModalProps = {
  perspective: Perspective
  onSave: (updates: { name: string; description: string; systemPrompt: string; icon: string }) => void
  onClose: () => void
}

function EditModal({ perspective, onSave, onClose }: EditModalProps) {
  const [name, setName] = useState(perspective.name)
  const [description, setDescription] = useState(perspective.description)
  const [systemPrompt, setSystemPrompt] = useState(perspective.systemPrompt)
  const [icon, setIcon] = useState(perspective.icon || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({ name, description, systemPrompt, icon })
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Perspective</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
              />
            </div>
            <div className="w-20">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🎯"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-nodiac-primary focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !systemPrompt.trim()}
            className="px-4 py-2 rounded-lg bg-nodiac-primary text-white hover:bg-nodiac-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

type AddModalProps = {
  onAdd: (data: { slug: string; name: string; description: string; systemPrompt: string; icon: string }) => Promise<void>
  onClose: () => void
}

function AddModal({ onAdd, onClose }: AddModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [icon, setIcon] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleAdd = async () => {
    if (!name.trim() || !systemPrompt.trim()) return
    setIsSaving(true)
    try {
      await onAdd({
        slug: generateSlug(name),
        name: name.trim(),
        description: description.trim(),
        systemPrompt: systemPrompt.trim(),
        icon: icon || '🎯',
      })
      onClose()
    } catch (error) {
      console.error('Error adding:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Personal Perspective</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Data Center Architect"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
              />
            </div>
            <div className="w-20">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🎯"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this perspective"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System Prompt *
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Describe the persona, expertise, and focus areas for this perspective..."
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-nodiac-primary focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isSaving || !name.trim() || !systemPrompt.trim()}
            className="px-4 py-2 rounded-lg bg-nodiac-primary text-white hover:bg-nodiac-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

type PerspectiveItemProps = {
  perspective: Perspective
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (perspective: Perspective) => void
  onDelete?: (id: string) => void
}

function PerspectiveItem({ perspective, onToggle, onEdit, onDelete }: PerspectiveItemProps) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <input
        type="checkbox"
        checked={perspective.isEnabled}
        onChange={() => onToggle(perspective.id, !perspective.isEnabled)}
        aria-label={`Toggle ${perspective.name}`}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-nodiac-primary focus:ring-nodiac-primary"
      />
      <span className="text-base">{perspective.icon}</span>
      <span className={cn(
        'flex-1 text-sm truncate',
        perspective.isEnabled
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-400 dark:text-gray-500 line-through'
      )}>
        {perspective.name}
      </span>
      <button
        onClick={() => onEdit(perspective)}
        title={`Edit ${perspective.name}`}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <Pencil className="w-3 h-3" />
      </button>
      {onDelete && (
        <button
          onClick={() => onDelete(perspective.id)}
          title={`Delete ${perspective.name}`}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export function PerspectiveManager() {
  const { isGuest } = useAuth()
  const {
    globalPerspectives,
    personalPerspectives,
    isLoading,
    updatePerspective,
    togglePerspective,
    addPersonalPerspective,
    deletePerspective,
  } = usePerspectives()

  const [isExpanded, setIsExpanded] = useState(false)
  const [editingPerspective, setEditingPerspective] = useState<Perspective | null>(null)
  const [isAddingPerspective, setIsAddingPerspective] = useState(false)

  // Don't render for guests
  if (isGuest) {
    return null
  }

  const allPerspectives = [...globalPerspectives, ...personalPerspectives]
  const enabledCount = allPerspectives.filter(p => p.isEnabled).length

  const handleSaveEdit = async (updates: { name: string; description: string; systemPrompt: string; icon: string }) => {
    if (!editingPerspective) return
    await updatePerspective(editingPerspective.id, updates)
  }

  const handleAddPerspective = async (data: { slug: string; name: string; description: string; systemPrompt: string; icon: string }) => {
    await addPersonalPerspective(data)
  }

  const handleDelete = async (perspectiveId: string) => {
    if (!confirm('Delete this perspective?')) return
    await deletePerspective(perspectiveId)
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2"
      >
        <span>
          Manage Perspectives <span className="text-gray-400 dark:text-gray-500 font-normal">({enabledCount} enabled)</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Global Perspectives */}
              {globalPerspectives.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Global
                  </div>
                  <div className="space-y-0.5">
                    {globalPerspectives.map((perspective) => (
                      <PerspectiveItem
                        key={perspective.id}
                        perspective={perspective}
                        onToggle={togglePerspective}
                        onEdit={setEditingPerspective}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Perspectives */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Personal
                  </div>
                  <button
                    onClick={() => setIsAddingPerspective(true)}
                    title="Add personal perspective"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {personalPerspectives.length === 0 ? (
                  <div className="text-xs text-gray-400 dark:text-gray-500 py-1">
                    No personal perspectives yet
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {personalPerspectives.map((perspective) => (
                      <PerspectiveItem
                        key={perspective.id}
                        perspective={perspective}
                        onToggle={togglePerspective}
                        onEdit={setEditingPerspective}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Modal - rendered via portal to escape sidebar transform */}
      {editingPerspective && (
        <Portal>
          <EditModal
            perspective={editingPerspective}
            onSave={handleSaveEdit}
            onClose={() => setEditingPerspective(null)}
          />
        </Portal>
      )}

      {/* Add Modal - rendered via portal to escape sidebar transform */}
      {isAddingPerspective && (
        <Portal>
          <AddModal
            onAdd={handleAddPerspective}
            onClose={() => setIsAddingPerspective(false)}
          />
        </Portal>
      )}
    </div>
  )
}
