import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider, ChatRequest } from '@/types'

export async function* streamAnthropicAPI(request: ChatRequest): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })

  const stream = client.messages.stream({
    model: request.model,
    max_tokens: 4096,
    system: request.systemPrompt,
    messages: request.messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

export async function* streamOpenAIAPI(request: ChatRequest): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

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

  const stream = await client.chat.completions.create({
    model: request.model,
    max_completion_tokens: 4096,
    stream: true,
    messages: [
      { role: 'system', content: request.systemPrompt },
      ...messagesWithPersona,
    ],
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

export async function* streamGoogleAPI(request: ChatRequest): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

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
  const result = await chat.sendMessageStream(lastMessage.content)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) {
      yield text
    }
  }
}

export function streamAI(request: ChatRequest): AsyncGenerator<string, void, unknown> {
  const providers: Record<AIProvider, (req: ChatRequest) => AsyncGenerator<string, void, unknown>> = {
    anthropic: streamAnthropicAPI,
    openai: streamOpenAIAPI,
    google: streamGoogleAPI,
  }

  const handler = providers[request.provider]
  if (!handler) {
    throw new Error(`Unknown provider: ${request.provider}`)
  }

  return handler(request)
}
