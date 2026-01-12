import '@testing-library/jest-dom'
import { vi, beforeAll } from 'vitest'

// Mock Supabase client - exported for test access
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  }),
  removeChannel: vi.fn(),
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Only setup window mocks if window is defined (jsdom environment)
if (typeof window !== 'undefined') {
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
}

// Mock fetch for API tests (works in both environments)
global.fetch = vi.fn()
