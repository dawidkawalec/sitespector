'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LighthouseDataRedirect({ params }: { params: { id: string } }) {
  const router = useRouter()
  useEffect(() => {
    router.replace(`/audits/${params.id}/performance?tab=raw`)
  }, [params.id, router])

  return null
}
