import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Speech API with proper constructor
class MockSpeechRecognition {
  continuous = false
  interimResults = false
  lang = 'en-US'
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onend: (() => void) | null = null
  onstart: (() => void) | null = null

  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

class MockSpeechSynthesisUtterance {
  text: string
  lang = 'en-US'
  voice = null
  volume = 1
  rate = 1
  pitch = 1
  onend: (() => void) | null = null
  onerror: ((event: unknown) => void) | null = null

  constructor(text: string = '') {
    this.text = text
  }
}

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn().mockReturnValue([]),
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null,
}

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: MockSpeechRecognition,
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: MockSpeechRecognition,
})

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
})

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: MockSpeechSynthesisUtterance,
})

// Mock fetch for API tests
global.fetch = vi.fn()

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock MediaDevices for voice recording
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    }),
  },
})
