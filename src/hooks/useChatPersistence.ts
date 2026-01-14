'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Message } from '@/types'
import { generateId } from '@/lib/utils'

type ChatPersistenceOptions = {
  modelId: string
  perspectives: string[]
}

export function useChatPersistence(options: ChatPersistenceOptions) {
  const { user, isGuest } = useAuth()
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isCreatingChat, setIsCreatingChat] = useState(false)

  // Use ref to track the chat ID being created to avoid race conditions
  const pendingChatIdRef = useRef<Promise<string | null> | null>(null)
  // Use ref to store chatId immediately (not waiting for React state update)
  const chatIdRef = useRef<string | null>(null)

  // Create a new chat in the database
  const createChat = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      if (isGuest || !user) return null

      // If a chat creation is already pending, wait for it
      if (pendingChatIdRef.current) {
        return pendingChatIdRef.current
      }

      setIsCreatingChat(true)

      const createPromise = (async () => {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('chats')
            .insert({
              user_id: user.id,
              title: firstMessage.slice(0, 100), // Use first 100 chars as title
              model_id: options.modelId,
              perspectives: options.perspectives,
            })
            .select()
            .single()

          if (error) throw error
          chatIdRef.current = data.id  // Store immediately in ref
          setChatId(data.id)
          return data.id
        } catch (error) {
          console.error('Error creating chat:', error)
          return null
        } finally {
          setIsCreatingChat(false)
          pendingChatIdRef.current = null
        }
      })()

      pendingChatIdRef.current = createPromise
      return createPromise
    },
    [isGuest, user, options.modelId, options.perspectives]
  )

  // Save a message to the database
  const saveMessage = useCallback(
    async (
      chatIdToUse: string,
      message: { role: 'user' | 'assistant'; content: string; perspective?: string }
    ) => {
      if (isGuest) return

      try {
        const supabase = createClient()
        await supabase.from('messages').insert({
          chat_id: chatIdToUse,
          role: message.role,
          content: message.content,
          perspective: message.perspective || null,
        })
      } catch (error) {
        console.error('Error saving message:', error)
      }
    },
    [isGuest]
  )

  // Add message with optional persistence
  const addMessage = useCallback(
    async (messageData: {
      role: 'user' | 'assistant'
      content: string
      perspective?: string
    }): Promise<Message> => {
      const newMessage: Message = {
        id: generateId(),
        role: messageData.role,
        content: messageData.content,
        perspective: messageData.perspective,
        timestamp: new Date(),
      }

      // Optimistically add to UI
      setMessages((prev) => [...prev, newMessage])

      // Persist if logged in
      if (!isGuest && user) {
        // Use ref for immediate access (React state may not have updated yet)
        let currentChatId = chatIdRef.current

        // Create chat if this is the first user message
        if (!currentChatId && messageData.role === 'user') {
          currentChatId = await createChat(messageData.content)
        }

        if (currentChatId) {
          await saveMessage(currentChatId, messageData)
        }
      }

      return newMessage
    },
    [isGuest, user, createChat, saveMessage]
  )

  // Update an existing message's content (for streaming)
  const updateMessage = useCallback(
    (messageId: string, content: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content } : m
        )
      )
    },
    []
  )

  // Finalize a message (save to database after streaming completes)
  const finalizeMessage = useCallback(
    async (messageId: string, content: string, perspective?: string) => {
      // Update the message content one final time
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content } : m
        )
      )

      // Persist if logged in
      if (!isGuest && user) {
        const currentChatId = chatIdRef.current
        if (currentChatId) {
          await saveMessage(currentChatId, {
            role: 'assistant',
            content,
            perspective,
          })
        }
      }
    },
    [isGuest, user, saveMessage]
  )

  // Add a placeholder message for streaming (doesn't save to DB yet)
  const addStreamingMessage = useCallback(
    async (messageData: {
      perspective?: string
    }): Promise<Message> => {
      const newMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        perspective: messageData.perspective,
        timestamp: new Date(),
      }

      // Add to UI with empty content
      setMessages((prev) => [...prev, newMessage])

      return newMessage
    },
    []
  )

  // Load a specific chat from the database
  const loadChat = useCallback(
    async (loadChatId: string) => {
      if (isGuest) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', loadChatId)
          .order('sequence_num', { ascending: true })

        if (error) throw error

        const loadedMessages: Message[] = data.map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          perspective: m.perspective || undefined,
          timestamp: new Date(m.created_at || Date.now()),
        }))

        setMessages(loadedMessages)
        chatIdRef.current = loadChatId  // Store immediately in ref
        setChatId(loadChatId)
      } catch (error) {
        console.error('Error loading chat:', error)
      }
    },
    [isGuest]
  )

  // Start a new chat (clear current)
  const newChat = useCallback(() => {
    chatIdRef.current = null  // Clear ref immediately
    setChatId(null)
    setMessages([])
    pendingChatIdRef.current = null
  }, [])

  // Update chat title (useful after first exchange)
  const updateChatTitle = useCallback(
    async (title: string) => {
      if (isGuest || !chatId) return

      try {
        const supabase = createClient()
        await supabase
          .from('chats')
          .update({ title: title.slice(0, 100) })
          .eq('id', chatId)
      } catch (error) {
        console.error('Error updating chat title:', error)
      }
    },
    [isGuest, chatId]
  )

  return {
    chatId,
    messages,
    setMessages,
    addMessage,
    updateMessage,
    finalizeMessage,
    addStreamingMessage,
    loadChat,
    newChat,
    isCreatingChat,
    updateChatTitle,
  }
}
