'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useContextPrompts, ContextPrompt } from '@/hooks/useContextPrompts'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type EditModalProps = {
  prompt: ContextPrompt
  onSave: (content: string) => void
  onClose: () => void
}

function EditModal({ prompt, onSave, onClose }: EditModalProps) {
  const [content, setContent] = useState(prompt.content)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(content)
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Context</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {prompt.name}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
          />
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
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-nodiac-primary text-white hover:bg-nodiac-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

type AddPromptModalProps = {
  onAdd: (name: string, content: string) => Promise<void>
  onClose: () => void
}

function AddPromptModal({ onAdd, onClose }: AddPromptModalProps) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = async () => {
    if (!name.trim() || !content.trim()) return
    setIsSaving(true)
    try {
      await onAdd(name, content)
      onClose()
    } catch (error) {
      console.error('Error adding:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Personal Context</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meeting Notes, Project Details"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the context information..."
              className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-nodiac-primary focus:border-transparent"
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
            disabled={isSaving || !name.trim() || !content.trim()}
            className="px-4 py-2 rounded-lg bg-nodiac-primary text-white hover:bg-nodiac-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

type PromptItemProps = {
  prompt: ContextPrompt
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (prompt: ContextPrompt) => void
  onDelete?: (id: string) => void
}

function PromptItem({ prompt, onToggle, onEdit, onDelete }: PromptItemProps) {
  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <input
        type="checkbox"
        checked={prompt.is_enabled}
        onChange={() => onToggle(prompt.id, !prompt.is_enabled)}
        aria-label={`Toggle ${prompt.name}`}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-nodiac-primary focus:ring-nodiac-primary"
      />
      <span className={cn(
        'flex-1 text-sm truncate',
        prompt.is_enabled
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-400 dark:text-gray-500 line-through'
      )}>
        {prompt.name}
      </span>
      <button
        onClick={() => onEdit(prompt)}
        title={`Edit ${prompt.name}`}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Pencil className="w-3 h-3 text-gray-500" />
      </button>
      {onDelete && (
        <button
          onClick={() => onDelete(prompt.id)}
          title={`Delete ${prompt.name}`}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      )}
    </div>
  )
}

export function NodiacContext() {
  const { isGuest } = useAuth()
  const {
    globalPrompts,
    personalPrompts,
    isLoading,
    updatePrompt,
    togglePrompt,
    addPersonalPrompt,
    deletePrompt,
  } = useContextPrompts()

  const [isExpanded, setIsExpanded] = useState(true)
  const [editingPrompt, setEditingPrompt] = useState<ContextPrompt | null>(null)
  const [isAddingPrompt, setIsAddingPrompt] = useState(false)

  // Don't render for guests
  if (isGuest) {
    return null
  }

  const allPrompts = [...globalPrompts, ...personalPrompts]
  const enabledCount = allPrompts.filter(p => p.is_enabled).length

  const handleSaveEdit = async (content: string) => {
    if (!editingPrompt) return
    await updatePrompt(editingPrompt.id, { content })
  }

  const handleAddPrompt = async (name: string, content: string) => {
    await addPersonalPrompt(name, content)
  }

  const handleDelete = async (promptId: string) => {
    if (!confirm('Delete this context?')) return
    await deletePrompt(promptId)
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2"
      >
        <span>
          Nodiac Context <span className="text-gray-400 dark:text-gray-500 font-normal">({enabledCount} enabled)</span>
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
              {/* Global Prompts */}
              {globalPrompts.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Global
                  </div>
                  <div className="space-y-0.5">
                    {globalPrompts.map((prompt) => (
                      <PromptItem
                        key={prompt.id}
                        prompt={prompt}
                        onToggle={togglePrompt}
                        onEdit={setEditingPrompt}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Prompts */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Personal
                  </div>
                  <button
                    onClick={() => setIsAddingPrompt(true)}
                    title="Add personal context"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                {personalPrompts.length === 0 ? (
                  <div className="text-xs text-gray-400 dark:text-gray-500 py-1">
                    No personal context yet
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {personalPrompts.map((prompt) => (
                      <PromptItem
                        key={prompt.id}
                        prompt={prompt}
                        onToggle={togglePrompt}
                        onEdit={setEditingPrompt}
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

      {/* Edit Modal */}
      {editingPrompt && (
        <EditModal
          prompt={editingPrompt}
          onSave={handleSaveEdit}
          onClose={() => setEditingPrompt(null)}
        />
      )}

      {/* Add Prompt Modal */}
      {isAddingPrompt && (
        <AddPromptModal
          onAdd={handleAddPrompt}
          onClose={() => setIsAddingPrompt(false)}
        />
      )}
    </div>
  )
}
