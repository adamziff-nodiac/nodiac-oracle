'use client'

import { SavedConversation } from '@/lib/useConversationHistory'
import { cn } from '@/lib/utils'
import { Plus, Trash2, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

type ConversationHistoryProps = {
  conversations: SavedConversation[]
  currentConversationId: string | null
  onLoadConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onNewConversation: () => void
  disabled?: boolean
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

export function ConversationHistory({
  conversations,
  currentConversationId,
  onLoadConversation,
  onDeleteConversation,
  onNewConversation,
  disabled,
}: ConversationHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          History
          {conversations.length > 0 && (
            <span className="text-xs text-gray-400">({conversations.length})</span>
          )}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <button
            onClick={onNewConversation}
            disabled={disabled}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
              'border border-dashed border-gray-300 dark:border-gray-600',
              'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>

          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
              No saved conversations yet
            </p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-start gap-2 p-2 rounded-lg cursor-pointer',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    currentConversationId === conv.id && 'bg-nodiac-primary/10'
                  )}
                  onClick={() => !disabled && onLoadConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm truncate',
                      currentConversationId === conv.id
                        ? 'text-nodiac-primary font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    )}>
                      {conv.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(conv.updatedAt)} - {conv.messages.length} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConversation(conv.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
