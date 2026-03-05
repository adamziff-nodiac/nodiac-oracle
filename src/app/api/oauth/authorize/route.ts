import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getClient, storeAuthCode } from '@/lib/mcp/token-store'
import { getOrigin } from '@/lib/mcp/origin'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const clientId = params.get('client_id')
  const redirectUri = params.get('redirect_uri')
  const codeChallenge = params.get('code_challenge')
  const codeChallengeMethod = params.get('code_challenge_method')
  const state = params.get('state')
  const responseType = params.get('response_type')

  // Validate required params
  if (!clientId || !redirectUri || !codeChallenge || !state) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Missing required parameters' }, { status: 400 })
  }

  if (responseType !== 'code') {
    return NextResponse.json({ error: 'unsupported_response_type' }, { status: 400 })
  }

  if (codeChallengeMethod !== 'S256') {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Only S256 code_challenge_method is supported' }, { status: 400 })
  }

  // Verify client exists
  const client = await getClient(clientId)
  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 })
  }

  // Generate our auth code
  const authCode = crypto.randomUUID()

  // Store the pending auth code with PKCE challenge
  await storeAuthCode({
    clientId,
    authCode,
    codeChallenge,
    redirectUri,
    state,
  })

  // Create Supabase client with cookie storage so PKCE code_verifier
  // persists across the redirect to Google and back to our callback.
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookies) { pendingCookies.push(...cookies) },
      },
    }
  )

  const origin = getOrigin()
  const callbackUrl = `${origin}/api/oauth/callback?auth_code=${authCode}&state=${state}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
      queryParams: {
        hd: 'nodiac.ai',
      },
    },
  })

  if (error || !data.url) {
    return NextResponse.json({ error: 'server_error', error_description: 'Failed to initiate Google OAuth' }, { status: 500 })
  }

  // Attach Supabase PKCE cookies to the redirect response
  const response = NextResponse.redirect(data.url)
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  }

  return response
}
