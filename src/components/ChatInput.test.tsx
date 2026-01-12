import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatInput } from './ChatInput'

describe('ChatInput', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isVoiceMode: false,
    onVoiceModeToggle: vi.fn(),
    isListening: false,
    isSpeaking: false,
    onStartListening: vi.fn(),
    onStopListening: vi.fn(),
    onStopSpeaking: vi.fn(),
    transcript: '',
    isVoiceSupported: true,
  }

  it('should render the text input', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('should render the send button when not in voice mode', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('send-button')).toBeInTheDocument()
  })

  it('should render the voice mode toggle', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('voice-mode-toggle')).toBeInTheDocument()
  })

  it('should call onSubmit when send button is clicked', () => {
    const onSubmit = vi.fn()
    render(<ChatInput {...defaultProps} onSubmit={onSubmit} />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(screen.getByTestId('send-button'))

    expect(onSubmit).toHaveBeenCalledWith('Test message')
  })

  it('should call onSubmit when Enter is pressed', () => {
    const onSubmit = vi.fn()
    render(<ChatInput {...defaultProps} onSubmit={onSubmit} />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    expect(onSubmit).toHaveBeenCalledWith('Test message')
  })

  it('should not submit on Shift+Enter', () => {
    const onSubmit = vi.fn()
    render(<ChatInput {...defaultProps} onSubmit={onSubmit} />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should not submit empty message', () => {
    const onSubmit = vi.fn()
    render(<ChatInput {...defaultProps} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByTestId('send-button'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should clear input after submit', () => {
    render(<ChatInput {...defaultProps} />)

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(screen.getByTestId('send-button'))

    expect(input.value).toBe('')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<ChatInput {...defaultProps} disabled />)

    expect(screen.getByTestId('chat-input')).toBeDisabled()
    expect(screen.getByTestId('send-button')).toBeDisabled()
  })

  it('should toggle voice mode when button is clicked', () => {
    const onVoiceModeToggle = vi.fn()
    render(<ChatInput {...defaultProps} onVoiceModeToggle={onVoiceModeToggle} />)

    fireEvent.click(screen.getByTestId('voice-mode-toggle'))

    expect(onVoiceModeToggle).toHaveBeenCalled()
  })

  it('should show mic button when in voice mode', () => {
    render(<ChatInput {...defaultProps} isVoiceMode />)

    expect(screen.getByTestId('mic-button')).toBeInTheDocument()
    expect(screen.queryByTestId('send-button')).not.toBeInTheDocument()
  })

  it('should call onStartListening when mic button is clicked', () => {
    const onStartListening = vi.fn()
    render(<ChatInput {...defaultProps} isVoiceMode onStartListening={onStartListening} />)

    fireEvent.click(screen.getByTestId('mic-button'))

    expect(onStartListening).toHaveBeenCalled()
  })

  it('should show stop speaking button when speaking', () => {
    render(<ChatInput {...defaultProps} isVoiceMode isSpeaking />)

    expect(screen.getByTestId('stop-speaking')).toBeInTheDocument()
  })

  it('should update input with transcript', () => {
    const { rerender } = render(<ChatInput {...defaultProps} isVoiceMode />)

    rerender(<ChatInput {...defaultProps} isVoiceMode transcript="Hello world" />)

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    expect(input.value).toBe('Hello world')
  })

  it('should not show voice toggle when voice is not supported', () => {
    render(<ChatInput {...defaultProps} isVoiceSupported={false} />)

    expect(screen.queryByTestId('voice-mode-toggle')).not.toBeInTheDocument()
  })
})
