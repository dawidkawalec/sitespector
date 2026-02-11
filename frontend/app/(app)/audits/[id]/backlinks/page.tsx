'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BacklinksRedirect({ params }: { params: { id: string } }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(`/audits/${params.id}/links?tab=incoming`)
  }, [params.id, router])

  return null
}
