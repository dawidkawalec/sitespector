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
  Link as LinkIcon,
  Activity as ActivityIcon,
  ChevronDown,
  ChevronUp,
  Globe,
  Share2,
  SearchIcon,
  BarChart3,
  ShieldCheck,
  ZapIcon,
  Globe2
} from 'lucide-react'
import { 
  RiSearchEyeFill, 
  RiDashboardFill, 
  RiSettings4Fill, 
  RiTeamFill, 
  RiShieldFlashFill,
  RiFileTextFill,
  RiPieChartFill,
  RiBarChartFill,
  RiGlobalFill,
  RiLogoutBoxRFill,
  RiSparklingFill
} from 'react-icons/ri'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { Button } from '@/components/ui/button'
import { NavItem } from './NavItem'
import { NavSection } from './NavSection'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useChatStore } from '@/lib/chat-store'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI, systemAPI } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Main navigation items (always visible)
const mainNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: RiDashboardFill },
  { name: 'Projekty', href: '/projects', icon: BarChart3 },
]

// DANE AUDYTU section
const auditDataItems = [
  { href: '/audits/[id]', icon: RiFileTextFill, label: 'Podsumowanie', id: 'overview' },
  { href: '/audits/[id]/seo', icon: RiSearchEyeFill, label: 'SEO', id: 'seo' },
  { href: '/audits/[id]/performance', icon: RiShieldFlashFill, label: 'Wydajność', id: 'performance' },
  { href: '/audits/[id]/visibility', icon: Globe2, label: 'Widoczność', id: 'visibility' },
  { href: '/audits/[id]/ai-overviews', icon: Sparkles, label: 'AI Overviews', id: 'ai-overviews' },
  { href: '/audits/[id]/links', icon: LinkIcon, label: 'Linki', id: 'links' },
  { href: '/audits/[id]/images', icon: ImageIcon, label: 'Obrazy', id: 'images' },
  { href: '/audits/[id]/ux-check', icon: MousePointer, label: 'Użyteczność', id: 'ux-check' },
  { href: '/audits/[id]/security', icon: Shield, label: 'Bezpieczeństwo', id: 'security' },
]

// STRATEGIA AI section
const auditAiItems = [
  { href: '/audits/[id]/ai-strategy', icon: RiSparklingFill, label: 'Strategia i Roadmap', id: 'ai-strategy' },
  { href: '/audits/[id]/quick-wins', icon: Zap, label: 'Quick Wins', id: 'quick-wins' },
]

// RAPORTY section
const auditReportsItems = [
  { href: '/audits/[id]/comparison', icon: ArrowLeftRight, label: 'Porównanie', id: 'comparison' },
  { href: '/audits/[id]/benchmark', icon: RiBarChartFill, label: 'Benchmark', id: 'benchmark' },
  { href: '/audits/[id]/competitors', icon: RiTeamFill, label: 'Konkurencja', id: 'competitors' },
  { href: '/audits/[id]/architecture', icon: Network, label: 'Architektura', id: 'architecture' },
  { href: '/audits/[id]/pdf', icon: FileDown, label: 'Raport PDF', id: 'pdf' },
  { href: '/audits/[id]/client-report', icon: RiFileTextFill, label: 'Raport dla klienta', id: 'client-report' },
  { href: '/audits/[id]/debug', icon: Bug, label: 'Debug', id: 'debug' },
]

// Settings items (inside collapsible section)
const settingsItems = [
  { href: '/settings/profile', icon: User, label: 'Profil' },
  { href: '/settings/team', icon: RiTeamFill, label: 'Zespół' },
  { href: '/settings/billing', icon: CreditCard, label: 'Płatności' },
  { href: '/settings/schedules', icon: Calendar, label: 'Automatyzacja' },
  { href: '/settings/appearance', icon: Palette, label: 'Wygląd' },
  { href: '/settings/notifications', icon: Bell, label: 'Powiadomienia' },
  { href: '/settings/agents', icon: Sparkles, label: 'Agenci czatu' },
]

// Audit tools section items (deprecated/internal)
const auditToolsItems = [
  { href: '/audits/[id]/quick-wins', icon: Zap, label: 'Quick Wins', id: 'quick-wins' },
  { href: '/audits/[id]/links', icon: LinkIcon, label: 'Linki', id: 'links' },
  { href: '/audits/[id]/images', icon: ImageIcon, label: 'Obrazy', id: 'images' },
]

function SystemStatusSection({ systemStatus, getStatusColor }: { systemStatus: any, getStatusColor: (status: string) => string }) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-white/70 hover:bg-white/10 hover:text-white',
          isOpen && 'bg-white/10 text-white'
        )}
      >
        <ActivityIcon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">System Status</span>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            systemStatus ? "bg-green-500" : "bg-gray-400"
          )} />
          <ChevronDown className={cn(
            'h-4 w-4 transition-transform duration-200',
            isOpen && 'rotate-180'
          )} />
        </div>
      </button>
      {isOpen && (
        <div className="mt-1 ml-4 border-l-2 border-white/10 pl-2 space-y-0.5 animate-in slide-in-from-top-2 fade-in duration-200">
          <TooltipProvider delayDuration={0}>
            {systemStatus?.services && Object.entries(systemStatus.services).map(([name, data]: [string, any]) => (
              <Tooltip key={name}>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors cursor-help">
                    <span className="text-xs font-medium capitalize text-white/60">
                      {name.replace('_', ' ')}
                    </span>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      getStatusColor(data.status)
                    )} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[10px] p-2 bg-[#0b363d] border-white/10 text-white">
                  <div className="space-y-1">
                    <p className="font-bold capitalize">{name.replace('_', ' ')}</p>
                    <p>Status: <span className="capitalize">{data.status}</span></p>
                    {data.version && <p>Version: {data.version}</p>}
                    {data.error && <p className="text-red-500">Error: {data.error}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}

export function UnifiedSidebar({ onAction }: { onAction?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const toggleChatPanel = useChatStore((s) => s.togglePanel)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTyping =
        tag === 'input' || tag === 'textarea' || Boolean(target?.getAttribute?.('contenteditable'))
      if (isTyping) return

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        toggleChatPanel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleChatPanel])

  // Fetch audits for the select
  const { data: auditsData } = useQuery({
    queryKey: ['audits', currentWorkspace?.id],
    queryFn: () => auditsAPI.list(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id
  })

  const audits = auditsData?.items || []

  // Project path (ID from URL is enough for nav links)
  const projectMatch = pathname.match(/\/projects\/([^\/]+)/)
  const currentProjectId = projectMatch?.[1]

  // Extract audit ID from current pathname
  const auditMatch = pathname.match(/\/audits\/([^\/]+)/)
  const currentAuditId = auditMatch?.[1]
  const auditProjectId = currentAuditId
    ? audits.find((a) => a.id === currentAuditId)?.project_id
    : null

  // Determine which sections should be expanded based on pathname
  const isInSettings = pathname.startsWith('/settings')
  const isInAudit = pathname.startsWith('/audits')
  const isInProject = pathname.startsWith('/projects') && currentProjectId
  
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

  // System status query
  const { data: systemStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => systemAPI.getStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'error': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0b363d] to-[#001113] text-white">
      {/* Logo + Strona główna */}
      <div className="flex h-16 items-center justify-between gap-2 px-4 border-b border-white/10 bg-black/10">
        <Link href="/dashboard" className="flex items-center gap-2 group shrink-0 min-w-0" onClick={onAction}>
          <div className="p-1.5 rounded-lg bg-accent/20 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300 shrink-0">
            <RiSearchEyeFill className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white truncate">SiteSpector</span>
        </Link>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                onClick={onAction}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                aria-label="Strona główna"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#0b363d] border-white/10">
              <p>Strona główna</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Workspace switcher */}
      <div className="p-3 border-b border-white/10 bg-black/5">
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
                    'group relative w-full justify-start font-normal text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200',
                    isActive && 'bg-accent/10 text-accent font-medium hover:bg-accent/20 hover:text-accent'
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
                  )}
                  <Icon className={cn(
                    "mr-3 h-4 w-4 transition-colors",
                    isActive ? "text-accent" : "text-white/50 group-hover:text-white"
                  )} />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Project sub-navigation when inside a project */}
        {isInProject && currentProjectId && (
          <div className="space-y-1">
            <div className="px-3 flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                Projekt
              </p>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="px-1 space-y-0.5">
              <Link href={`/projects/${currentProjectId}`} onClick={onAction}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-white/70 hover:bg-white/10 hover:text-white',
                    pathname === `/projects/${currentProjectId}` && 'bg-accent/10 text-accent'
                  )}
                >
                  <BarChart3 className="mr-3 h-4 w-4" />
                  Przegląd
                </Button>
              </Link>
              <Link href={`/projects/${currentProjectId}/audits`} onClick={onAction}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-white/70 hover:bg-white/10 hover:text-white',
                    pathname === `/projects/${currentProjectId}/audits` && 'bg-accent/10 text-accent'
                  )}
                >
                  <FileText className="mr-3 h-4 w-4" />
                  Audyty
                </Button>
              </Link>
              <Link href={`/projects/${currentProjectId}/compare`} onClick={onAction}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-white/70 hover:bg-white/10 hover:text-white',
                    pathname === `/projects/${currentProjectId}/compare` && 'bg-accent/10 text-accent'
                  )}
                >
                  <ArrowLeftRight className="mr-3 h-4 w-4" />
                  Porównanie
                </Button>
              </Link>
              <Link href={`/projects/${currentProjectId}/schedule`} onClick={onAction}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-white/70 hover:bg-white/10 hover:text-white',
                    pathname === `/projects/${currentProjectId}/schedule` && 'bg-accent/10 text-accent'
                  )}
                >
                  <Calendar className="mr-3 h-4 w-4" />
                  Harmonogram
                </Button>
              </Link>
              <Link href={`/projects/${currentProjectId}/team`} onClick={onAction}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-white/70 hover:bg-white/10 hover:text-white',
                    pathname === `/projects/${currentProjectId}/team` && 'bg-accent/10 text-accent'
                  )}
                >
                  <Users className="mr-3 h-4 w-4" />
                  Zespół
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Audit Navigation - Always show */}
        <div className="space-y-4">
          <div className="px-3">
            <div className="flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                Aktualny audyt
              </p>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="mt-2">
              <Select value={currentAuditId || ""} onValueChange={handleAuditChange}>
                <SelectTrigger className="w-full h-9 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30">
                  <SelectValue placeholder="Wybierz audyt..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0b363d] border-white/10 text-white">
                  {audits.length === 0 ? (
                    <SelectItem value="none" disabled>Brak audytów</SelectItem>
                  ) : (
                    audits.map((audit) => (
                      <SelectItem key={audit.id} value={audit.id} className="focus:bg-white/10 focus:text-white">
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[180px]">{audit.url}</span>
                          <span className="text-[10px] text-white/50">{new Date(audit.created_at).toLocaleDateString()}</span>
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
              title="Dane audytu"
              icon={FileText}
              items={auditDataItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
              value="audit-data"
              defaultOpen={!isAuditDisabled}
              variant="audit"
              onItemClick={onAction}
              disabled={isAuditDisabled}
              className="text-white/70 hover:text-white"
            />

            <NavSection
              title="Strategia AI"
              icon={Sparkles}
              items={auditAiItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
              value="audit-ai"
              defaultOpen={!isAuditDisabled}
              variant="audit"
              onItemClick={onAction}
              disabled={isAuditDisabled}
              className="text-white/70 hover:text-white"
            />

            <NavSection
              title="Raporty"
              icon={FileDown}
              items={auditReportsItems.map(i => ({ ...i, href: replaceAuditId(i.href) }))}
              value="audit-reports"
              variant="audit"
              onItemClick={onAction}
              disabled={isAuditDisabled}
              className="text-white/70 hover:text-white"
            />
          </div>

          {currentAuditId && (
            <div className="px-1 space-y-0.5">
              {auditProjectId && (
                <Link href={`/projects/${auditProjectId}`} onClick={onAction}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors group"
                  >
                    <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
                    Wróć do projektu
                  </Button>
                </Link>
              )}
              <Link href={auditProjectId ? `/projects/${auditProjectId}/audits` : '/dashboard'} onClick={onAction}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs text-white/50 hover:text-white hover:bg-white/5 transition-colors group"
                >
                  <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
                  {auditProjectId ? 'Lista audytów projektu' : 'Wróć do listy audytów'}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Settings Section - Collapsible */}
        <div className="space-y-1">
          <div className="px-3 flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-white/10" />
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
              System
            </p>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <NavSection
            title="Ustawienia"
            icon={Settings}
            items={settingsItems}
            value="settings"
            defaultOpen={isInSettings}
            onOpenChange={setSettingsOpen}
            onItemClick={onAction}
            className="text-white/70 hover:text-white"
          />

          {/* System Status - matching NavSection style */}
          <SystemStatusSection systemStatus={systemStatus} getStatusColor={getStatusColor} />
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-4 bg-black/10">
        <div className="space-y-3">
          {currentWorkspace && (
            <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 shadow-sm">
              <p className="text-sm font-semibold truncate text-white">{currentWorkspace.name}</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-0.5">
                {currentWorkspace.role}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-white/50 hover:text-accent hover:bg-accent/10 transition-all duration-200 group"
            onClick={handleLogout}
          >
            <RiLogoutBoxRFill className="mr-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
            Wyloguj się
          </Button>
        </div>
      </div>
    </div>
  )
}
