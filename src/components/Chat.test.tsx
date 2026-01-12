import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Chat } from './Chat'

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockReset()
  })

  it('should render the chat interface', () => {
    render(<Chat />)

    expect(screen.getByText('Nodiac Oracle')).toBeInTheDocument()
    expect(screen.getByText('Multi-perspective AI advisor')).toBeInTheDocument()
  })

  it('should show welcome message when no messages', () => {
    render(<Chat />)

    expect(screen.getByText('Welcome to Nodiac Oracle')).toBeInTheDocument()
    expect(screen.getByText(/Get insights from different industry perspectives/)).toBeInTheDocument()
  })

  it('should render model selector', () => {
    render(<Chat />)

    expect(screen.getByTestId('model-selector')).toBeInTheDocument()
  })

  it('should render all perspective buttons', () => {
    render(<Chat />)

    expect(screen.getByTestId('perspective-hyperscaler')).toBeInTheDocument()
    expect(screen.getByTestId('perspective-techvc')).toBeInTheDocument()
    expect(screen.getByTestId('perspective-utility')).toBeInTheDocument()
    expect(screen.getByTestId('perspective-renewables')).toBeInTheDocument()
  })

  it('should render chat input', () => {
    render(<Chat />)

    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('should render clear chat button', () => {
    render(<Chat />)

    expect(screen.getByTestId('clear-chat')).toBeInTheDocument()
  })

  it('should disable clear chat when no messages', () => {
    render(<Chat />)

    expect(screen.getByTestId('clear-chat')).toBeDisabled()
  })

  it('should send message and show in chat', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ content: 'AI response' }),
    } as Response)

    render(<Chat />)

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

    render(<Chat />)

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

    render(<Chat />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByTestId('send-button'))

    await waitFor(() => {
      expect(screen.getByText(/Error: API Error/)).toBeInTheDocument()
    })
  })

  it('should clear chat when clear button is clicked', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({ content: 'Response' }),
    } as Response)

    render(<Chat />)

    // Send a message first
    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByTestId('send-button'))

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    // Clear the chat
    fireEvent.click(screen.getByTestId('clear-chat'))

    expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    expect(screen.getByText('Welcome to Nodiac Oracle')).toBeInTheDocument()
  })

  it('should change perspective when clicked', () => {
    render(<Chat />)

    fireEvent.click(screen.getByTestId('perspective-techvc'))

    const button = screen.getByTestId('perspective-techvc')
    expect(button).toHaveClass('border-nodiac-primary')
  })

  it('should disable inputs while loading', async () => {
    vi.mocked(global.fetch).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        json: async () => ({ content: 'Response' }),
      } as Response), 200))
    )

    render(<Chat />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByTestId('send-button'))

    await waitFor(() => {
      expect(screen.getByTestId('chat-input')).toBeDisabled()
      expect(screen.getByTestId('model-selector')).toBeDisabled()
    })
  })
})
