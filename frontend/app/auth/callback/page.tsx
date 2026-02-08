'use client'

/**
 * OAuth Callback Page
 * 
 * Handles OAuth redirects (Google, GitHub) and magic link authentication.
 * Supabase redirects here after successful authentication.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Hash z tokenami (np. przekierowanie z LP/demosite po logowaniu email/hasło)
        if (typeof window !== 'undefined' && window.location.hash) {
          const params = new URLSearchParams(window.location.hash.slice(1))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          if (access_token && refresh_token) {
            const { error: setError_ } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })
            if (setError_) throw setError_
            window.history.replaceState(null, '', window.location.pathname)
            router.push('/dashboard')
            return
          }
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          setError(sessionError.message)
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (session) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    handleCallback()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-red-600 text-xl font-semibold">Authentication Error</div>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Completing sign in...</h1>
            <p className="text-muted-foreground">Please wait a moment</p>
          </>
        )}
      </div>
    </div>
  )
}
