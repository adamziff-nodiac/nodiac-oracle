import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PerspectiveSelector } from './PerspectiveSelector'
import { PERSPECTIVES } from '@/types'

describe('PerspectiveSelector', () => {
  const defaultProps = {
    selectedPerspective: PERSPECTIVES[0],
    onPerspectiveChange: vi.fn(),
  }

  it('should render all four perspectives', () => {
    render(<PerspectiveSelector {...defaultProps} />)

    PERSPECTIVES.forEach(perspective => {
      expect(screen.getByTestId(`perspective-${perspective.id}`)).toBeInTheDocument()
    })
  })

  it('should display the label', () => {
    render(<PerspectiveSelector {...defaultProps} />)
    expect(screen.getByText('Perspective')).toBeInTheDocument()
  })

  it('should show perspective names', () => {
    render(<PerspectiveSelector {...defaultProps} />)

    PERSPECTIVES.forEach(perspective => {
      expect(screen.getByText(perspective.name)).toBeInTheDocument()
    })
  })

  it('should show perspective descriptions', () => {
    render(<PerspectiveSelector {...defaultProps} />)

    PERSPECTIVES.forEach(perspective => {
      expect(screen.getByText(perspective.description)).toBeInTheDocument()
    })
  })

  it('should call onPerspectiveChange when a perspective is clicked', () => {
    const onPerspectiveChange = vi.fn()
    render(<PerspectiveSelector {...defaultProps} onPerspectiveChange={onPerspectiveChange} />)

    fireEvent.click(screen.getByTestId('perspective-techvc'))

    expect(onPerspectiveChange).toHaveBeenCalledWith(PERSPECTIVES[1])
  })

  it('should highlight the selected perspective', () => {
    render(<PerspectiveSelector {...defaultProps} selectedPerspective={PERSPECTIVES[1]} />)

    const selectedButton = screen.getByTestId('perspective-techvc')
    expect(selectedButton).toHaveClass('border-nodiac-primary')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<PerspectiveSelector {...defaultProps} disabled />)

    PERSPECTIVES.forEach(perspective => {
      const button = screen.getByTestId(`perspective-${perspective.id}`)
      expect(button).toBeDisabled()
    })
  })
})
