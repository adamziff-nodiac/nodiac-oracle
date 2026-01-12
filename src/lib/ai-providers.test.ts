import { describe, it, expect, vi, beforeEach } from 'vitest'
import { callAI, callAnthropicAPI, callOpenAIAPI, callGoogleAPI } from './ai-providers'
import { ChatRequest } from '@/types'

const mockRequest: ChatRequest = {
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'test-model',
  provider: 'anthropic',
  systemPrompt: 'You are a helpful assistant',
}

describe('callAI', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should call the correct provider based on request', async () => {
    const response = await callAI({
      ...mockRequest,
      provider: 'anthropic',
    })
    // Without API key, should return error
    expect(response.error).toContain('ANTHROPIC_API_KEY')
  })

  it('should handle unknown provider', async () => {
    const response = await callAI({
      ...mockRequest,
      provider: 'unknown' as 'anthropic',
    })
    expect(response.error).toContain('Unknown provider')
  })
})

describe('callAnthropicAPI', () => {
  it('should return error when API key is missing', async () => {
    const response = await callAnthropicAPI(mockRequest)
    expect(response.error).toContain('ANTHROPIC_API_KEY')
    expect(response.content).toBe('')
  })
})

describe('callOpenAIAPI', () => {
  it('should return error when API key is missing', async () => {
    const response = await callOpenAIAPI({
      ...mockRequest,
      provider: 'openai',
    })
    expect(response.error).toContain('OPENAI_API_KEY')
    expect(response.content).toBe('')
  })
})

describe('callGoogleAPI', () => {
  it('should return error when API key is missing', async () => {
    const response = await callGoogleAPI({
      ...mockRequest,
      provider: 'google',
    })
    expect(response.error).toContain('GOOGLE_AI_API_KEY')
    expect(response.content).toBe('')
  })
})
