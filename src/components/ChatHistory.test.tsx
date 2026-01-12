import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatHistory } from './ChatHistory'
import { AuthProvider } from '@/contexts/AuthContext'
import { mockSupabaseClient } from '@/test/setup'

// Wrapper with AuthProvider
function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('ChatHistory', () => {
  const defaultProps = {
    currentChatId: null,
    onSelectChat: vi.fn(),
    onNewChat: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('guest mode', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })
    })

    it('should show sign in prompt for guests', async () => {
      renderWithAuth(<ChatHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/sign in to save/i)).toBeInTheDocument()
      })
    })
  })

  describe('authenticated mode', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    beforeEach(() => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      })

      mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })
    })

    it('should show empty state when no chats exist', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      renderWithAuth(<ChatHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/no chats yet/i)).toBeInTheDocument()
      })
    })

    it('should display chat list when chats exist', async () => {
      const mockChats = [
        { id: 'chat-1', title: 'First Chat', updated_at: new Date().toISOString(), model_id: 'gpt-4' },
        { id: 'chat-2', title: 'Second Chat', updated_at: new Date().toISOString(), model_id: 'claude' },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockChats, error: null }),
              }),
            }),
          }),
        }),
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      renderWithAuth(<ChatHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('First Chat')).toBeInTheDocument()
        expect(screen.getByText('Second Chat')).toBeInTheDocument()
      })
    })

    it('should call onSelectChat when a chat is clicked', async () => {
      const mockChats = [
        { id: 'chat-1', title: 'Test Chat', updated_at: new Date().toISOString(), model_id: 'gpt-4' },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockChats, error: null }),
              }),
            }),
          }),
        }),
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      const onSelectChat = vi.fn()
      renderWithAuth(<ChatHistory {...defaultProps} onSelectChat={onSelectChat} />)

      await waitFor(() => {
        expect(screen.getByText('Test Chat')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test Chat'))

      expect(onSelectChat).toHaveBeenCalledWith('chat-1')
    })

    it('should call onNewChat when new chat button is clicked', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      const onNewChat = vi.fn()
      renderWithAuth(<ChatHistory {...defaultProps} onNewChat={onNewChat} />)

      await waitFor(() => {
        expect(screen.getByTitle('New chat')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTitle('New chat'))

      expect(onNewChat).toHaveBeenCalled()
    })

    it('should highlight current chat', async () => {
      const mockChats = [
        { id: 'chat-1', title: 'Test Chat', updated_at: new Date().toISOString(), model_id: 'gpt-4' },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: mockChats, error: null }),
              }),
            }),
          }),
        }),
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      renderWithAuth(<ChatHistory {...defaultProps} currentChatId="chat-1" />)

      await waitFor(() => {
        // Find the clickable chat item div (parent of the text)
        const textElement = screen.getByText('Test Chat')
        // Navigate up to the clickable row div
        const chatRow = textElement.closest('.cursor-pointer')
        expect(chatRow).toHaveClass('bg-gray-100')
      })
    })

    it('should toggle collapse state', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      renderWithAuth(<ChatHistory {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Chat History')).toBeInTheDocument()
      })

      // Initially expanded, should show "No chats yet"
      await waitFor(() => {
        expect(screen.getByText(/no chats yet/i)).toBeInTheDocument()
      })

      // Click to collapse - need to find the button, not just text
      const collapseButton = screen.getByText('Chat History').closest('button')
      fireEvent.click(collapseButton!)

      // Should hide content after collapse
      await waitFor(() => {
        expect(screen.queryByText(/no chats yet/i)).not.toBeInTheDocument()
      })
    })
  })
})
