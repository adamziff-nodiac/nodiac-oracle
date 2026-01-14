import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatInput } from './ChatInput'
import { TTSProvider } from '@/contexts/TTSContext'

// Wrapper component for TTS context
const renderWithTTS = (ui: React.ReactElement) => {
  return render(<TTSProvider>{ui}</TTSProvider>)
}

describe('ChatInput', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isListening: false,
    onStartListening: vi.fn(),
    onStopListening: vi.fn(),
    transcript: '',
    isVoiceSupported: true,
  }

  it('should render the text input', () => {
    renderWithTTS(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('should render the send button', () => {
    renderWithTTS(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('send-button')).toBeInTheDocument()
  })

  it('should render the auto-read toggle', () => {
    renderWithTTS(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('auto-read-toggle')).toBeInTheDocument()
  })

  it('should render the mic button when voice is supported', () => {
    renderWithTTS(<ChatInput {...defaultProps} />)
    expect(screen.getByTestId('mic-button')).toBeInTheDocument()
  })

  it('should call onSubmit when send button is clicked', () => {
    const onSubmit = vi.fn()
    renderWithTTS(<ChatInput {...defaultProps} onSubmit={onSubmit} />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(screen.getByTestId('send-button'))

    expect(onSubmit).toHaveBeenCalledWith('Test message')
  })

  it('should call onSubmit when Enter is pressed', () => {
    const onSubmit = vi.fn()
    renderWithTTS(<ChatInput {...defaultProps} onSubmit={onSubmit} />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    expect(onSubmit).toHaveBeenCalledWith('Test message')
  })

  it('should not submit on Shift+Enter', () => {
    const onSubmit = vi.fn()
    renderWithTTS(<ChatInput {...defaultProps} onSubmit={onSubmit} />)

    const input = screen.getByTestId('chat-input')
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should not submit empty message', () => {
    const onSubmit = vi.fn()
    renderWithTTS(<ChatInput {...defaultProps} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByTestId('send-button'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should clear input after submit', () => {
    renderWithTTS(<ChatInput {...defaultProps} />)

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(screen.getByTestId('send-button'))

    expect(input.value).toBe('')
  })

  it('should be disabled when disabled prop is true', () => {
    renderWithTTS(<ChatInput {...defaultProps} disabled />)

    expect(screen.getByTestId('chat-input')).toBeDisabled()
    expect(screen.getByTestId('send-button')).toBeDisabled()
  })

  it('should call onStartListening when mic button is clicked', () => {
    const onStartListening = vi.fn()
    renderWithTTS(<ChatInput {...defaultProps} onStartListening={onStartListening} />)

    fireEvent.click(screen.getByTestId('mic-button'))

    expect(onStartListening).toHaveBeenCalled()
  })

  it('should call onStopListening when mic button is clicked while listening', () => {
    const onStopListening = vi.fn()
    renderWithTTS(<ChatInput {...defaultProps} isListening onStopListening={onStopListening} />)

    fireEvent.click(screen.getByTestId('mic-button'))

    expect(onStopListening).toHaveBeenCalled()
  })

  it('should update input with transcript while listening', () => {
    renderWithTTS(<ChatInput {...defaultProps} isListening transcript="Hello world" />)

    const input = screen.getByTestId('chat-input') as HTMLTextAreaElement
    expect(input.value).toBe('Hello world')
  })

  it('should not show voice controls when voice is not supported', () => {
    renderWithTTS(<ChatInput {...defaultProps} isVoiceSupported={false} />)

    expect(screen.queryByTestId('mic-button')).not.toBeInTheDocument()
  })

  it('should disable input while listening', () => {
    renderWithTTS(<ChatInput {...defaultProps} isListening />)

    expect(screen.getByTestId('chat-input')).toBeDisabled()
  })
})
