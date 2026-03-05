/**
 * OAuth authentication flow for the MCP server.
 *
 * Users authenticate via Google OAuth through Supabase, the same flow
 * they already use in the web app. Tokens are cached locally so users
 * only need to sign in once (until the refresh token expires).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import http from 'http'

const ALLOWED_DOMAIN = 'nodiac.ai'
const AUTH_CALLBACK_PORT = 54321
const AUTH_CALLBACK_PATH = '/auth/callback'
const TOKEN_DIR = join(homedir(), '.nodiac')
const TOKEN_FILE = join(TOKEN_DIR, 'mcp-session.json')

interface StoredSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user_email: string
}

function log(msg: string) {
  // Write to stderr so it doesn't interfere with MCP stdio transport
  process.stderr.write(`[nodiac-mcp] ${msg}\n`)
}

function saveSession(session: StoredSession): void {
  if (!existsSync(TOKEN_DIR)) {
    mkdirSync(TOKEN_DIR, { recursive: true })
  }
  writeFileSync(TOKEN_FILE, JSON.stringify(session, null, 2), { mode: 0o600 })
}

function loadSession(): StoredSession | null {
  try {
    if (!existsSync(TOKEN_FILE)) return null
    const data = JSON.parse(readFileSync(TOKEN_FILE, 'utf-8'))
    if (!data.access_token || !data.refresh_token) return null
    return data as StoredSession
  } catch {
    return null
  }
}

function clearSession(): void {
  try {
    if (existsSync(TOKEN_FILE)) {
      writeFileSync(TOKEN_FILE, '{}')
    }
  } catch {
    // ignore
  }
}

/**
 * Create an unauthenticated Supabase client (uses the anon/publishable key).
 * This client is used to initiate the OAuth flow.
 */
function createAnonClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY environment variables.'
    )
  }

  return createClient(url, key)
}

/**
 * Start a local HTTP server to receive the OAuth callback, then open the
 * browser for Google sign-in. Returns the authenticated Supabase client.
 */
async function performOAuthFlow(): Promise<SupabaseClient> {
  const supabase = createAnonClient()

  const redirectTo = `http://localhost:${AUTH_CALLBACK_PORT}${AUTH_CALLBACK_PATH}`

  // Generate the OAuth URL
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) {
    throw new Error(`Failed to generate OAuth URL: ${error?.message ?? 'no URL returned'}`)
  }

  log('Opening browser for Google sign-in...')

  // Wait for the callback with the auth code
  const code = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close()
      reject(new Error('Authentication timed out after 2 minutes'))
    }, 120_000)

    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${AUTH_CALLBACK_PORT}`)

      if (url.pathname === AUTH_CALLBACK_PATH) {
        const authCode = url.searchParams.get('code')

        if (authCode) {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Nodiac MCP - Signed In</title></head>
              <body style="font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #1a1a2e; color: white;">
                <div style="text-align: center; max-width: 400px;">
                  <div style="font-size: 48px; margin-bottom: 16px;">&#10003;</div>
                  <h1 style="margin: 0 0 8px;">Signed in to Nodiac</h1>
                  <p style="color: #888;">You can close this tab and return to Claude.</p>
                </div>
              </body>
            </html>
          `)
          clearTimeout(timeout)
          server.close()
          resolve(authCode)
        } else {
          const errorMsg = url.searchParams.get('error_description') || url.searchParams.get('error') || 'Unknown error'
          res.writeHead(400, { 'Content-Type': 'text/html' })
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><title>Nodiac MCP - Error</title></head>
              <body style="font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #1a1a2e; color: white;">
                <div style="text-align: center; max-width: 400px;">
                  <div style="font-size: 48px; margin-bottom: 16px;">&#10007;</div>
                  <h1 style="margin: 0 0 8px;">Sign-in failed</h1>
                  <p style="color: #f87171;">${errorMsg}</p>
                </div>
              </body>
            </html>
          `)
          clearTimeout(timeout)
          server.close()
          reject(new Error(`OAuth failed: ${errorMsg}`))
        }
      } else {
        res.writeHead(404)
        res.end('Not found')
      }
    })

    server.listen(AUTH_CALLBACK_PORT, () => {
      // Open browser after server is ready
      import('open').then(({ default: open }) => {
        open(data.url).catch(() => {
          log(`Could not open browser automatically. Please visit:\n${data.url}`)
        })
      })
    })

    server.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`Failed to start auth callback server: ${err.message}`))
    })
  })

  // Exchange the code for a session
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError || !sessionData.session) {
    throw new Error(`Failed to exchange auth code: ${sessionError?.message ?? 'no session returned'}`)
  }

  const email = sessionData.session.user.email ?? ''
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await supabase.auth.signOut()
    clearSession()
    throw new Error(`Access restricted to @${ALLOWED_DOMAIN} accounts. Got: ${email}`)
  }

  // Save the session for future use
  saveSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    expires_at: sessionData.session.expires_at ?? 0,
    user_email: email,
  })

  log(`Authenticated as ${email}`)

  return supabase
}

/**
 * Attempt to restore a previous session from disk. If the access token is
 * expired, try to refresh it. Returns null if no valid session exists.
 */
async function restoreSession(): Promise<SupabaseClient | null> {
  const stored = loadSession()
  if (!stored) return null

  const supabase = createAnonClient()

  // Try to set the session (this also handles refresh if expired)
  const { data, error } = await supabase.auth.setSession({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
  })

  if (error || !data.session) {
    log('Stored session expired or invalid, re-authenticating...')
    clearSession()
    return null
  }

  // Update stored tokens (they may have been refreshed)
  saveSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at ?? 0,
    user_email: data.session.user.email ?? stored.user_email,
  })

  log(`Restored session for ${data.session.user.email}`)

  return supabase
}

/**
 * Get an authenticated Supabase client. Tries to restore a cached session
 * first, falls back to the full OAuth flow.
 */
export async function getAuthenticatedClient(): Promise<SupabaseClient> {
  // Try cached session first
  const restored = await restoreSession()
  if (restored) return restored

  // Full OAuth flow
  return performOAuthFlow()
}

/**
 * Get the current user's email from the cached session file.
 */
export function getCurrentUserEmail(): string {
  const stored = loadSession()
  return stored?.user_email ?? 'unknown'
}
