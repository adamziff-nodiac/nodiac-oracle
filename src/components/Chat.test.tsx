import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Chat } from './Chat'
import { TTSProvider } from '@/contexts/TTSContext'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock matchMedia for dark mode detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Track scrollIntoView calls
const scrollIntoViewMock = vi.fn()

// Wrapper component for TTS context
const renderWithTTS = (ui: React.ReactElement) => {
  return render(<TTSProvider>{ui}</TTSProvider>)
}

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockReset()
    localStorageMock.getItem.mockReturnValue(null)
    // Reset scroll mock
    scrollIntoViewMock.mockClear()
    Element.prototype.scrollIntoView = scrollIntoViewMock
  })

  it('should render the chat interface', () => {
    renderWithTTS(<Chat />)

    expect(screen.getByText('Nodiac Oracle')).toBeInTheDocument()
    expect(screen.getByText('Multi-perspective AI advisor')).toBeInTheDocument()
  })

  it('should show welcome message when no messages', () => {
    renderWithTTS(<Chat />)

    expect(screen.getByText('Welcome to Nodiac Oracle')).toBeInTheDocument()
    expect(screen.getByText(/Get insights from different industry perspectives/)).toBeInTheDocument()
  })

  it('should render model selector', () => {
    renderWithTTS(<Chat />)

    expect(screen.getByTestId('model-selector')).toBeInTheDocument()
  })

  it('should render all perspective buttons', () => {
    renderWithTTS(<Chat />)

    expect(screen.getByTestId('perspective-hyperscaler')).toBeInTheDocument()
    expect(screen.getByTestId('perspective-techvc')).toBeInTheDocument()
    expect(screen.getByTestId('perspective-utility')).toBeInTheDocument()
    expect(screen.getByTestId('perspective-renewables')).toBeInTheDocument()
  })

  it('should render chat input', () => {
    renderWithTTS(<Chat />)

    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('should render new chat button', () => {
    renderWithTTS(<Chat />)

    expect(screen.getByTestId('new-chat')).toBeInTheDocument()
  })

  it('should send message and show in chat', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ content: 'AI response' }),
    } as Response)

    renderWithTTS(<Chat />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Hello AI' } })
    fireEvent.click(screen.getByTestId('send-button'))

    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('AI response')).toBeInTheDocument()
    })
  })

  it('should show loading indicator while waiting for response', async () => {
    vi.mocked(global.fetch).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        json: async () => ({ content: 'Response' }),
      } as Response), 100))
    )

    renderWithTTS(<Chat />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByTestId('send-button'))

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    // Loading animation should be present
    expect(document.querySelector('.animate-bounce')).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ error: 'API Error' }),
    } as Response)

    renderWithTTS(<Chat />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByTestId('send-button'))

    await waitFor(() => {
      expect(screen.getByText(/Error: API Error/)).toBeInTheDocument()
    })
  })

  it('should start new chat when new chat button is clicked', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ content: 'Response' }),
    } as Response)

    renderWithTTS(<Chat />)

    // Send a message first
    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByTestId('send-button'))

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    // Start new chat
    fireEvent.click(screen.getByTestId('new-chat'))

    expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    expect(screen.getByText('Welcome to Nodiac Oracle')).toBeInTheDocument()
  })

  it('should toggle perspective when clicked', () => {
    renderWithTTS(<Chat />)

    // Initially hyperscaler is selected
    expect(screen.getByTestId('perspective-hyperscaler')).toHaveClass('border-nodiac-primary')

    // Click techvc to add it
    fireEvent.click(screen.getByTestId('perspective-techvc'))

    // Both should now be selected
    expect(screen.getByTestId('perspective-hyperscaler')).toHaveClass('border-nodiac-primary')
    expect(screen.getByTestId('perspective-techvc')).toHaveClass('border-nodiac-primary')
  })

  it('should disable inputs while loading', async () => {
    vi.mocked(global.fetch).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        json: async () => ({ content: 'Response' }),
      } as Response), 200))
    )

    renderWithTTS(<Chat />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByTestId('send-button'))

    await waitFor(() => {
      expect(screen.getByTestId('chat-input')).toBeDisabled()
      expect(screen.getByTestId('model-selector')).toBeDisabled()
    })
  })

  describe('scroll behavior', () => {
    it('should scroll to bottom when user sends a message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        json: async () => ({ content: 'AI response' }),
      } as Response)

      renderWithTTS(<Chat />)

      // Clear any initial scroll calls
      scrollIntoViewMock.mockClear()

      const input = screen.getByTestId('chat-input')
      fireEvent.change(input, { target: { value: 'Hello' } })
      fireEvent.click(screen.getByTestId('send-button'))

      // Should scroll when user sends
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled()
      })
    })

    it('should NOT auto-scroll when receiving AI response', async () => {
      let resolveResponse: (value: Response) => void
      const responsePromise = new Promise<Response>(resolve => {
        resolveResponse = resolve
      })

      vi.mocked(global.fetch).mockReturnValueOnce(responsePromise)

      renderWithTTS(<Chat />)

      const input = screen.getByTestId('chat-input')
      fireEvent.change(input, { target: { value: 'Hello' } })
      fireEvent.click(screen.getByTestId('send-button'))

      // Wait for user message to appear and scroll to be called
      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument()
      })

      // Clear the scroll calls from sending
      scrollIntoViewMock.mockClear()

      // Now resolve the AI response
      resolveResponse!({
        json: async () => ({ content: 'AI response' }),
      } as Response)

      // Wait for AI response to appear
      await waitFor(() => {
        expect(screen.getByText('AI response')).toBeInTheDocument()
      })

      // Scroll should NOT have been called again when receiving
      expect(scrollIntoViewMock).not.toHaveBeenCalled()
    })
  })

  describe('viewport and mobile', () => {
    it('should use dynamic viewport height class', () => {
      renderWithTTS(<Chat />)

      // The main container should use h-dvh for proper mobile viewport
      const container = document.querySelector('.h-dvh')
      expect(container).toBeInTheDocument()
    })
  })
})
