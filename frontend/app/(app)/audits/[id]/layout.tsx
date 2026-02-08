/**
 * Audit Detail Layout
 * 
 * Nested layout for /audits/[id]/* pages.
 * Now uses the unified sidebar from parent layout.
 * This layout only adds mobile header support.
 */

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function AuditLayout({ 
  children,
  params 
}: { 
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {children}
    </div>
  )
}
