'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Trash2, MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatSummary = {
  id: string
  title: string | null
  updated_at: string | null
  model_id: string
}

type ChatHistoryProps = {
  currentChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
}

export function ChatHistory({
  currentChatId,
  onSelectChat,
  onNewChat,
}: ChatHistoryProps) {
  const { user, isGuest } = useAuth()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch chat history
  useEffect(() => {
    if (isGuest || !user) {
      setIsLoading(false)
      setChats([])
      return
    }

    const fetchChats = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('chats')
          .select('id, title, updated_at, model_id')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setChats(data || [])
      } catch (error) {
        console.error('Error fetching chats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()

    // Subscribe to changes
    const supabase = createClient()
    const channel = supabase
      .channel('chats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchChats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, isGuest])

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this chat?')) return

    setDeletingId(chatId)
    try {
      const supabase = createClient()
      await supabase.from('chats').delete().eq('id', chatId)
      setChats((prev) => prev.filter((c) => c.id !== chatId))
      if (currentChatId === chatId) {
        onNewChat()
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (isGuest) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 px-2">
          Sign in to save and access your chat history
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between px-1 mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          Chat History
        </button>
        <button
          onClick={onNewChat}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          title="New chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              No chats yet
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  'flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  currentChatId === chat.id &&
                    'bg-gray-100 dark:bg-gray-700'
                )}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate text-gray-900 dark:text-white">
                    {chat.title || 'Untitled Chat'}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(chat.updated_at)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(chat.id, e)}
                  disabled={deletingId === chat.id}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  title="Delete chat"
                >
                  {deletingId === chat.id ? (
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  ) : (
                    <Trash2 className="w-3 h-3 text-red-500" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
