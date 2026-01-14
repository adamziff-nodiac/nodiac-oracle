import { NextRequest } from 'next/server'
import { streamAI } from '@/lib/ai-providers'
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

    // Create a streaming response using Server-Sent Events
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamAI(body)

          for await (const token of generator) {
            // Send each token as a Server-Sent Event
            const data = JSON.stringify({ token })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
          controller.close()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          const errorData = JSON.stringify({ error: message })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
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
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
