import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatMessage } from './ChatMessage'
import { Message } from '@/types'

describe('ChatMessage', () => {
  const userMessage: Message = {
    id: 'msg-1',
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-15T10:30:00'),
  }

  const assistantMessage: Message = {
    id: 'msg-2',
    role: 'assistant',
    content: 'I am doing well, thank you!',
    perspective: 'hyperscaler',
    timestamp: new Date('2024-01-15T10:31:00'),
  }

  it('should render user message', () => {
    render(<ChatMessage message={userMessage} />)
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
  })

  it('should render assistant message', () => {
    render(<ChatMessage message={assistantMessage} />)
    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument()
  })

  it('should display timestamp', () => {
    render(<ChatMessage message={userMessage} />)
    expect(screen.getByText(/10:30/i)).toBeInTheDocument()
  })

  it('should show perspective for assistant messages', () => {
    render(<ChatMessage message={assistantMessage} />)
    expect(screen.getByText('Hyperscaler Data Center Executive')).toBeInTheDocument()
  })

  it('should not show perspective for user messages', () => {
    render(<ChatMessage message={userMessage} />)
    expect(screen.queryByText(/Executive/)).not.toBeInTheDocument()
  })

  it('should have different styling for user vs assistant', () => {
    const { rerender } = render(<ChatMessage message={userMessage} />)
    const userContainer = screen.getByTestId('message-msg-1')
    expect(userContainer).toHaveClass('justify-end')

    rerender(<ChatMessage message={assistantMessage} />)
    const assistantContainer = screen.getByTestId('message-msg-2')
    expect(assistantContainer).toHaveClass('justify-start')
  })

  it('should preserve whitespace in message content', () => {
    const multilineMessage: Message = {
      ...userMessage,
      content: 'Line 1\nLine 2\nLine 3',
    }
    render(<ChatMessage message={multilineMessage} />)
    const content = screen.getByText(/Line 1/)
    expect(content).toHaveClass('whitespace-pre-wrap')
  })
})
