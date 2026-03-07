'use client'

import Link from 'next/link'
import { ArrowUpLeft, FolderKanban, LayoutGrid } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SiteSpectorLogo } from '@/components/brand/SiteSpectorLogo'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { Breadcrumbs } from './Breadcrumbs'
import { UserMenu } from './UserMenu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TopBarProps {
  mobileMenu?: React.ReactNode
  isImpersonating?: boolean
}

export function TopBar({ mobileMenu, isImpersonating = false }: TopBarProps) {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'
  const isProjectsArea = pathname.startsWith('/projects') || pathname.startsWith('/audits')

  if (isImpersonating) {
    return (
      <header className="sticky top-0 z-30 h-[52px] border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-full w-full items-center gap-1.5 px-3 md:px-5">
          <SiteSpectorLogo href="/dashboard" logoHeight={23} className="rounded-lg bg-white px-2 py-1 shadow-sm" />
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  aria-label="Powrot na strone glowna"
                >
                  <ArrowUpLeft className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Strona glowna</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 h-[52px] border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-full w-full items-center gap-2 px-2.5 md:px-4">
        <div className="md:hidden">{mobileMenu}</div>

        <div className="hidden md:flex items-center gap-1.5">
          <SiteSpectorLogo href="/dashboard" logoHeight={23} className="rounded-lg bg-white px-2 py-1 shadow-sm" />
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  aria-label="Powrot na strone glowna"
                >
                  <ArrowUpLeft className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Strona glowna</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <nav className="ml-1.5 flex items-center gap-1">
            <Link
              href="/dashboard"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
                isDashboard
                  ? 'bg-accent/15 text-accent shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:-translate-y-[1px]'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <Link
              href="/projects"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
                isProjectsArea
                  ? 'bg-accent/15 text-accent shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:-translate-y-[1px]'
              )}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              Projekty
            </Link>
          </nav>
        </div>

        <div className="min-w-0 flex-1 px-0.5 md:px-2">
          <Breadcrumbs />
        </div>

        <div className="hidden md:block w-[250px]">
          <WorkspaceSwitcher />
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
