import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { storeSupabaseSession } from '@/lib/mcp/token-store'

const ALLOWED_DOMAIN = 'nodiac.ai'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const code = params.get('code')
  const authCode = params.get('auth_code')
  const state = params.get('state')

  if (!code || !authCode || !state) {
    return new NextResponse('Missing required parameters', { status: 400 })
  }

  // Exchange Google/Supabase code for a session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !sessionData.session) {
    return new NextResponse(`Authentication failed: ${error?.message ?? 'No session returned'}`, { status: 401 })
  }

  const email = sessionData.session.user.email ?? ''
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await supabase.auth.signOut()
    return new NextResponse(`Access restricted to @${ALLOWED_DOMAIN} accounts. Got: ${email}`, { status: 403 })
  }

  // Store the Supabase session mapped to our auth code
  await storeSupabaseSession({
    authCode,
    state,
    supabaseAccessToken: sessionData.session.access_token,
    supabaseRefreshToken: sessionData.session.refresh_token,
    userEmail: email,
  })

  // Look up the redirect URI from the stored auth code
  // We need to redirect back to Claude with our auth code
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: tokenRecord } = await serviceClient
    .from('mcp_oauth_tokens')
    .select('redirect_uri')
    .eq('auth_code', authCode)
    .eq('state', state)
    .single()

  if (!tokenRecord?.redirect_uri) {
    return new NextResponse('Failed to find redirect URI', { status: 400 })
  }

  // Redirect back to Claude with the auth code
  const redirectUrl = new URL(tokenRecord.redirect_uri)
  redirectUrl.searchParams.set('code', authCode)
  redirectUrl.searchParams.set('state', state)

  return NextResponse.redirect(redirectUrl.toString())
}
