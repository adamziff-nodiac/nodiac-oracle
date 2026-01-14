'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { AIModel, Perspective, AI_MODELS } from '@/types'
import { useVoice } from '@/lib/useVoice'
import { useAuth } from '@/contexts/AuthContext'
import { useChatPersistence } from '@/hooks/useChatPersistence'
import { useContextPrompts } from '@/hooks/useContextPrompts'
import { usePerspectives } from '@/hooks/usePerspectives'
import { ModelSelector } from './ModelSelector'
import { PerspectiveSelector } from './PerspectiveSelector'
import { PerspectiveManager } from './PerspectiveManager'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ExportButton } from './ExportButton'
import { ThemeToggle } from './ThemeToggle'
import { AuthButton } from './auth/AuthButton'
import { ChatHistory } from './ChatHistory'
import { NodiacContext } from './NodiacContext'
import { Plus, Menu, X } from 'lucide-react'

export function Chat() {
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0])
  const [selectedPerspectives, setSelectedPerspectives] = useState<Perspective[]>([])
  const [pendingPerspectives, setPendingPerspectives] = useState<Set<string>>(new Set())
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [perspectivesInitialized, setPerspectivesInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const { isGuest } = useAuth()
  const { getEnabledPerspectives, getPerspectiveBySlug, isLoading: perspectivesLoading } = usePerspectives()

  // Initialize selected perspectives once they're loaded
  useEffect(() => {
    if (!perspectivesLoading && !perspectivesInitialized) {
      const enabled = getEnabledPerspectives()
      if (enabled.length > 0) {
        setSelectedPerspectives([enabled[0]])
        setPerspectivesInitialized(true)
      }
    }
  }, [perspectivesLoading, perspectivesInitialized, getEnabledPerspectives])
  const {
    chatId,
    messages,
    addMessage,
    updateMessage,
    finalizeMessage,
    addStreamingMessage,
    loadChat,
    newChat,
  } = useChatPersistence({
    modelId: selectedModel.id,
    perspectives: selectedPerspectives.map(p => p.slug),
  })
  const { getEnabledContext } = useContextPrompts()

  const {
    isListening,
    isSpeaking,
    transcript,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoice()

  // Only scroll to bottom when user sends a message, not when receiving
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const togglePerspective = (perspective: Perspective) => {
    setSelectedPerspectives(prev => {
      const isSelected = prev.some(p => p.slug === perspective.slug)
      if (isSelected) {
        // Don't allow deselecting the last one
        if (prev.length === 1) return prev
        return prev.filter(p => p.slug !== perspective.slug)
      } else {
        return [...prev, perspective]
      }
    })
  }

  const isLoading = pendingPerspectives.size > 0

  const sendMessage = async (content: string) => {
    if (selectedPerspectives.length === 0) return

    // Close sidebar on mobile when sending a message
    setIsSidebarOpen(false)

    // Add user message (auto-saves if logged in)
    const userMessage = await addMessage({
      role: 'user',
      content,
    })

    // Scroll to bottom when user sends a message
    setTimeout(() => scrollToBottom(), 50)

    // Track which perspectives are pending (using slug for backwards compat)
    const pendingSlugs = new Set(selectedPerspectives.map(p => p.slug))
    setPendingPerspectives(pendingSlugs)

    // Build conversation history (excluding perspective-specific responses for clean context)
    const conversationHistory = [...messages, userMessage]
      .filter(m => m.role === 'user')
      .map(m => ({ role: m.role, content: m.content }))

    // Track if we've spoken (for voice mode)
    let hasSpoken = false

    // Get enabled context to prepend to system prompts
    const nodiacContext = getEnabledContext()

    // Fire off all requests and handle each as it completes with streaming
    const promises = selectedPerspectives.map(async (perspective) => {
      try {
        // Combine Nodiac context with perspective system prompt
        const fullSystemPrompt = nodiacContext
          ? `${nodiacContext}\n\n---\n\n${perspective.systemPrompt}`
          : perspective.systemPrompt

        // Create a placeholder message for streaming (use slug for backwards compat)
        const streamingMessage = await addStreamingMessage({
          perspective: perspective.slug,
        })

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistory,
            model: selectedModel.id,
            provider: selectedModel.provider,
            systemPrompt: fullSystemPrompt,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          updateMessage(streamingMessage.id, `Error: ${errorData.error || 'Request failed'}`)
          setPendingPerspectives(prev => {
            const next = new Set(prev)
            next.delete(perspective.slug)
            return next
          })
          return
        }

        // Handle streaming response
        const reader = response.body?.getReader()
        if (!reader) {
          updateMessage(streamingMessage.id, 'Error: No response stream available')
          setPendingPerspectives(prev => {
            const next = new Set(prev)
            next.delete(perspective.slug)
            return next
          })
          return
        }

        const decoder = new TextDecoder()
        let accumulatedContent = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete SSE events from buffer
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)

              if (data === '[DONE]') {
                // Streaming complete
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.token) {
                  accumulatedContent += parsed.token
                  updateMessage(streamingMessage.id, accumulatedContent)
                } else if (parsed.error) {
                  accumulatedContent = `Error: ${parsed.error}`
                  updateMessage(streamingMessage.id, accumulatedContent)
                }
              } catch {
                // Ignore JSON parse errors for incomplete data
              }
            }
          }
        }

        // Finalize the message (save to database)
        await finalizeMessage(streamingMessage.id, accumulatedContent, perspective.slug)

        // Remove from pending
        setPendingPerspectives(prev => {
          const next = new Set(prev)
          next.delete(perspective.slug)
          return next
        })

        // In voice mode, speak the first successful response
        if (isVoiceMode && !hasSpoken && accumulatedContent && !accumulatedContent.startsWith('Error:')) {
          hasSpoken = true
          try {
            await speak(accumulatedContent)
          } catch {
            // Speech synthesis error - continue without speaking
          }
        }
      } catch (error) {
        // Add error message (auto-saves if logged in)
        await addMessage({
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
          perspective: perspective.slug,
        })

        setPendingPerspectives(prev => {
          const next = new Set(prev)
          next.delete(perspective.slug)
          return next
        })
      }
    })

    // Wait for all to complete (they update state as they finish)
    await Promise.all(promises)
  }


  return (
    <div className="flex h-dvh bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? (
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nodiac Oracle</h1>
            <ThemeToggle />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Multi-perspective AI advisor</p>
          <div className="mt-3">
            <AuthButton />
          </div>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isLoading}
          />

          <PerspectiveSelector
            selectedPerspectives={selectedPerspectives}
            onPerspectiveToggle={togglePerspective}
            disabled={isLoading}
          />

          <PerspectiveManager />

          <NodiacContext />

          <ChatHistory
            currentChatId={chatId}
            onSelectChat={loadChat}
            onNewChat={newChat}
          />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <ExportButton
            messages={messages}
            selectedModel={selectedModel}
            disabled={isLoading}
          />
          <button
            data-testid="new-chat"
            onClick={newChat}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm bg-nodiac-primary text-white hover:bg-nodiac-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 pt-16 lg:pt-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to Nodiac Oracle
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Get insights from different industry perspectives on data centers and clean energy.
                </p>
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  Select a model and one or more perspectives, then ask your question.
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {pendingPerspectives.size > 0 && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Waiting for {Array.from(pendingPerspectives).map(slug =>
                          getPerspectiveBySlug(slug)?.name.split(' ')[0]
                        ).join(', ')}...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSubmit={sendMessage}
          disabled={isLoading || selectedPerspectives.length === 0}
          isVoiceMode={isVoiceMode}
          onVoiceModeToggle={() => setIsVoiceMode(!isVoiceMode)}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onStartListening={startListening}
          onStopListening={stopListening}
          onStopSpeaking={stopSpeaking}
          transcript={transcript}
          isVoiceSupported={isVoiceSupported}
        />
      </div>
    </div>
  )
}
