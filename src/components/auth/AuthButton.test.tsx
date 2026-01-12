import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthButton } from './AuthButton'
import { AuthProvider } from '@/contexts/AuthContext'
import { mockSupabaseClient } from '@/test/setup'

// Wrapper with AuthProvider
function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>)
}

describe('AuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location if window exists
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true,
        configurable: true,
      })
    }
  })

  it('should show sign in button when user is not authenticated', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    renderWithAuth(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    })
  })

  it('should show user info and sign out button when authenticated', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User', avatar_url: 'https://example.com/avatar.png' },
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    renderWithAuth(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getByAltText('Test User')).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('should call signInWithOAuth when sign in button is clicked', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    // Reset onAuthStateChange to not fire SIGNED_IN
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    renderWithAuth(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }))

    await waitFor(() => {
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
        },
      })
    })
  })

  it('should call signOut when sign out button is clicked', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    renderWithAuth(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled()
    })
  })

  it('should show loading state while auth is loading', () => {
    mockSupabaseClient.auth.getSession.mockReturnValue(new Promise(() => {}))

    renderWithAuth(<AuthButton />)

    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should show email initial when no avatar_url is provided', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    renderWithAuth(<AuthButton />)

    await waitFor(() => {
      expect(screen.getByText('T')).toBeInTheDocument() // First letter of email
    })
  })
})
