import { NextRequest, NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-providers'
import { getLightweightModel } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { conversation, modelId } = await request.json()

    if (!conversation || typeof conversation !== 'string') {
      return NextResponse.json(
        { error: 'Conversation text is required' },
        { status: 400 }
      )
    }

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      )
    }

    const lightweightModel = getLightweightModel(modelId)

    const response = await callAI({
      messages: [
        {
          role: 'user',
          content: `Summarize this conversation as exactly 3 bullet points. Each bullet must be under 10 words. No intro text, just the bullets.

Conversation:
${conversation}`,
        },
      ],
      model: lightweightModel.id,
      provider: lightweightModel.provider,
      systemPrompt: 'You summarize conversations as exactly 3 bullet points. Each bullet is under 10 words. Format: "• Point one\\n• Point two\\n• Point three". No other text.',
    })

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ summary: response.content })
  } catch (error) {
    console.error('Summary API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
