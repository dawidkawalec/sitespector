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
        // Get the session from URL hash/query
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError(sessionError.message)
          setTimeout(() => router.push('/login'), 3000)
          return
        }

        if (session) {
          // Successfully authenticated, redirect to dashboard
          router.push('/dashboard')
        } else {
          // No session, redirect to login
          router.push('/login')
        }
      } catch (err: any) {
        console.error('Callback error:', err)
        setError(err.message || 'Authentication failed')
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
