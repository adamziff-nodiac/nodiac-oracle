import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useContextPrompts } from './useContextPrompts'
import { mockSupabaseClient } from '@/test/setup'

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

describe('useContextPrompts', () => {
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

    it('should return empty prompts for guests', () => {
      const { result } = renderHook(() => useContextPrompts())

      expect(result.current.globalPrompts).toEqual([])
      expect(result.current.personalPrompts).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('should not fetch prompts for guests', () => {
      renderHook(() => useContextPrompts())

      expect(mockSupabaseClient.from).not.toHaveBeenCalled()
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

    it('should fetch global and personal prompts', async () => {
      const mockGlobalPrompts = [
        { id: 'g1', name: 'Team', content: 'Team info', is_global: true, is_enabled: true, position: 0 },
        { id: 'g2', name: 'Thesis', content: 'Our thesis', is_global: true, is_enabled: true, position: 1 },
      ]
      const mockPersonalPrompts = [
        { id: 'p1', name: 'My Prompt', content: 'Personal content', is_global: false, user_id: mockUser.id, is_enabled: true, position: 0 },
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'context_prompts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((field: string, value: unknown) => {
                if (field === 'is_global' && value === true) {
                  return {
                    order: vi.fn().mockResolvedValue({ data: mockGlobalPrompts, error: null }),
                  }
                }
                if (field === 'user_id') {
                  return {
                    order: vi.fn().mockResolvedValue({ data: mockPersonalPrompts, error: null }),
                  }
                }
                return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
              }),
            }),
            channel: vi.fn().mockReturnValue({
              on: vi.fn().mockReturnThis(),
              subscribe: vi.fn().mockReturnThis(),
            }),
          }
        }
        return mockSupabaseClient.from(table)
      })

      const { result } = renderHook(() => useContextPrompts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.globalPrompts).toHaveLength(2)
      expect(result.current.personalPrompts).toHaveLength(1)
    })

    it('should update a prompt', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        update: mockUpdate,
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      const { result } = renderHook(() => useContextPrompts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.updatePrompt('prompt-id', { content: 'Updated content' })
      })

      expect(mockUpdate).toHaveBeenCalledWith({ content: 'Updated content', updated_at: expect.any(String) })
    })

    it('should toggle prompt enabled state', async () => {
      const mockPrompt = { id: 'p1', name: 'Test', content: 'Content', is_global: false, user_id: mockUser.id, is_enabled: true, position: 0 }
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockPrompt], error: null }),
          }),
        }),
        update: mockUpdate,
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      const { result } = renderHook(() => useContextPrompts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.togglePrompt('p1', false)
      })

      expect(mockUpdate).toHaveBeenCalledWith({ is_enabled: false, updated_at: expect.any(String) })
    })

    it('should add a personal prompt', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-id', name: 'New Prompt', content: 'Content', is_global: false, user_id: mockUser.id },
            error: null,
          }),
        }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        insert: mockInsert,
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      const { result } = renderHook(() => useContextPrompts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addPersonalPrompt('New Prompt', 'Content')
      })

      expect(mockInsert).toHaveBeenCalledWith({
        name: 'New Prompt',
        content: 'Content',
        is_global: false,
        user_id: mockUser.id,
        is_enabled: true,
        position: 0,
      })
    })

    it('should delete a personal prompt', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
        delete: mockDelete,
        channel: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        }),
      })

      const { result } = renderHook(() => useContextPrompts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deletePrompt('prompt-id')
      })

      expect(mockDelete).toHaveBeenCalled()
    })

    it('should return enabled prompts content for system prompt', async () => {
      const mockGlobalPrompts = [
        { id: 'g1', name: 'Team', content: 'Team info here', is_global: true, is_enabled: true, position: 0 },
        { id: 'g2', name: 'Thesis', content: 'Thesis info', is_global: true, is_enabled: false, position: 1 },
      ]
      const mockPersonalPrompts = [
        { id: 'p1', name: 'My Notes', content: 'Personal notes', is_global: false, user_id: mockUser.id, is_enabled: true, position: 0 },
      ]

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'context_prompts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((field: string, value: unknown) => {
                if (field === 'is_global' && value === true) {
                  return {
                    order: vi.fn().mockResolvedValue({ data: mockGlobalPrompts, error: null }),
                  }
                }
                if (field === 'user_id') {
                  return {
                    order: vi.fn().mockResolvedValue({ data: mockPersonalPrompts, error: null }),
                  }
                }
                return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
              }),
            }),
            channel: vi.fn().mockReturnValue({
              on: vi.fn().mockReturnThis(),
              subscribe: vi.fn().mockReturnThis(),
            }),
          }
        }
        return mockSupabaseClient.from(table)
      })

      const { result } = renderHook(() => useContextPrompts())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Only enabled prompts should be included
      const context = result.current.getEnabledContext()
      expect(context).toContain('Team info here')
      expect(context).toContain('Personal notes')
      expect(context).not.toContain('Thesis info') // This one is disabled
    })
  })
})
