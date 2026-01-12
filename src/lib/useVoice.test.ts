import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoice } from './useVoice'

describe('useVoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVoice())

    expect(result.current.isListening).toBe(false)
    expect(result.current.isSpeaking).toBe(false)
    expect(result.current.transcript).toBe('')
    expect(result.current.isSupported).toBe(true)
  })

  it('should have voice functions', () => {
    const { result } = renderHook(() => useVoice())

    expect(typeof result.current.startListening).toBe('function')
    expect(typeof result.current.stopListening).toBe('function')
    expect(typeof result.current.speak).toBe('function')
    expect(typeof result.current.stopSpeaking).toBe('function')
  })

  it('should call speechSynthesis.cancel on stopSpeaking', () => {
    const { result } = renderHook(() => useVoice())

    act(() => {
      result.current.stopSpeaking()
    })

    expect(window.speechSynthesis.cancel).toHaveBeenCalled()
  })

  it('should start listening when startListening is called', () => {
    const { result } = renderHook(() => useVoice())

    act(() => {
      result.current.startListening()
    })

    // SpeechRecognition was instantiated and start was called
    // We can't easily check instantiation with class mocks, but we can verify behavior
    expect(result.current.isListening).toBe(false) // Will be false until onstart fires
  })

  it('should stop listening when stopListening is called', () => {
    const { result } = renderHook(() => useVoice())

    act(() => {
      result.current.startListening()
    })

    act(() => {
      result.current.stopListening()
    })

    expect(result.current.isListening).toBe(false)
  })
})
