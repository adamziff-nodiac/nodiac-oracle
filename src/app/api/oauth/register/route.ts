import { NextRequest, NextResponse } from 'next/server'
import { registerClient } from '@/lib/mcp/token-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const redirectUris = body.redirect_uris ?? []
    const clientName = body.client_name ?? body.software_id ?? null

    const client = await registerClient(redirectUris, clientName)

    return NextResponse.json({
      client_id: client.client_id,
      client_secret: client.client_secret,
      redirect_uris: client.redirect_uris,
      client_name: client.client_name,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'client_secret_post',
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'server_error', error_description: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
