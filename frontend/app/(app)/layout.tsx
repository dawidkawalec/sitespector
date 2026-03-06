'use client'

/**
 * Dashboard Layout
 * 
 * Wraps dashboard and all authenticated pages with:
 * - Sidebar navigation (desktop)
 * - Mobile header with menu
 * - Main content area
 */

import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ChatToggleButton } from '@/components/chat/ChatToggleButton'
import { clearImpersonationSession, getImpersonationSession, IMPERSONATION_EVENT } from '@/lib/impersonation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShieldAlert } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [impersonationAuditId, setImpersonationAuditId] = useState<string | null>(null)

  useEffect(() => {
    const syncImpersonation = () => {
      const session = getImpersonationSession()
      setImpersonationAuditId(session?.auditId ?? null)
    }

    syncImpersonation()
    window.addEventListener(IMPERSONATION_EVENT, syncImpersonation)
    window.addEventListener('focus', syncImpersonation)
    return () => {
      window.removeEventListener(IMPERSONATION_EVENT, syncImpersonation)
      window.removeEventListener('focus', syncImpersonation)
    }
  }, [])

  const isImpersonating = !!impersonationAuditId

  const handleExitImpersonation = () => {
    clearImpersonationSession()
    router.push('/admin/audits')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {!isImpersonating && (
        <div className="hidden md:block">
          <UnifiedSidebar />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with menu */}
        {!isImpersonating ? (
          <header className="md:hidden h-16 border-b border-white/10 flex items-center px-4 bg-[#0b363d] text-white flex-shrink-0">
            <MobileSidebar />
            <Image
              src="/sitespector_logo_transp.svg"
              alt="SiteSpector"
              width={3068}
              height={759}
              unoptimized
              className="ml-4 h-7 w-auto max-w-[200px] rounded-lg bg-white px-2 py-1 object-contain"
            />
          </header>
        ) : (
          <header className="md:hidden h-16 border-b border-white/10 flex items-center px-4 bg-[#0b363d] text-white flex-shrink-0">
            <Image
              src="/sitespector_logo_transp.svg"
              alt="SiteSpector"
              width={3068}
              height={759}
              unoptimized
              className="h-7 w-auto max-w-[200px] rounded-lg bg-white px-2 py-1 object-contain"
            />
          </header>
        )}

        {isImpersonating && (
          <div className="border-b border-amber-300/30 bg-amber-100/60 dark:bg-amber-950/30 px-4 py-2 flex items-center justify-between gap-3">
            <div className="text-xs md:text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              Tryb klienta aktywny (audit: {impersonationAuditId})
            </div>
            <Button size="sm" variant="outline" onClick={handleExitImpersonation}>
              Wyjdz
            </Button>
          </div>
        )}

        {/* Scrollable content */}
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto relative @container">
          {children}
        </main>
      </div>

      {!isImpersonating && (
        <>
          <ChatPanel />
          <ChatToggleButton />
        </>
      )}
    </div>
  )
}
