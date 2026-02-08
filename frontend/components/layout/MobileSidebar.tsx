'use client'

/**
 * Mobile Sidebar Component
 * 
 * Sheet (slide-in) sidebar for mobile devices.
 * Uses the unified sidebar for consistent navigation.
 */

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnifiedSidebar } from './UnifiedSidebar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72 bg-[#0b363d] border-white/10">
        <UnifiedSidebar onAction={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
