'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, LayoutGrid, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SiteSpectorLogo } from '@/components/brand/SiteSpectorLogo'
import { AuditSidebar } from './AuditSidebar'
import { ProjectSidebar } from './ProjectSidebar'

interface MobileMenuProps {
  auditId: string | null
  projectId: string | null
}

export function MobileMenu({ auditId, projectId }: MobileMenuProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
          <Menu className="h-5 w-5 transition-transform duration-200 hover:scale-105" />
          <span className="sr-only">Otworz menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[92vw] max-w-[360px] p-0 border-white/10 bg-slate-950">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-4 py-3">
            <SiteSpectorLogo
              href="/dashboard"
              onClick={() => setOpen(false)}
              logoHeight={22}
              className="rounded-lg bg-white px-2 py-1"
            />
          </div>

          <div className="border-b border-white/10 p-3 space-y-1">
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <span
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all duration-150',
                  pathname === '/dashboard'
                    ? 'bg-accent/20 text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                Dashboard
              </span>
            </Link>
            <Link href="/projects" onClick={() => setOpen(false)}>
              <span
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all duration-150',
                  pathname.startsWith('/projects') || pathname.startsWith('/audits')
                    ? 'bg-accent/20 text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <FolderKanban className="h-4 w-4" />
                Projekty
              </span>
            </Link>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {auditId ? (
              <AuditSidebar
                auditId={auditId}
                onNavigate={() => setOpen(false)}
                className="h-full w-full border-r-0"
              />
            ) : projectId ? (
              <ProjectSidebar
                projectId={projectId}
                onNavigate={() => setOpen(false)}
                className="h-full w-full border-r-0"
              />
            ) : (
              <div className="p-4 text-sm text-white/60">
                Wybierz projekt lub audyt, aby zobaczyc menu kontekstowe.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
