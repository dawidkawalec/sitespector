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
  User, 
  LayoutDashboard, 
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
  Zap, 
  Code2, 
  Shield, 
  MousePointer, 
  Plug, 
  Activity, 
  ListTodo, 
  Check,
  Calendar,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { Button } from '@/components/ui/button'
import { NavItem } from './NavItem'
import { NavSection } from './NavSection'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  { href: '/audits/[id]', icon: FileText, label: 'Podsumowanie', id: 'overview' },
  { href: '/audits/[id]/seo', icon: Search, label: 'SEO', id: 'seo' },
  { href: '/audits/[id]/performance', icon: Gauge, label: 'Wydajność', id: 'performance' },
  { href: '/audits/[id]/ai-analysis', icon: Sparkles, label: 'Analiza AI', id: 'ai' },
]

// Audit reports section items
const auditReportsItems = [
  { href: '/audits/[id]/comparison', icon: ArrowLeftRight, label: 'Porównanie', id: 'comparison' },
  { href: '/audits/[id]/pdf', icon: FileDown, label: 'Raport PDF', id: 'pdf' },
  { href: '/audits/[id]/client-report', icon: FileText, label: 'Raport dla klienta', id: 'client-report' },
  { href: '/audits/[id]/benchmark', icon: Target, label: 'Benchmark', id: 'benchmark' },
]

// Audit advanced section items
const auditAdvancedItems = [
  { href: '/audits/[id]/architecture', icon: Network, label: 'Architektura', id: 'architecture' },
  { href: '/audits/[id]/competitors', icon: Users, label: 'Konkurencja', id: 'competitors' },
  { href: '/audits/[id]/debug', icon: Bug, label: 'Debug', id: 'debug' },
]

// Audit tools section items
const auditToolsItems = [
  { href: '/audits/[id]/quick-wins', icon: Zap, label: 'Quick Wins', id: 'quick-wins' },
  { href: '/audits/[id]/images', icon: ImageIcon, label: 'Obrazy', id: 'images' },
  { href: '/audits/[id]/links', icon: LinkIcon, label: 'Linki', id: 'links' },
  { href: '/audits/[id]/security', icon: Shield, label: 'Security', id: 'security' },
  { href: '/audits/[id]/ai-content', icon: Sparkles, label: 'AI Content', id: 'ai-content' },
  { href: '/audits/[id]/ux-check', icon: MousePointer, label: 'UX Check', id: 'ux-check' },
  { href: '/audits/[id]/integrations', icon: Plug, label: 'Integracje', disabled: true, id: 'integrations' },
]

// Settings items (inside collapsible section)
const settingsItems = [
  { href: '/settings/profile', icon: User, label: 'Profile' },
  { href: '/settings/team', icon: Users, label: 'Team' },
  { href: '/settings/billing', icon: CreditCard, label: 'Billing' },
  { href: '/settings/schedules', icon: Calendar, label: 'Automatyzacja' },
  { href: '/settings/appearance', icon: Palette, label: 'Appearance' },
  { href: '/settings/notifications', icon: Bell, label: 'Notifications' },
]

export function UnifiedSidebar({ onAction }: { onAction?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()

  // Fetch audits for the select
  const { data: auditsData } = useQuery({
    queryKey: ['audits', currentWorkspace?.id],
    queryFn: () => auditsAPI.list(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id
  })

  const audits = auditsData?.items || []

  // Extract audit ID from current pathname
  const auditMatch = pathname.match(/\/audits\/([^\/]+)/)
  const currentAuditId = auditMatch?.[1]
  
  // Determine which sections should be expanded based on pathname
  const isInSettings = pathname.startsWith('/settings')
  const isInAudit = pathname.startsWith('/audits')
  
  const [settingsOpen, setSettingsOpen] = React.useState(isInSettings)

  // Update expanded state when pathname changes
  React.useEffect(() => {
    setSettingsOpen(pathname.startsWith('/settings'))
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAuditChange = (value: string) => {
    router.push(`/audits/${value}`)
    onAction?.()
  }

  // Helper to replace [id] placeholder with actual audit ID
  const replaceAuditId = (href: string) => {
    if (!currentAuditId) return '#'
    return href.replace('[id]', currentAuditId)
  }

  const isAuditDisabled = !currentAuditId

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-950">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b bg-gray-50/50 dark:bg-gray-900/50">
        <Link href="/dashboard" className="flex items-center gap-2 group" onClick={onAction}>
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

        {/* Audit Navigation - Always show */}
        <div className="space-y-4">
          <div className="px-3">
            <div className="flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-border" />
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                Aktualny audyt
              </p>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-2">
              <Select value={currentAuditId || ""} onValueChange={handleAuditChange}>
                <SelectTrigger className="w-full h-9 text-xs bg-accent/30 border-border/50">
                  <SelectValue placeholder="Wybierz audyt..." />
                </SelectTrigger>
                <SelectContent>
                  {audits.length === 0 ? (
                    <SelectItem value="none" disabled>Brak audytów</SelectItem>
                  ) : (
                    audits.map((audit) => (
                      <SelectItem key={audit.id} value={audit.id}>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[180px]">{audit.url}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(audit.created_at).toLocaleDateString()}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div key={currentAuditId || 'no-audit'} className={cn("space-y-1", isAuditDisabled && "opacity-50 pointer-events-none")}>
            <NavSection
              title="Przegląd"
              icon={FileText}
              items={auditOverviewItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
              value="audit-overview"
              defaultOpen={!isAuditDisabled}
              variant="audit"
              onItemClick={onAction}
              disabled={isAuditDisabled}
            />

            <NavSection
              title="Raporty"
              icon={FileDown}
              items={auditReportsItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
              value="audit-reports"
              variant="audit"
              onItemClick={onAction}
              disabled={isAuditDisabled}
            />

            <NavSection
              title="Zaawansowane"
              icon={Network}
              items={auditAdvancedItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
              value="audit-advanced"
              variant="audit"
              onItemClick={onAction}
              disabled={isAuditDisabled}
            />

            <NavSection
              title="Narzędzia"
              icon={Zap}
              items={auditToolsItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
              value="audit-tools"
              variant="audit"
              onItemClick={onAction}
              disabled={isAuditDisabled}
            />
          </div>

          {currentAuditId && (
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
          )}
        </div>

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
