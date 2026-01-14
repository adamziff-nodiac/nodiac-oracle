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

  it('should render the send button', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('send-button')).toBeInTheDocument()
  })

  it('should render the voice mode toggle', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('voice-mode-toggle')).toBeInTheDocument()
  })

  it('should render the mic button when voice is supported', () => {
    render(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('mic-button')).toBeInTheDocument()
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

  it('should call onStartListening when mic button is clicked', () => {
    const onStartListening = vi.fn()
    render(<ChatInput {...defaultProps} onStartListening={onStartListening} />)

    fireEvent.click(screen.getByTestId('mic-button'))

    expect(onStartListening).toHaveBeenCalled()
  })

  it('should call onStopListening when mic button is clicked while listening', () => {
    const onStopListening = vi.fn()
    render(<ChatInput {...defaultProps} isListening onStopListening={onStopListening} />)

    fireEvent.click(screen.getByTestId('mic-button'))

    expect(onStopListening).toHaveBeenCalled()
  })

  it('should call onStopSpeaking when voice toggle is clicked while speaking', () => {
    const onStopSpeaking = vi.fn()
    render(<ChatInput {...defaultProps} isSpeaking onStopSpeaking={onStopSpeaking} />)

    fireEvent.click(screen.getByTestId('voice-mode-toggle'))

    expect(onStopSpeaking).toHaveBeenCalled()
  })

  it('should update input with transcript while listening', () => {
    render(<ChatInput {...defaultProps} isListening transcript="Hello world" />)

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    expect(input.value).toBe('Hello world')
  })

  it('should not show voice controls when voice is not supported', () => {
    render(<ChatInput {...defaultProps} isVoiceSupported={false} />)

    expect(screen.queryByTestId('voice-mode-toggle')).not.toBeInTheDocument()
    expect(screen.queryByTestId('mic-button')).not.toBeInTheDocument()
  })

  it('should disable input while listening', () => {
    render(<ChatInput {...defaultProps} isListening />)

    expect(screen.getByTestId('chat-input')).toBeDisabled()
  })

  it('should keep transcript in input after listening stops (no auto-submit)', () => {
    const onSubmit = vi.fn()
    const { rerender } = render(
      <ChatInput {...defaultProps} onSubmit={onSubmit} isListening transcript="Hello world" />
    )

    // Verify transcript is in input while listening
    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    expect(input.value).toBe('Hello world')

    // Simulate listening stopping
    rerender(
      <ChatInput {...defaultProps} onSubmit={onSubmit} isListening={false} transcript="Hello world" />
    )

    // Transcript should still be in input
    expect(input.value).toBe('Hello world')
    // Should NOT auto-submit
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should enable send button after listening stops with transcript', () => {
    const { rerender } = render(
      <ChatInput {...defaultProps} isListening transcript="Hello world" />
    )

    // Send button should be disabled while listening
    expect(screen.getByTestId('send-button')).toBeDisabled()

    // Simulate listening stopping
    rerender(
      <ChatInput {...defaultProps} isListening={false} transcript="Hello world" />
    )

    // Send button should now be enabled
    expect(screen.getByTestId('send-button')).not.toBeDisabled()
  })

  it('should concatenate transcript to existing text when starting recording', () => {
    const onStartListening = vi.fn()
    const { rerender } = render(
      <ChatInput {...defaultProps} onStartListening={onStartListening} />
    )

    // Type some text first
    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'Hello' } })
    expect(input.value).toBe('Hello')

    // Click mic to start recording
    fireEvent.click(screen.getByTestId('mic-button'))
    expect(onStartListening).toHaveBeenCalled()

    // Simulate listening with transcript - should concatenate
    rerender(
      <ChatInput {...defaultProps} onStartListening={onStartListening} isListening transcript="world" />
    )

    // Should have original text + space + transcript
    expect(input.value).toBe('Hello world')
  })
})
