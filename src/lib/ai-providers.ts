import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider, ChatRequest, ChatResponse } from '@/types'

export async function callAnthropicAPI(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { content: '', error: 'ANTHROPIC_API_KEY is not configured' }
  }

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: request.model,
      max_tokens: 4096,
      system: request.systemPrompt,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    })

    const textBlock = response.content.find(block => block.type === 'text')
    return { content: textBlock?.text || '' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { content: '', error: `Anthropic API error: ${message}` }
  }
}

export async function callOpenAIAPI(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { content: '', error: 'OPENAI_API_KEY is not configured' }
  }

  try {
    const client = new OpenAI({ apiKey })

    // Prepend persona context to the first user message for stronger adherence
    const messagesWithPersona = request.messages.map((m, i) => {
      if (i === 0 && m.role === 'user') {
        return {
          role: m.role as 'user' | 'assistant',
          content: `[IMPORTANT: You must respond as the following persona throughout this conversation]\n\n${request.systemPrompt}\n\n---\n\nUser question: ${m.content}`,
        }
      }
      return {
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }
    })

    const response = await client.chat.completions.create({
      model: request.model,
      max_completion_tokens: 4096,
      messages: [
        { role: 'system', content: request.systemPrompt },
        ...messagesWithPersona,
      ],
    })

    return { content: response.choices[0]?.message?.content || '' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { content: '', error: `OpenAI API error: ${message}` }
  }
}

export async function callGoogleAPI(request: ChatRequest): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { content: '', error: 'GEMINI_API_KEY is not configured' }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: request.model,
      systemInstruction: request.systemPrompt,
    })

    // Prepend persona context to the first user message for stronger adherence
    const messagesWithPersona = request.messages.map((m, i) => {
      if (i === 0 && m.role === 'user') {
        return {
          ...m,
          content: `[IMPORTANT: You must respond as the following persona throughout this conversation]\n\n${request.systemPrompt}\n\n---\n\nUser question: ${m.content}`,
        }
      }
      return m
    })

    const chat = model.startChat({
      history: messagesWithPersona.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    })

    const lastMessage = messagesWithPersona[messagesWithPersona.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const response = await result.response

    return { content: response.text() }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { content: '', error: `Google AI API error: ${message}` }
  }
}

export async function callAI(request: ChatRequest): Promise<ChatResponse> {
  const providers: Record<AIProvider, (req: ChatRequest) => Promise<ChatResponse>> = {
    anthropic: callAnthropicAPI,
    openai: callOpenAIAPI,
    google: callGoogleAPI,
  }

  const handler = providers[request.provider]
  if (!handler) {
    return { content: '', error: `Unknown provider: ${request.provider}` }
  }

  return handler(request)
}
