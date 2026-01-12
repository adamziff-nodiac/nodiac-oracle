import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NodiacContext } from './NodiacContext'

// Mock the useContextPrompts hook
vi.mock('@/hooks/useContextPrompts', () => ({
  useContextPrompts: vi.fn(),
}))

// Mock the useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useContextPrompts } from '@/hooks/useContextPrompts'
import { useAuth } from '@/contexts/AuthContext'

const mockUseContextPrompts = useContextPrompts as ReturnType<typeof vi.fn>
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

describe('NodiacContext', () => {
  const mockUpdatePrompt = vi.fn()
  const mockTogglePrompt = vi.fn()
  const mockAddPersonalPrompt = vi.fn()
  const mockDeletePrompt = vi.fn()

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
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [],
        personalPrompts: [],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })
    })

    it('should not render anything for guests', () => {
      const { container } = render(<NodiacContext />)
      expect(container.firstChild).toBeNull()
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

    it('should render collapsible header', () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [],
        personalPrompts: [],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      expect(screen.getByText('Nodiac Context')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [],
        personalPrompts: [],
        isLoading: true,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should display global prompts', () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [
          { id: 'g1', name: 'Team', content: 'Team info', is_global: true, is_enabled: true, position: 0 },
          { id: 'g2', name: 'Thesis', content: 'Our thesis', is_global: true, is_enabled: false, position: 1 },
        ],
        personalPrompts: [],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      expect(screen.getByText('Team')).toBeInTheDocument()
      expect(screen.getByText('Thesis')).toBeInTheDocument()
    })

    it('should display personal prompts', () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [],
        personalPrompts: [
          { id: 'p1', name: 'My Notes', content: 'Notes', is_global: false, user_id: mockUser.id, is_enabled: true, position: 0 },
        ],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      expect(screen.getByText('My Notes')).toBeInTheDocument()
    })

    it('should toggle prompt when checkbox is clicked', async () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [
          { id: 'g1', name: 'Team', content: 'Team info', is_global: true, is_enabled: true, position: 0 },
        ],
        personalPrompts: [],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      const checkbox = screen.getByRole('checkbox', { name: /toggle team/i })
      fireEvent.click(checkbox)

      await waitFor(() => {
        expect(mockTogglePrompt).toHaveBeenCalledWith('g1', false)
      })
    })

    it('should toggle collapse state', () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [
          { id: 'g1', name: 'Team', content: 'Team info', is_global: true, is_enabled: true, position: 0 },
        ],
        personalPrompts: [],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      // Initially expanded
      expect(screen.getByText('Team')).toBeInTheDocument()

      // Click to collapse
      fireEvent.click(screen.getByText('Nodiac Context'))

      // Content should be hidden
      expect(screen.queryByText('Team')).not.toBeInTheDocument()
    })

    it('should show enabled count in header', () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [
          { id: 'g1', name: 'Team', content: 'Team info', is_global: true, is_enabled: true, position: 0 },
          { id: 'g2', name: 'Thesis', content: 'Our thesis', is_global: true, is_enabled: false, position: 1 },
        ],
        personalPrompts: [
          { id: 'p1', name: 'Notes', content: 'Notes', is_global: false, user_id: mockUser.id, is_enabled: true, position: 0 },
        ],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      // 2 enabled out of 3 total
      expect(screen.getByText('(2 enabled)')).toBeInTheDocument()
    })

    it('should open edit modal when edit button is clicked', async () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [
          { id: 'g1', name: 'Team', content: 'Team info', is_global: true, is_enabled: true, position: 0 },
        ],
        personalPrompts: [],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      const editButton = screen.getByTitle('Edit Team')
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Context')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Team info')).toBeInTheDocument()
      })
    })

    it('should show add button for personal prompts section', () => {
      mockUseContextPrompts.mockReturnValue({
        globalPrompts: [],
        personalPrompts: [],
        isLoading: false,
        updatePrompt: mockUpdatePrompt,
        togglePrompt: mockTogglePrompt,
        addPersonalPrompt: mockAddPersonalPrompt,
        deletePrompt: mockDeletePrompt,
        getEnabledContext: vi.fn().mockReturnValue(''),
      })

      render(<NodiacContext />)

      expect(screen.getByTitle('Add personal context')).toBeInTheDocument()
    })
  })
})
