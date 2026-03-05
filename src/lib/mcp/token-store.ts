/**
 * OAuth token store — CRUD for MCP OAuth clients and tokens.
 * Uses Supabase with the service role key (bypasses RLS).
 */
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  return createClient(url, key)
}

// ── Client Registration ─────────────────────────────────────────────

export async function registerClient(redirectUris: string[], clientName?: string) {
  const db = getServiceClient()
  const { data, error } = await db
    .from('mcp_oauth_clients')
    .insert({ redirect_uris: redirectUris, client_name: clientName ?? null })
    .select('client_id, client_secret, redirect_uris, client_name')
    .single()
  if (error) throw new Error(`Failed to register client: ${error.message}`)
  return data
}

export async function getClient(clientId: string) {
  const db = getServiceClient()
  const { data, error } = await db
    .from('mcp_oauth_clients')
    .select('*')
    .eq('client_id', clientId)
    .single()
  if (error) return null
  return data
}

// ── Auth Code ───────────────────────────────────────────────────────

export async function storeAuthCode(params: {
  clientId: string
  authCode: string
  codeChallenge: string
  redirectUri: string
  state: string
}) {
  const db = getServiceClient()
  const { error } = await db.from('mcp_oauth_tokens').insert({
    client_id: params.clientId,
    auth_code: params.authCode,
    code_challenge: params.codeChallenge,
    redirect_uri: params.redirectUri,
    state: params.state,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min
  })
  if (error) throw new Error(`Failed to store auth code: ${error.message}`)
}

export async function exchangeAuthCode(authCode: string, codeVerifier: string) {
  const db = getServiceClient()
  const { data, error } = await db
    .from('mcp_oauth_tokens')
    .select('*')
    .eq('auth_code', authCode)
    .single()

  if (error || !data) return null
  if (new Date(data.expires_at) < new Date()) return null

  // Verify PKCE challenge
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier))
  const computed = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  if (computed !== data.code_challenge) return null

  // Generate tokens
  const accessToken = crypto.randomUUID()
  const refreshToken = crypto.randomUUID()

  const { error: updateError } = await db
    .from('mcp_oauth_tokens')
    .update({
      auth_code: null, // consumed
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    })
    .eq('id', data.id)

  if (updateError) return null

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer' as const,
    expires_in: 3600,
  }
}

// ── Token Validation ────────────────────────────────────────────────

export async function validateAccessToken(accessToken: string) {
  const db = getServiceClient()
  const { data, error } = await db
    .from('mcp_oauth_tokens')
    .select('*')
    .eq('access_token', accessToken)
    .single()

  if (error || !data) return null
  if (new Date(data.expires_at) < new Date()) return null

  return {
    clientId: data.client_id as string,
    supabaseAccessToken: data.supabase_access_token as string,
    supabaseRefreshToken: data.supabase_refresh_token as string,
    userEmail: data.user_email as string,
  }
}

// ── Token Refresh ───────────────────────────────────────────────────

export async function refreshTokens(refreshToken: string) {
  const db = getServiceClient()
  const { data, error } = await db
    .from('mcp_oauth_tokens')
    .select('*')
    .eq('refresh_token', refreshToken)
    .single()

  if (error || !data) return null

  const newAccessToken = crypto.randomUUID()
  const newRefreshToken = crypto.randomUUID()

  const { error: updateError } = await db
    .from('mcp_oauth_tokens')
    .update({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    })
    .eq('id', data.id)

  if (updateError) return null

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    token_type: 'bearer' as const,
    expires_in: 3600,
  }
}

// ── Store Supabase Session ──────────────────────────────────────────

export async function storeSupabaseSession(params: {
  authCode: string
  state: string
  supabaseAccessToken: string
  supabaseRefreshToken: string
  userEmail: string
}) {
  const db = getServiceClient()
  const { error } = await db
    .from('mcp_oauth_tokens')
    .update({
      supabase_access_token: params.supabaseAccessToken,
      supabase_refresh_token: params.supabaseRefreshToken,
      user_email: params.userEmail,
    })
    .eq('auth_code', params.authCode)
    .eq('state', params.state)

  if (error) throw new Error(`Failed to store Supabase session: ${error.message}`)
}
