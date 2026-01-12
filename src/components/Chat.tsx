'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Message, AIModel, Perspective, AI_MODELS, PERSPECTIVES } from '@/types'
import { generateId } from '@/lib/utils'
import { useVoice } from '@/lib/useVoice'
import { ModelSelector } from './ModelSelector'
import { PerspectiveSelector } from './PerspectiveSelector'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ExportButton } from './ExportButton'
import { RotateCcw } from 'lucide-react'

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0])
  const [selectedPerspectives, setSelectedPerspectives] = useState<Perspective[]>([PERSPECTIVES[0]])
  const [pendingPerspectives, setPendingPerspectives] = useState<Set<string>>(new Set())
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    setMessages([])
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Nodiac Oracle</h1>
          <p className="text-sm text-gray-500 mt-1">Multi-perspective AI advisor</p>
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

        <div className="p-4 border-t border-gray-200 space-y-2">
          <ExportButton
            messages={messages}
            selectedModel={selectedModel}
            disabled={isLoading}
          />
          <button
            data-testid="clear-chat"
            onClick={clearChat}
            disabled={isLoading || messages.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to Nodiac Oracle
                </h2>
                <p className="text-gray-500 mb-4">
                  Get insights from different industry perspectives on data centers and clean energy.
                </p>
                <div className="text-sm text-gray-400">
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
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-gray-500">
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
