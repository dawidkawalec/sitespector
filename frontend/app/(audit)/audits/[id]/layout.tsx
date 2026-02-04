/**
 * Audit Detail Layout
 * 
 * Nested layout for /audits/[id]/* pages.
 * Adds audit-specific sidebar navigation.
 */

import { AuditSidebar } from '@/components/audit/AuditSidebar'
import { AuditMobileSidebar } from '@/components/audit/AuditMobileSidebar'

export default function AuditLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Audit sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <AuditSidebar auditId={params.id} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with menu */}
        <header className="lg:hidden h-16 border-b flex items-center px-4 bg-white dark:bg-gray-950 flex-shrink-0">
          <AuditMobileSidebar auditId={params.id} />
          <h1 className="ml-4 text-lg font-semibold">Audit Details</h1>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
