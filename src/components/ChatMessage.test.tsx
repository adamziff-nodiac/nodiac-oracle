import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChatMessage } from './ChatMessage'
import { Message } from '@/types'
import { PerspectivesProvider } from '@/contexts/PerspectivesContext'
import { AuthProvider } from '@/contexts/AuthContext'

// Wrapper component that provides required context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PerspectivesProvider>{children}</PerspectivesProvider>
    </AuthProvider>
  )
}

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
    render(<ChatMessage message={userMessage} />, { wrapper: TestWrapper })
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
  })

  it('should render assistant message', () => {
    render(<ChatMessage message={assistantMessage} />, { wrapper: TestWrapper })
    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument()
  })

  it('should display timestamp', () => {
    render(<ChatMessage message={userMessage} />, { wrapper: TestWrapper })
    expect(screen.getByText(/10:30/i)).toBeInTheDocument()
  })

  it('should show perspective for assistant messages', () => {
    render(<ChatMessage message={assistantMessage} />, { wrapper: TestWrapper })
    expect(screen.getByText('Hyperscaler Data Center Executive')).toBeInTheDocument()
  })

  it('should not show perspective for user messages', () => {
    render(<ChatMessage message={userMessage} />, { wrapper: TestWrapper })
    expect(screen.queryByText(/Executive/)).not.toBeInTheDocument()
  })

  it('should have different styling for user vs assistant', () => {
    const { rerender } = render(<ChatMessage message={userMessage} />, { wrapper: TestWrapper })
    const userContainer = screen.getByTestId('message-msg-1')
    expect(userContainer).toHaveClass('justify-end')

    rerender(<ChatMessage message={assistantMessage} />)
    const assistantContainer = screen.getByTestId('message-msg-2')
    expect(assistantContainer).toHaveClass('justify-start')
  })

  it('should render markdown content with prose styling', () => {
    const markdownMessage: Message = {
      ...userMessage,
      content: '**Bold text** and *italic text*',
    }
    render(<ChatMessage message={markdownMessage} />, { wrapper: TestWrapper })
    // Check that the content container has prose styling
    const container = screen.getByTestId('message-msg-1')
    expect(container.querySelector('.prose')).toBeInTheDocument()
  })
})
