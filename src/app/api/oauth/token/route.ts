import { NextRequest, NextResponse } from 'next/server'
import { exchangeAuthCode, refreshTokens, getClient } from '@/lib/mcp/token-store'

export async function POST(req: NextRequest) {
  const body = await req.formData().catch(() => null)
  const params = body
    ? Object.fromEntries(body.entries())
    : await req.json().catch(() => ({}))

  const grantType = params.grant_type as string
  const clientId = params.client_id as string
  const clientSecret = params.client_secret as string

  // Validate client credentials
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'invalid_client', error_description: 'Missing client credentials' }, { status: 401 })
  }

  const client = await getClient(clientId)
  if (!client || client.client_secret !== clientSecret) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }

  if (grantType === 'authorization_code') {
    const code = params.code as string
    const codeVerifier = params.code_verifier as string

    if (!code || !codeVerifier) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing code or code_verifier' }, { status: 400 })
    }

    const tokens = await exchangeAuthCode(code, codeVerifier)
    if (!tokens) {
      return NextResponse.json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' }, { status: 400 })
    }

    return NextResponse.json(tokens)
  }

  if (grantType === 'refresh_token') {
    const refreshToken = params.refresh_token as string
    if (!refreshToken) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing refresh_token' }, { status: 400 })
    }

    const tokens = await refreshTokens(refreshToken)
    if (!tokens) {
      return NextResponse.json({ error: 'invalid_grant', error_description: 'Invalid refresh token' }, { status: 400 })
    }

    return NextResponse.json(tokens)
  }

  return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
}
