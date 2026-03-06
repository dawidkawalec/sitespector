'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0b363d] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-24">
      <div className="text-center">
        <Image
          src="/sitespector_logo_transp.svg"
          alt="SiteSpector"
          width={3068}
          height={759}
          unoptimized
          className="mx-auto mb-6 h-14 w-auto max-w-full object-contain"
        />
        <p className="mb-8 text-xl text-[#616c6e]">
          AI-Powered Website Audits
        </p>
        <Link href="/login">
          <Button size="lg" className="bg-[#ff8945] text-white hover:bg-[#e67a3d]">
            Zaloguj się / Załóż konto
          </Button>
        </Link>
      </div>
    </div>
  )
}
