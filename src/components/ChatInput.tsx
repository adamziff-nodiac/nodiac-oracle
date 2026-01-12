'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatInputProps = {
  onSubmit: (message: string) => void
  disabled?: boolean
  isVoiceMode: boolean
  onVoiceModeToggle: () => void
  isListening: boolean
  isSpeaking: boolean
  onStartListening: () => void
  onStopListening: () => void
  onStopSpeaking: () => void
  transcript: string
  isVoiceSupported: boolean
}

export function ChatInput({
  onSubmit,
  disabled,
  isVoiceMode,
  onVoiceModeToggle,
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  transcript,
  isVoiceSupported,
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastTranscriptRef = useRef('')

  // Update input with transcript while listening
  useEffect(() => {
    if (transcript && isListening) {
      setInput(transcript)
      lastTranscriptRef.current = transcript
    }
  }, [transcript, isListening])

  // Auto-submit when listening stops and we have content
  useEffect(() => {
    if (!isListening && lastTranscriptRef.current) {
      const trimmed = lastTranscriptRef.current.trim()
      if (trimmed && !disabled) {
        onSubmit(trimmed)
        setInput('')
      }
      lastTranscriptRef.current = ''
    }
  }, [isListening, disabled, onSubmit])

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
      setInput('')
      lastTranscriptRef.current = ''
      onStartListening()
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex items-end gap-2">
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
              'w-full resize-none rounded-2xl border border-gray-300 dark:border-gray-600 px-4 py-3 pr-12',
              'text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
              'bg-white dark:bg-gray-700',
              'focus:border-nodiac-primary focus:ring-1 focus:ring-nodiac-primary',
              'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
              isListening && 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
            )}
          />
        </div>

        {/* Mic button - always visible if supported */}
        {isVoiceSupported && (
          <button
            data-testid="mic-button"
            onClick={handleMicClick}
            disabled={disabled || isSpeaking}
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

        {/* TTS toggle - for reading responses aloud */}
        {isVoiceSupported && (
          <button
            data-testid="voice-mode-toggle"
            onClick={isSpeaking ? onStopSpeaking : onVoiceModeToggle}
            disabled={disabled}
            className={cn(
              'flex-shrink-0 p-2.5 rounded-full transition-colors',
              isSpeaking
                ? 'bg-orange-500 text-white animate-pulse'
                : isVoiceMode
                  ? 'bg-nodiac-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title={isSpeaking ? 'Stop speaking' : isVoiceMode ? 'Disable read aloud' : 'Enable read aloud'}
          >
            {isVoiceMode || isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
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

      {isListening && (
        <div className="mt-2 text-center text-sm text-red-500 dark:text-red-400">
          Recording... click mic or stop talking to send
        </div>
      )}

      {isVoiceSupported && !isListening && (
        <div className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
          Click mic to speak {isVoiceMode ? '| Responses will be read aloud' : '| Click speaker to enable read aloud'}
        </div>
      )}
    </div>
  )
}
