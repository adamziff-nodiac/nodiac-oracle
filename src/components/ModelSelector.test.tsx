import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModelSelector } from './ModelSelector'
import { AI_MODELS } from '@/types'

describe('ModelSelector', () => {
  const defaultProps = {
    selectedModel: AI_MODELS[0],
    onModelChange: vi.fn(),
  }

  it('should render the model selector', () => {
    render(<ModelSelector {...defaultProps} />)
    expect(screen.getByTestId('model-selector')).toBeInTheDocument()
  })

  it('should display the label', () => {
    render(<ModelSelector {...defaultProps} />)
    expect(screen.getByText('AI Model')).toBeInTheDocument()
  })

  it('should show all models in the dropdown', () => {
    render(<ModelSelector {...defaultProps} />)
    const select = screen.getByTestId('model-selector')
    AI_MODELS.forEach(model => {
      expect(select).toContainHTML(model.name)
    })
  })

  it('should group models by provider', () => {
    render(<ModelSelector {...defaultProps} />)
    expect(screen.getByRole('group', { name: 'Anthropic' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'OpenAI' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Google' })).toBeInTheDocument()
  })

  it('should call onModelChange when a model is selected', () => {
    const onModelChange = vi.fn()
    render(<ModelSelector {...defaultProps} onModelChange={onModelChange} />)

    const select = screen.getByTestId('model-selector')
    fireEvent.change(select, { target: { value: AI_MODELS[2].id } })

    expect(onModelChange).toHaveBeenCalledWith(AI_MODELS[2])
  })

  it('should show the selected model', () => {
    render(<ModelSelector {...defaultProps} selectedModel={AI_MODELS[2]} />)
    const select = screen.getByTestId('model-selector') as HTMLSelectElement
    expect(select.value).toBe(AI_MODELS[2].id)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<ModelSelector {...defaultProps} disabled />)
    const select = screen.getByTestId('model-selector')
    expect(select).toBeDisabled()
  })
})
