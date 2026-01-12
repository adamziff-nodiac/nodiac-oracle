import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { mockSupabaseClient } from '@/test/setup'

// Test component to access auth context
function TestComponent() {
  const { user, isLoading, isGuest } = useAuth()
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="guest">{isGuest ? 'guest' : 'authenticated'}</span>
      <span data-testid="user">{user?.email || 'no-user'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide guest state when no session exists', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    expect(screen.getByTestId('guest')).toHaveTextContent('guest')
    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
  })

  it('should provide user state when session exists', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { full_name: 'Test User' },
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    // Mock the auth state change to also return the user
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      // Simulate the auth state change callback
      setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0)
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    await waitFor(() => {
      expect(screen.getByTestId('guest')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
  })

  it('should show loading state initially', () => {
    // Make getSession hang
    mockSupabaseClient.auth.getSession.mockReturnValue(new Promise(() => {}))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toHaveTextContent('loading')
  })

  it('should cleanup subscription on unmount', async () => {
    const unsubscribeMock = vi.fn()
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    })

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(unsubscribeMock).toHaveBeenCalled()
  })
})
