'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, Volume2, VolumeX, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTTS } from '@/contexts/TTSContext'

type ChatInputProps = {
  onSubmit: (message: string) => void
  disabled?: boolean
  isListening: boolean
  onStartListening: () => void
  onStopListening: () => void
  transcript: string
  isVoiceSupported: boolean
}

export function ChatInput({
  onSubmit,
  disabled,
  isListening,
  onStartListening,
  onStopListening,
  transcript,
  isVoiceSupported,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prefixTextRef = useRef('')  // Text that was in input before recording started

  const { autoReadEnabled, toggleAutoRead, isSpeaking, stopSpeaking, isSupported: isTTSSupported } = useTTS()

  const hasInput = input.trim().length > 0

  // Update input with prefix + transcript while listening
  useEffect(() => {
    if (isListening) {
      const prefix = prefixTextRef.current
      const separator = prefix && transcript ? ' ' : ''
      setInput(prefix + separator + transcript)
    }
  }, [transcript, isListening])

  // When listening stops, clear the prefix ref (text is now in input)
  useEffect(() => {
    if (!isListening) {
      prefixTextRef.current = ''
    }
  }, [isListening])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (trimmed && !disabled) {
      onSubmit(trimmed)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleMicClick = () => {
    if (isListening) {
      onStopListening()
    } else {
      // Store existing text to concatenate with new speech
      prefixTextRef.current = input.trim()
      onStartListening()
    }
  }

  const handleAutoReadToggle = () => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      toggleAutoRead()
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* Desktop layout - buttons outside */}
      <div className="hidden sm:flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isListening}
            placeholder={isListening ? 'Listening... speak now' : 'Type your message...'}
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600 px-4 py-3',
              'text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
              'bg-white dark:bg-gray-700',
              'focus:border-nodiac-primary focus:ring-1 focus:ring-nodiac-primary focus:outline-none',
              'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
              isListening && 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
            )}
          />
        </div>

        {/* Mic button */}
        {isVoiceSupported && (
          <button
            data-testid="mic-button"
            onClick={handleMicClick}
            disabled={disabled}
            className={cn(
              'flex-shrink-0 p-2.5 rounded-full transition-colors',
              isListening
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title={isListening ? 'Stop recording' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Auto-read toggle */}
        {isTTSSupported && (
          <button
            data-testid="auto-read-toggle"
            onClick={handleAutoReadToggle}
            className={cn(
              'flex-shrink-0 p-2.5 rounded-full transition-colors',
              isSpeaking
                ? 'bg-orange-500 text-white animate-pulse'
                : autoReadEnabled
                  ? 'bg-nodiac-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
            title={isSpeaking ? 'Stop speaking' : autoReadEnabled ? 'Auto-read ON (click to turn off)' : 'Auto-read OFF (click to turn on)'}
          >
            {isSpeaking ? (
              <Square className="w-5 h-5 fill-current" />
            ) : autoReadEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Send button */}
        <button
          data-testid="send-button"
          onClick={handleSubmit}
          disabled={disabled || !input.trim() || isListening}
          className={cn(
            'flex-shrink-0 p-2.5 rounded-full',
            'bg-nodiac-primary text-white hover:bg-nodiac-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile layout - single button inside textbox for clean UI */}
      <div className="sm:hidden relative">
        <textarea
          ref={textareaRef}
          data-testid="chat-input-mobile"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isListening}
          placeholder={isListening ? 'Listening...' : 'Type your message...'}
          rows={1}
          className={cn(
            'w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600 pl-4 pr-14 py-3',
            'text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
            'bg-white dark:bg-gray-700',
            'focus:border-nodiac-primary focus:ring-1 focus:ring-nodiac-primary focus:outline-none',
            'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
            isListening && 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
          )}
        />

        {/* Single button inside textbox - mic when empty, send when typing */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {hasInput ? (
            /* Send button when user has typed something */
            <button
              onClick={handleSubmit}
              disabled={disabled || isListening}
              className={cn(
                'p-2 rounded-full transition-all',
                'bg-nodiac-primary text-white',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : isListening ? (
            /* Stop button when recording */
            <button
              onClick={handleMicClick}
              className="p-2 rounded-full bg-red-500 text-white"
              title="Stop recording"
            >
              <MicOff className="w-5 h-5" />
            </button>
          ) : isVoiceSupported ? (
            /* Mic button when empty and voice supported */
            <button
              onClick={handleMicClick}
              disabled={disabled}
              className={cn(
                'p-2 rounded-full transition-all',
                'bg-nodiac-primary/10 text-nodiac-primary hover:bg-nodiac-primary/20',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title="Start voice input"
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            /* Disabled send button when empty and no voice */
            <button
              disabled
              className="p-2 rounded-full text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isListening && (
        <div className="mt-2 text-center text-sm text-red-500 dark:text-red-400">
          Recording... click mic when done
        </div>
      )}

      {isVoiceSupported && !isListening && (
        <div className="hidden sm:block mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
          Click mic to speak | Hover over responses to read them aloud{autoReadEnabled ? ' | Auto-read is ON' : ''}
        </div>
      )}
    </div>
  )
}
