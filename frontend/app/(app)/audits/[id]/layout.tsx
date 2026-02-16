/**
 * Audit Detail Layout
 *
 * Syncs current audit_id to the chat store so the chat panel stays report-scoped.
 * Shows crawl-blocked banner when the target site returned 403/4xx.
 */

'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChatStore } from '@/lib/chat-store'
import { auditsAPI } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldAlert } from 'lucide-react'

export default function AuditLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const setActiveAudit = useChatStore((s) => s.setActiveAudit)

  const { data: audit } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
  })

  useEffect(() => {
    setActiveAudit(params.id)
    return () => setActiveAudit(null)
  }, [params.id, setActiveAudit])

  return (
    <>
      {audit?.crawl_blocked && (
        <Alert variant="default" className="mx-4 mt-2 mb-0 rounded-lg border-amber-500/30 bg-amber-500/5">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Strona zablokowała crawlera (HTTP 403/4xx)
          </AlertTitle>
          <AlertDescription>
            Dane z crawlu są niepełne. Analiza SEO i Quick Wins mogły zostać pominięte, aby nie generować mylących zaleceń.
            Ustaw custom User-Agent w ustawieniach audytu (w porozumieniu z właścicielem strony) i uruchom audyt ponownie.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </>
  )
}
