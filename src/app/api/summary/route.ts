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
          content: `Please provide a 2-sentence summary of the following conversation. Focus on the main topic discussed and key insights provided. Be concise and informative.

Conversation:
${conversation}`,
        },
      ],
      model: lightweightModel.id,
      provider: lightweightModel.provider,
      systemPrompt: 'You are a helpful assistant that summarizes conversations concisely. Always respond with exactly 2 sentences.',
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
