import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'

// Setup matchMedia mock before any tests run
const mockMatchMedia = (prefersDark: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark && query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear any existing classes
    document.documentElement.className = ''
    // Default to light system preference
    mockMatchMedia(false)
    // Reset localStorage mock
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
  })

  afterEach(() => {
    document.documentElement.className = ''
    vi.restoreAllMocks()
  })

  it('should render theme toggle button', () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /toggle theme|switch to/i })).toBeInTheDocument()
  })

  it('should add dark class to html element when toggled to dark mode', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('light')

    render(<ThemeToggle />)

    // Wait for mount
    await vi.waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    // Should start in light mode (no dark class)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // Click to toggle to dark
    fireEvent.click(screen.getByRole('button'))

    // Should now have dark class
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should remove dark class from html element when toggled to light mode', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('dark')

    render(<ThemeToggle />)

    // Wait for mount and dark mode to be applied
    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    // Click to toggle to light
    fireEvent.click(screen.getByRole('button'))

    // Should no longer have dark class
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should persist theme choice to localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(<ThemeToggle />)

    await vi.waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    // Click to toggle
    fireEvent.click(screen.getByRole('button'))

    expect(setItemSpy).toHaveBeenCalledWith('theme', expect.any(String))
  })

  it('should respect system preference when no stored theme', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    // Mock system preference for dark mode
    mockMatchMedia(true)

    render(<ThemeToggle />)

    // Should apply dark mode from system preference
    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('should use stored theme over system preference', async () => {
    // System prefers dark
    mockMatchMedia(true)
    // But localStorage says light
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('light')

    render(<ThemeToggle />)

    // Should use stored preference (light) over system (dark)
    await vi.waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })
})
