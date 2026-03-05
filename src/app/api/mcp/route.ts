import { NextRequest, NextResponse } from 'next/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createClient } from '@supabase/supabase-js'
import { validateAccessToken } from '@/lib/mcp/token-store'
import { createMcpServer } from '@/lib/mcp/server'

export async function POST(req: NextRequest) {
  // Extract Bearer token
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'unauthorized', error_description: 'Missing Bearer token' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    )
  }

  const accessToken = authHeader.slice(7)
  const tokenData = await validateAccessToken(accessToken)
  if (!tokenData) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Invalid or expired access token' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' } }
    )
  }

  // Create a Supabase client with the user's session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Set the user's session so RLS applies
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: tokenData.supabaseAccessToken,
    refresh_token: tokenData.supabaseRefreshToken,
  })

  if (sessionError) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Supabase session expired. Please re-authenticate.' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' } }
    )
  }

  // Create stateless transport and MCP server
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  })

  const server = createMcpServer(supabase, tokenData.userEmail)
  await server.connect(transport)

  // Handle the request
  const response = await transport.handleRequest(req as unknown as Request)

  // Clean up
  await server.close()

  return response as unknown as NextResponse
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST for MCP requests.' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed. This is a stateless MCP endpoint.' }, { status: 405 })
}
