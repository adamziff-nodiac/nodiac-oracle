'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { LogIn, LogOut, Loader2 } from 'lucide-react'

export function AuthButton() {
  const { user, isLoading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    const supabase = createClient()
    // Include current path so user returns here after login
    const returnPath = encodeURIComponent(window.location.pathname)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${returnPath}`,
      },
    })
    // Note: we don't setIsSigningIn(false) here because the page will redirect
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsSigningOut(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full py-2">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 w-full">
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name || 'User avatar'}
            className="w-8 h-8 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {(user.email || '?')[0].toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.user_metadata?.full_name || user.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          title="Sign out"
        >
          {isSigningOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isSigningIn}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200 disabled:opacity-50"
    >
      {isSigningIn ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <LogIn className="w-4 h-4" />
          Sign in with Google
        </>
      )}
    </button>
  )
}
