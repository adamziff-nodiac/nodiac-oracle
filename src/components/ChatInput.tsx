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

  useEffect(() => {
    if (transcript && isVoiceMode) {
      setInput(transcript)
    }
  }, [transcript, isVoiceMode])

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
      if (input.trim()) {
        handleSubmit()
      }
    } else {
      onStartListening()
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2">
        {isVoiceSupported && (
          <button
            data-testid="voice-mode-toggle"
            onClick={onVoiceModeToggle}
            disabled={disabled}
            className={cn(
              'flex-shrink-0 p-2.5 rounded-full transition-colors',
              isVoiceMode
                ? 'bg-nodiac-primary text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title={isVoiceMode ? 'Disable voice mode' : 'Enable voice mode'}
          >
            {isVoiceMode ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={isListening ? 'Listening...' : 'Type your message...'}
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border border-gray-300 px-4 py-3 pr-12',
              'text-sm text-gray-900 placeholder-gray-400',
              'focus:border-nodiac-primary focus:ring-1 focus:ring-nodiac-primary',
              'disabled:bg-gray-100 disabled:cursor-not-allowed',
              isListening && 'border-red-400 bg-red-50'
            )}
          />
        </div>

        {isVoiceMode && isVoiceSupported ? (
          <div className="flex gap-2">
            {isSpeaking && (
              <button
                data-testid="stop-speaking"
                onClick={onStopSpeaking}
                className="flex-shrink-0 p-2.5 rounded-full bg-orange-500 text-white hover:bg-orange-600"
                title="Stop speaking"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            )}
            <button
              data-testid="mic-button"
              onClick={handleMicClick}
              disabled={disabled || isSpeaking}
              className={cn(
                'flex-shrink-0 p-2.5 rounded-full transition-colors',
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-nodiac-primary text-white hover:bg-nodiac-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <button
            data-testid="send-button"
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className={cn(
              'flex-shrink-0 p-2.5 rounded-full',
              'bg-nodiac-primary text-white hover:bg-nodiac-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>

      {isVoiceMode && isListening && (
        <div className="mt-2 text-center text-sm text-red-500 animate-pulse">
          Listening... Speak now
        </div>
      )}
    </div>
  )
}
