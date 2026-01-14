'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'

type TTSContextType = {
  // State
  isSpeaking: boolean
  speakingMessageId: string | null
  isSupported: boolean
  autoReadEnabled: boolean

  // Actions
  speakMessage: (messageId: string, text: string) => Promise<void>
  stopSpeaking: () => void
  toggleAutoRead: () => void
}

const TTSContext = createContext<TTSContextType | null>(null)

export function TTSProvider({ children }: { children: ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [autoReadEnabled, setAutoReadEnabled] = useState(false)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && !!window.speechSynthesis)

    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
    setSpeakingMessageId(null)
  }, [])

  const speakMessage = useCallback((messageId: string, text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Stop any current speech
      window.speechSynthesis.cancel()

      // Clean text for better TTS (remove markdown formatting)
      const cleanText = text
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
        .replace(/\*(.*?)\*/g, '$1') // Remove italic
        .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code blocks
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        .replace(/^\s*[-*+]\s/gm, '') // Remove list markers
        .replace(/^\s*\d+\.\s/gm, '') // Remove numbered list markers
        .replace(/\n{2,}/g, '. ') // Convert double newlines to pauses
        .replace(/\n/g, ' ') // Convert single newlines to spaces
        .trim()

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'en-US'
      utterance.rate = 1
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => {
        setIsSpeaking(true)
        setSpeakingMessageId(messageId)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setSpeakingMessageId(null)
        resolve()
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
        setSpeakingMessageId(null)
        // Don't reject on 'interrupted' - that's normal when stopping
        if (event.error !== 'interrupted') {
          reject(new Error('Speech synthesis error'))
        } else {
          resolve()
        }
      }

      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const toggleAutoRead = useCallback(() => {
    setAutoReadEnabled(prev => !prev)
  }, [])

  return (
    <TTSContext.Provider value={{
      isSpeaking,
      speakingMessageId,
      isSupported,
      autoReadEnabled,
      speakMessage,
      stopSpeaking,
      toggleAutoRead,
    }}>
      {children}
    </TTSContext.Provider>
  )
}

export function useTTS() {
  const context = useContext(TTSContext)
  if (!context) {
    throw new Error('useTTS must be used within a TTSProvider')
  }
  return context
}
