'use client'

/**
 * Audit Mobile Sidebar Component
 * 
 * Sheet (slide-in) sidebar for mobile devices.
 * Hidden on lg+ breakpoints (desktop).
 */

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AuditSidebar } from './AuditSidebar'

interface AuditMobileSidebarProps {
  auditId: string
}

export function AuditMobileSidebar({ auditId }: AuditMobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle audit menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <AuditSidebar auditId={auditId} />
      </SheetContent>
    </Sheet>
  )
}
