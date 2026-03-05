import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

  // Now redirect to Supabase Google OAuth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { flowType: 'pkce' },
  })

  const origin = getOrigin()
  const callbackUrl = `${origin}/api/oauth/callback?auth_code=${authCode}&state=${state}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
      queryParams: {
        hd: 'nodiac.ai', // hint Google to show only @nodiac.ai accounts
      },
    },
  })

  if (error || !data.url) {
    return NextResponse.json({ error: 'server_error', error_description: 'Failed to initiate Google OAuth' }, { status: 500 })
  }

  return NextResponse.redirect(data.url)
}
