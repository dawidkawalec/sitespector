'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function PublicHomePage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          router.replace('/dashboard')
          return
        }
      } catch (err) {
        console.error('Error checking session:', err)
      } finally {
        setCheckingAuth(false)
      }
    }
    checkSession()
  }, [router])

  if (checkingAuth) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-primary">SiteSpector</h1>
        <p className="mb-8 text-xl text-muted-foreground">
          AI-Powered Website Audits
        </p>
        <Link href="/login">
          <Button variant="accent" size="lg">
            Zaloguj się / Załóż konto
          </Button>
        </Link>
      </div>
    </div>
  )
}
