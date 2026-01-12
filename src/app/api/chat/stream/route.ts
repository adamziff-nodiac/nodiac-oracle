import { NextRequest } from 'next/server'
import { streamAI } from '@/lib/ai-providers-stream'
import { ChatRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()

    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!body.model) {
      return new Response(
        JSON.stringify({ error: 'Model is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!body.provider) {
      return new Response(
        JSON.stringify({ error: 'Provider is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!body.systemPrompt) {
      return new Response(
        JSON.stringify({ error: 'System prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamAI(body)
          for await (const chunk of generator) {
            // Send each chunk as a Server-Sent Event
            const data = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          // Send done event
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          const errorData = `data: ${JSON.stringify({ error: message })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat stream API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
