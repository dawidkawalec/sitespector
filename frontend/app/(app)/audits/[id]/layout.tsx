/**
 * Audit Detail Layout
 *
 * Syncs current audit_id to the chat store so the chat panel stays report-scoped.
 */

'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/lib/chat-store'

export default function AuditLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode
  params: { id: string }
}) {
  const setActiveAudit = useChatStore((s) => s.setActiveAudit)

  useEffect(() => {
    setActiveAudit(params.id)
    return () => setActiveAudit(null)
  }, [params.id, setActiveAudit])

  return (
    <>
      {children}
    </>
  )
}
