'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Loader2 } from 'lucide-react'

export function GlobalLogout() {
  const { user } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="fixed top-3 right-3 z-[60] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-black/60 transition-colors"
      title="Sign out"
    >
      {isSigningOut ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <>
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-5 h-5 rounded-full"
            />
          )}
          <LogOut className="w-3.5 h-3.5" />
        </>
      )}
    </button>
  )
}
