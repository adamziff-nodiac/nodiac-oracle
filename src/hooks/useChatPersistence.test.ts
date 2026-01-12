import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChatPersistence } from './useChatPersistence'
import { mockSupabaseClient } from '@/test/setup'

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

describe('useChatPersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('guest mode', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isGuest: true,
        isLoading: false,
      })
    })

    it('should start with empty messages', () => {
      const { result } = renderHook(() =>
        useChatPersistence({ modelId: 'test-model', perspectives: ['p1'] })
      )

      expect(result.current.messages).toEqual([])
      expect(result.current.chatId).toBeNull()
    })

    it('should add messages locally without saving to DB', async () => {
      const { result } = renderHook(() =>
        useChatPersistence({ modelId: 'test-model', perspectives: ['p1'] })
      )

      await act(async () => {
        await result.current.addMessage({
          role: 'user',
          content: 'Hello',
        })
      })

      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].content).toBe('Hello')
      expect(result.current.messages[0].role).toBe('user')

      // Should not call Supabase in guest mode
      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
    })

    it('should clear messages on newChat', async () => {
      const { result } = renderHook(() =>
        useChatPersistence({ modelId: 'test-model', perspectives: ['p1'] })
      )

      await act(async () => {
        await result.current.addMessage({ role: 'user', content: 'Hello' })
      })

      expect(result.current.messages).toHaveLength(1)

      act(() => {
        result.current.newChat()
      })

      expect(result.current.messages).toEqual([])
    })
  })

  describe('authenticated mode', () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isGuest: false,
        isLoading: false,
      })
    })

    it('should create a chat on first user message', async () => {
      const mockChatId = 'new-chat-id'

      // Mock the insert chain
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockChatId },
            error: null,
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() =>
        useChatPersistence({ modelId: 'test-model', perspectives: ['p1'] })
      )

      await act(async () => {
        await result.current.addMessage({
          role: 'user',
          content: 'Hello',
        })
      })

      expect(result.current.messages).toHaveLength(1)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chats')
    })

    it('should save messages to existing chat', async () => {
      const mockChatId = 'existing-chat-id'

      // Mock creating the chat first
      const mockInsertChats = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: mockChatId },
            error: null,
          }),
        }),
      })

      const mockInsertMessages = vi.fn().mockResolvedValue({ error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chats') {
          return { insert: mockInsertChats }
        }
        if (table === 'messages') {
          return { insert: mockInsertMessages }
        }
        return { select: vi.fn().mockReturnThis() }
      })

      const { result } = renderHook(() =>
        useChatPersistence({ modelId: 'test-model', perspectives: ['p1'] })
      )

      // Add user message (creates chat)
      await act(async () => {
        await result.current.addMessage({
          role: 'user',
          content: 'Hello',
        })
      })

      // Add assistant message (uses existing chat)
      await act(async () => {
        await result.current.addMessage({
          role: 'assistant',
          content: 'Hi there!',
          perspective: 'p1',
        })
      })

      expect(result.current.messages).toHaveLength(2)
    })

    it('should load chat from database', async () => {
      const mockMessages = [
        { id: 'm1', role: 'user', content: 'Hello', perspective: null, created_at: new Date().toISOString() },
        { id: 'm2', role: 'assistant', content: 'Hi!', perspective: 'p1', created_at: new Date().toISOString() },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockMessages,
              error: null,
            }),
          }),
        }),
      })

      const { result } = renderHook(() =>
        useChatPersistence({ modelId: 'test-model', perspectives: ['p1'] })
      )

      await act(async () => {
        await result.current.loadChat('test-chat-id')
      })

      expect(result.current.messages).toHaveLength(2)
      expect(result.current.chatId).toBe('test-chat-id')
    })
  })
})
