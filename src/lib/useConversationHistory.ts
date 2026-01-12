'use client'

import { useState, useEffect, useCallback } from 'react'
import { Message, AIModel, Perspective } from '@/types'

export type SavedConversation = {
  id: string
  title: string
  messages: Message[]
  model: AIModel
  perspectives: string[]
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = 'nodiac-oracle-conversations'
const MAX_CONVERSATIONS = 50

function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user')
  if (!firstUserMessage) return 'New Conversation'
  const content = firstUserMessage.content.slice(0, 50)
  return content.length < firstUserMessage.content.length ? `${content}...` : content
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<SavedConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Convert date strings back to Date objects
        const hydrated = parsed.map((conv: SavedConversation) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((m: Message) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }))
        setConversations(hydrated)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever conversations change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
      } catch (error) {
        console.error('Failed to save conversations:', error)
      }
    }
  }, [conversations, isLoaded])

  const saveConversation = useCallback((
    messages: Message[],
    model: AIModel,
    perspectives: Perspective[]
  ) => {
    if (messages.length === 0) return null

    const now = new Date()
    const perspectiveIds = perspectives.map(p => p.id)

    setConversations(prev => {
      // Check if we're updating an existing conversation
      if (currentConversationId) {
        return prev.map(conv =>
          conv.id === currentConversationId
            ? {
                ...conv,
                messages,
                model,
                perspectives: perspectiveIds,
                title: generateTitle(messages),
                updatedAt: now,
              }
            : conv
        )
      }

      // Create new conversation
      const newConversation: SavedConversation = {
        id: generateConversationId(),
        title: generateTitle(messages),
        messages,
        model,
        perspectives: perspectiveIds,
        createdAt: now,
        updatedAt: now,
      }

      setCurrentConversationId(newConversation.id)

      // Add to beginning, limit total
      const updated = [newConversation, ...prev].slice(0, MAX_CONVERSATIONS)
      return updated
    })

    return currentConversationId
  }, [currentConversationId])

  const loadConversation = useCallback((id: string): SavedConversation | null => {
    const conversation = conversations.find(c => c.id === id)
    if (conversation) {
      setCurrentConversationId(id)
    }
    return conversation || null
  }, [conversations])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentConversationId === id) {
      setCurrentConversationId(null)
    }
  }, [currentConversationId])

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null)
  }, [])

  const clearAllConversations = useCallback(() => {
    setConversations([])
    setCurrentConversationId(null)
  }, [])

  return {
    conversations,
    currentConversationId,
    isLoaded,
    saveConversation,
    loadConversation,
    deleteConversation,
    startNewConversation,
    clearAllConversations,
  }
}
