import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PerspectiveSelector } from './PerspectiveSelector'
import { PERSPECTIVES } from '@/types'

describe('PerspectiveSelector', () => {
  const defaultProps = {
    selectedPerspectives: [PERSPECTIVES[0]],
    onPerspectiveToggle: vi.fn(),
  }

  it('should render all four perspectives', () => {
    render(<PerspectiveSelector {...defaultProps} />)

    PERSPECTIVES.forEach(perspective => {
      expect(screen.getByTestId(`perspective-${perspective.id}`)).toBeInTheDocument()
    })
  })

  it('should display the label with multi-select hint', () => {
    render(<PerspectiveSelector {...defaultProps} />)
    expect(screen.getByText('Perspectives')).toBeInTheDocument()
    expect(screen.getByText('(select one or more)')).toBeInTheDocument()
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

  it('should call onPerspectiveToggle when a perspective is clicked', () => {
    const onPerspectiveToggle = vi.fn()
    render(<PerspectiveSelector {...defaultProps} onPerspectiveToggle={onPerspectiveToggle} />)

    fireEvent.click(screen.getByTestId('perspective-techvc'))

    expect(onPerspectiveToggle).toHaveBeenCalledWith(PERSPECTIVES[1])
  })

  it('should highlight selected perspectives', () => {
    render(<PerspectiveSelector {...defaultProps} selectedPerspectives={[PERSPECTIVES[0], PERSPECTIVES[1]]} />)

    const hyperscalerButton = screen.getByTestId('perspective-hyperscaler')
    const techvcButton = screen.getByTestId('perspective-techvc')
    const utilityButton = screen.getByTestId('perspective-utility')

    expect(hyperscalerButton).toHaveClass('border-nodiac-primary')
    expect(techvcButton).toHaveClass('border-nodiac-primary')
    expect(utilityButton).not.toHaveClass('border-nodiac-primary')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<PerspectiveSelector {...defaultProps} disabled />)

    PERSPECTIVES.forEach(perspective => {
      const button = screen.getByTestId(`perspective-${perspective.id}`)
      expect(button).toBeDisabled()
    })
  })

  it('should show checkmark for selected perspectives', () => {
    render(<PerspectiveSelector {...defaultProps} selectedPerspectives={[PERSPECTIVES[0]]} />)

    // The checkbox for the selected perspective should have the check mark styling
    const hyperscalerButton = screen.getByTestId('perspective-hyperscaler')
    expect(hyperscalerButton.querySelector('.bg-nodiac-primary')).toBeInTheDocument()
  })
})
