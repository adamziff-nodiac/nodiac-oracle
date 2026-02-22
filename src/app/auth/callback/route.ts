import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_DOMAIN = 'nodiac.ai'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check email domain
      const { data: { user } } = await supabase.auth.getUser()
      const email = user?.email ?? ''

      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        // Sign out unauthorized user and redirect with error
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?error=unauthorized_domain`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
