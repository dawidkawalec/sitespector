'use client'

/**
 * Dashboard Layout
 * 
 * Wraps dashboard and all authenticated pages with:
 * - Sidebar navigation (desktop)
 * - Mobile header with menu
 * - Main content area
 */

import { ChatPanel } from '@/components/chat/ChatPanel'
import { ChatToggleButton } from '@/components/chat/ChatToggleButton'
import { clearImpersonationSession, getImpersonationSession, IMPERSONATION_EVENT } from '@/lib/impersonation'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { AuditSidebar } from '@/components/layout/AuditSidebar'
import { ProjectSidebar } from '@/components/layout/ProjectSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
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
  const isAdminRoute = pathname.startsWith('/admin')
  const auditMatch = pathname.match(/^\/audits\/([^/]+)/)
  const auditId = auditMatch?.[1] ?? null
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const projectId = projectMatch?.[1] ?? null
  const showAuditSidebar = !!auditId
  const showProjectSidebar = !showAuditSidebar && !!projectId

  const handleExitImpersonation = () => {
    clearImpersonationSession()
    router.push('/admin/audits')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        {!isAdminRoute && (
          <TopBar
            isImpersonating={isImpersonating}
            mobileMenu={<MobileMenu auditId={auditId} projectId={projectId} />}
          />
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

        <div className="flex min-h-0 flex-1">
          {!isImpersonating && !isAdminRoute && showAuditSidebar && auditId && (
            <div className="hidden md:block animate-in slide-in-from-left-2 fade-in duration-200">
              <AuditSidebar auditId={auditId} />
            </div>
          )}
          {!isImpersonating && !isAdminRoute && showProjectSidebar && projectId && (
            <div className="hidden md:block animate-in slide-in-from-left-2 fade-in duration-200">
              <ProjectSidebar projectId={projectId} />
            </div>
          )}

          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto relative @container">
            {children}
          </main>
        </div>
      </div>

      {!isImpersonating && !isAdminRoute && (
        <>
          <ChatPanel />
          <ChatToggleButton />
        </>
      )}
    </div>
  )
}
