'use client'

/**
 * Unified Sidebar Navigation
 * 
 * Single sidebar for the entire application with:
 * - Main navigation (Dashboard, Audits)
 * - Context-aware Audit navigation (when viewing an audit)
 * - Collapsible Settings section
 * - Workspace switcher and user section
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileSearch, 
  Settings, 
  Users, 
  CreditCard,
  LogOut,
  Sparkles,
  FileText,
  Search,
  Gauge,
  ArrowLeftRight,
  Network,
  Bug,
  FileDown,
  Target,
  Palette,
  Bell,
  ArrowLeft,
  User,
  Zap,
  Code2,
  Shield,
  MousePointer,
  Plug,
  Activity,
  ListTodo
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { Button } from '@/components/ui/button'
import { NavItem } from './NavItem'
import { NavSection } from './NavSection'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'

// Main navigation items (always visible)
const mainNavItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: LayoutDashboard
  },
]

// Audit overview section items
const auditOverviewItems = [
  { href: '/audits/[id]', icon: FileText, label: 'Podsumowanie' },
  { href: '/audits/[id]/seo', icon: Search, label: 'SEO' },
  { href: '/audits/[id]/performance', icon: Gauge, label: 'Wydajność' },
  { href: '/audits/[id]/ai-analysis', icon: Sparkles, label: 'Analiza AI' },
]

// Audit reports section items
const auditReportsItems = [
  { href: '/audits/[id]/comparison', icon: ArrowLeftRight, label: 'Porównanie', disabled: true },
  { href: '/audits/[id]/pdf', icon: FileDown, label: 'Raport PDF' },
  { href: '/audits/[id]/client-report', icon: FileText, label: 'Raport dla klienta', disabled: true },
  { href: '/audits/[id]/benchmark', icon: Target, label: 'Benchmark', disabled: true },
]

// Audit advanced section items
const auditAdvancedItems = [
  { href: '/audits/[id]/architecture', icon: Network, label: 'Architektura', disabled: true },
  { href: '/audits/[id]/competitors', icon: Users, label: 'Konkurencja' },
  { href: '/audits/[id]/debug', icon: Bug, label: 'Debug' },
]

// Audit tools section items
const auditToolsItems = [
  { href: '/audits/[id]/quick-wins', icon: Zap, label: 'Quick Wins', disabled: true },
  { href: '/audits/[id]/performance-tools', icon: Gauge, label: 'Performance', disabled: true },
  { href: '/audits/[id]/seo-tools', icon: Search, label: 'SEO', disabled: true },
  { href: '/audits/[id]/tech-stack', icon: Code2, label: 'Tech Stack', disabled: true },
  { href: '/audits/[id]/security', icon: Shield, label: 'Security', disabled: true },
  { href: '/audits/[id]/ai-content', icon: Sparkles, label: 'AI Content', disabled: true },
  { href: '/audits/[id]/ux-check', icon: MousePointer, label: 'UX Check', disabled: true },
  { href: '/audits/[id]/integrations', icon: Plug, label: 'Integracje', disabled: true },
]

// Settings items (inside collapsible section)
const settingsItems = [
  { href: '/settings/profile', icon: User, label: 'Profile' },
  { href: '/settings/team', icon: Users, label: 'Team' },
  { href: '/settings/billing', icon: CreditCard, label: 'Billing' },
  { href: '/settings/appearance', icon: Palette, label: 'Appearance' },
  { href: '/settings/notifications', icon: Bell, label: 'Notifications' },
]

export function UnifiedSidebar({ onAction }: { onAction?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()

  // Extract audit ID from current pathname
  const auditMatch = pathname.match(/\/audits\/([^\/]+)/)
  const currentAuditId = auditMatch?.[1]
  
  // Determine which sections should be expanded based on pathname
  const isInSettings = pathname.startsWith('/settings')
  const isInAudit = pathname.startsWith('/audits')
  const isAuditOverview = pathname === `/audits/${currentAuditId}`
  
  const [settingsOpen, setSettingsOpen] = React.useState(isInSettings)
  const [auditOpen, setAuditOpen] = React.useState(isInAudit)

  // Update expanded state when pathname changes
  React.useEffect(() => {
    setSettingsOpen(pathname.startsWith('/settings'))
    setAuditOpen(pathname.startsWith('/audits'))
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Helper to replace [id] placeholder with actual audit ID
  const replaceAuditId = (href: string) => {
    if (!currentAuditId) return href
    return href.replace('[id]', currentAuditId)
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-950">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b bg-gray-50/50 dark:bg-gray-900/50">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">SiteSpector</span>
        </Link>
      </div>

      {/* Workspace switcher */}
      <div className="p-3 border-b bg-gray-50/30 dark:bg-gray-900/30">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto scrollbar-hide">
        {/* Main Navigation */}
        <div className="space-y-0.5">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link key={item.name} href={item.href} onClick={onAction}>
                <Button
                  variant="ghost"
                  className={cn(
                    'group relative w-full justify-start font-normal hover:bg-accent/50 transition-all duration-200',
                    isActive && 'bg-primary/5 text-primary font-medium hover:bg-primary/10'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                  )}
                  <Icon className={cn(
                    "mr-3 h-4 w-4 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Audit Navigation - Only show when viewing an audit */}
        {currentAuditId && (
          <div className="space-y-4">
            <div className="px-3">
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border" />
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                  Aktualny audyt
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="mt-2 p-2 rounded-lg bg-accent/30 border border-border/50">
                <p className="text-xs font-medium truncate text-foreground/80">
                  {currentAuditId.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {/* Overview Section */}
              <NavSection
                title="Przegląd"
                icon={FileText}
                items={auditOverviewItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
                value="audit-overview"
                defaultOpen={true}
                variant="audit"
                onItemClick={onAction}
              />

              {/* Reports Section */}
              <NavSection
                title="Raporty"
                icon={FileDown}
                items={auditReportsItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
                value="audit-reports"
                variant="audit"
                onItemClick={onAction}
              />

              {/* Advanced Section */}
              <NavSection
                title="Zaawansowane"
                icon={Network}
                items={auditAdvancedItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
                value="audit-advanced"
                variant="audit"
                onItemClick={onAction}
              />

              {/* Tools Section */}
              <NavSection
                title="Narzędzia"
                icon={Zap}
                items={auditToolsItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
                value="audit-tools"
                variant="audit"
                onItemClick={onAction}
              />
            </div>

            {/* Back to audits link */}
            <div className="px-1">
              <Link href="/dashboard" onClick={onAction}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-xs text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
                  Wróć do listy audytów
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Settings Section - Collapsible */}
        <div className="space-y-1">
          <div className="px-3 flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-border" />
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
              System
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>
          <NavSection
            title="Ustawienia"
            icon={Settings}
            items={settingsItems}
            value="settings"
            defaultOpen={isInSettings}
            onOpenChange={setSettingsOpen}
            onItemClick={onAction}
          />
        </div>
      </nav>

      {/* User section */}
      <div className="border-t p-4 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="space-y-3">
          {currentWorkspace && (
            <div className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-border/50 shadow-sm">
              <p className="text-sm font-semibold truncate text-foreground">{currentWorkspace.name}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-0.5">
                {currentWorkspace.role}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200 group"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
