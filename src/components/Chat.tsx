'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Message, AIModel, Perspective, AI_MODELS, PERSPECTIVES } from '@/types'
import { generateId } from '@/lib/utils'
import { useVoice } from '@/lib/useVoice'
import { useConversationHistory } from '@/lib/useConversationHistory'
import { ModelSelector } from './ModelSelector'
import { PerspectiveSelector } from './PerspectiveSelector'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ExportButton } from './ExportButton'
import { ConversationHistory } from './ConversationHistory'
import { ThemeToggle } from './ThemeToggle'
import { RotateCcw, Menu, X } from 'lucide-react'

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0])
  const [selectedPerspectives, setSelectedPerspectives] = useState<Perspective[]>([PERSPECTIVES[0]])
  const [pendingPerspectives, setPendingPerspectives] = useState<Set<string>>(new Set())
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    conversations,
    currentConversationId,
    isLoaded: isHistoryLoaded,
    saveConversation,
    loadConversation,
    deleteConversation,
    startNewConversation,
  } = useConversationHistory()

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-save conversation when messages change
  useEffect(() => {
    if (isHistoryLoaded && messages.length > 0) {
      saveConversation(messages, selectedModel, selectedPerspectives)
    }
  }, [messages, selectedModel, selectedPerspectives, isHistoryLoaded, saveConversation])

  const handleLoadConversation = useCallback((id: string) => {
    const conversation = loadConversation(id)
    if (conversation) {
      setMessages(conversation.messages)
      // Restore model if available
      const model = AI_MODELS.find(m => m.id === conversation.model.id)
      if (model) setSelectedModel(model)
      // Restore perspectives
      const perspectives = conversation.perspectives
        .map(pId => PERSPECTIVES.find(p => p.id === pId))
        .filter((p): p is Perspective => p !== undefined)
      if (perspectives.length > 0) setSelectedPerspectives(perspectives)
    }
    setIsSidebarOpen(false)
  }, [loadConversation])

  const handleNewConversation = useCallback(() => {
    startNewConversation()
    setMessages([])
    setIsSidebarOpen(false)
  }, [startNewConversation])

  const togglePerspective = (perspective: Perspective) => {
    setSelectedPerspectives(prev => {
      const isSelected = prev.some(p => p.id === perspective.id)
      if (isSelected) {
        // Don't allow deselecting the last one
        if (prev.length === 1) return prev
        return prev.filter(p => p.id !== perspective.id)
      } else {
        return [...prev, perspective]
      }
    })
  }

  const isLoading = pendingPerspectives.size > 0

  const sendMessage = async (content: string) => {
    if (selectedPerspectives.length === 0) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    // Track which perspectives are pending
    const pendingIds = new Set(selectedPerspectives.map(p => p.id))
    setPendingPerspectives(pendingIds)

    // Build conversation history (excluding perspective-specific responses for clean context)
    const conversationHistory = [...messages, userMessage]
      .filter(m => m.role === 'user')
      .map(m => ({ role: m.role, content: m.content }))

    // Track if we've spoken (for voice mode)
    let hasSpoken = false

    // Fire off all requests and handle each as it completes
    const promises = selectedPerspectives.map(async (perspective) => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationHistory,
            model: selectedModel.id,
            provider: selectedModel.provider,
            systemPrompt: perspective.systemPrompt,
          }),
        })

        const data = await response.json()

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.error ? `Error: ${data.error}` : data.content,
          perspective: perspective.id,
          timestamp: new Date(),
        }

        // Add this response immediately
        setMessages(prev => [...prev, assistantMessage])

        // Remove from pending
        setPendingPerspectives(prev => {
          const next = new Set(prev)
          next.delete(perspective.id)
          return next
        })

        // In voice mode, speak the first successful response
        if (isVoiceMode && !hasSpoken && !data.error) {
          hasSpoken = true
          try {
            await speak(data.content)
          } catch {
            // Speech synthesis error - continue without speaking
          }
        }
      } catch (error) {
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
          perspective: perspective.id,
          timestamp: new Date(),
        }

        setMessages(prev => [...prev, errorMessage])
        setPendingPerspectives(prev => {
          const next = new Set(prev)
          next.delete(perspective.id)
          return next
        })
      }
    })

    // Wait for all to complete (they update state as they finish)
    await Promise.all(promises)
  }

  const clearChat = () => {
    startNewConversation()
    setMessages([])
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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
        </div>

        <ConversationHistory
          conversations={conversations}
          currentConversationId={currentConversationId}
          onLoadConversation={handleLoadConversation}
          onDeleteConversation={deleteConversation}
          onNewConversation={handleNewConversation}
          disabled={isLoading}
        />

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <ExportButton
            messages={messages}
            selectedModel={selectedModel}
            disabled={isLoading}
          />
          <button
            data-testid="clear-chat"
            onClick={clearChat}
            disabled={isLoading || messages.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 pt-16 lg:pt-4">
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
                        Waiting for {Array.from(pendingPerspectives).map(id =>
                          PERSPECTIVES.find(p => p.id === id)?.name.split(' ')[0]
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
