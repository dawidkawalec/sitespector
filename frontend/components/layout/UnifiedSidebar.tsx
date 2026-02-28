'use client'

/**
 * Unified Sidebar Navigation
 *
 * Structure:
 *  1. Logo + home arrow
 *  2. Workspace switcher
 *  3. Project search bar
 *  4. Main nav (Dashboard)
 *  5. Projects tree — each project expandable with recent audits
 *  6. Aktualny audyt sections (only when on /audits/* route)
 *  7. System / Settings
 *  8. User section
 */

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  User,
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
  ChevronRight,
  Globe,
  Share2,
  SearchIcon,
  BarChart3,
  ShieldCheck,
  ZapIcon,
  Globe2,
  FolderOpen,
  Folder,
  Plus,
  X,
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
  RiSparklingFill,
} from 'react-icons/ri'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NavItem } from './NavItem'
import { NavSection } from './NavSection'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { useChatStore } from '@/lib/chat-store'
import { useAdmin } from '@/lib/useAdmin'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI, projectsAPI } from '@/lib/api'
import type { Project, Audit } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { NewAuditDialog } from '@/components/NewAuditDialog'

// ─── Audit navigation sections ────────────────────────────────────────────────

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

const auditAiItems = [
  { href: '/audits/[id]/ai-strategy', icon: RiSparklingFill, label: 'Strategia i Roadmap', id: 'ai-strategy' },
  { href: '/audits/[id]/quick-wins', icon: Zap, label: 'Quick Wins', id: 'quick-wins' },
]

const auditReportsItems = [
  { href: '/audits/[id]/comparison', icon: ArrowLeftRight, label: 'Porównanie', id: 'comparison' },
  { href: '/audits/[id]/benchmark', icon: RiBarChartFill, label: 'Benchmark', id: 'benchmark' },
  { href: '/audits/[id]/competitors', icon: RiTeamFill, label: 'Konkurencja', id: 'competitors' },
  { href: '/audits/[id]/architecture', icon: Network, label: 'Architektura', id: 'architecture' },
  { href: '/audits/[id]/pdf', icon: FileDown, label: 'Raport PDF', id: 'pdf' },
  { href: '/audits/[id]/client-report', icon: RiFileTextFill, label: 'Raport dla klienta', id: 'client-report' },
  { href: '/audits/[id]/debug', icon: Bug, label: 'Debug', id: 'debug' },
]

const settingsItems = [
  { href: '/settings/profile', icon: User, label: 'Profil' },
  { href: '/settings/team', icon: RiTeamFill, label: 'Zespół' },
  { href: '/settings/billing', icon: CreditCard, label: 'Płatności' },
  { href: '/settings/schedules', icon: Calendar, label: 'Automatyzacja' },
  { href: '/settings/appearance', icon: Palette, label: 'Wygląd' },
  { href: '/settings/notifications', icon: Bell, label: 'Powiadomienia' },
  { href: '/settings/agents', icon: Sparkles, label: 'Agenci czatu' },
]

// ─── SystemStatus sub-component ───────────────────────────────────────────────

function SystemStatusSection({
  systemStatus,
  getStatusColor,
}: {
  systemStatus: any
  getStatusColor: (s: string) => string
}) {
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
          <div
            className={cn(
              'h-2 w-2 rounded-full animate-pulse',
              systemStatus ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <ChevronDown
            className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </div>
      </button>
      {isOpen && (
        <div className="mt-1 ml-4 border-l-2 border-white/10 pl-2 space-y-0.5 animate-in slide-in-from-top-2 fade-in duration-200">
          <TooltipProvider delayDuration={0}>
            {systemStatus?.services &&
              Object.entries(systemStatus.services).map(([name, data]: [string, any]) => (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors cursor-help">
                      <span className="text-xs font-medium capitalize text-white/60">
                        {name.replace('_', ' ')}
                      </span>
                      <div className={cn('h-2 w-2 rounded-full', getStatusColor(data.status))} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="text-[10px] p-2 bg-[#0b363d] border-white/10 text-white"
                  >
                    <div className="space-y-1">
                      <p className="font-bold capitalize">{name.replace('_', ' ')}</p>
                      <p>
                        Status: <span className="capitalize">{data.status}</span>
                      </p>
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

// ─── ProjectSidebarItem ────────────────────────────────────────────────────────

interface ProjectSidebarItemProps {
  project: Project
  isExpanded: boolean
  isActive: boolean
  currentAuditId: string | null
  workspaceId: string
  onToggle: () => void
  onAction?: () => void
  onNewAudit: (project: Project) => void
}

function ProjectSidebarItem({
  project,
  isExpanded,
  isActive,
  currentAuditId,
  workspaceId,
  onToggle,
  onAction,
  onNewAudit,
}: ProjectSidebarItemProps) {
  const { data: auditsData } = useQuery({
    queryKey: ['audits', workspaceId, project.id],
    queryFn: () => auditsAPI.list(workspaceId, project.id),
    enabled: isExpanded,
    staleTime: 30_000,
  })

  const recentAudits = (auditsData?.items ?? []).slice(0, 3)

  return (
    <div>
      {/* Project row */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group text-left',
          isActive
            ? 'bg-accent/15 text-accent'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-white/40 group-hover:text-white/70 transition-colors" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/40 group-hover:text-white/70 transition-colors" />
        )}
        <FolderOpen
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-colors',
            isActive ? 'text-accent' : 'text-white/50 group-hover:text-white'
          )}
        />
        <span className="flex-1 truncate text-sm">{project.name}</span>
        {project.stats?.audits_count != null && project.stats.audits_count > 0 && (
          <span className="text-[10px] text-white/30 font-medium tabular-nums">
            {project.stats.audits_count}
          </span>
        )}
      </button>

      {/* Expanded project content */}
      {isExpanded && (
        <div className="ml-5 pl-2 border-l border-white/10 mt-0.5 space-y-0.5 animate-in slide-in-from-top-1 fade-in duration-150">
          {/* Project overview link */}
          <Link href={`/projects/${project.id}`} onClick={onAction}>
            <div
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <BarChart3 className="h-3.5 w-3.5 flex-shrink-0" />
              <span>Przegląd projektu</span>
            </div>
          </Link>

          {/* Nowy audyt */}
          <button
            onClick={() => onNewAudit(project)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/60 hover:bg-accent/20 hover:text-accent transition-colors"
          >
            <Plus className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Nowy audyt</span>
          </button>

          {/* Recent audits */}
          {recentAudits.length > 0 ? (
            <>
              {recentAudits.map((audit) => (
                <Link key={audit.id} href={`/audits/${audit.id}`} onClick={onAction}>
                  <div
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors group/audit',
                      audit.id === currentAuditId
                        ? 'bg-accent/10 text-accent'
                        : 'text-white/50 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <FileText className="h-3 w-3 flex-shrink-0 opacity-60" />
                    <span className="flex-1 truncate">
                      {new Date(audit.created_at).toLocaleDateString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </span>
                    {audit.overall_score != null && (
                      <span
                        className={cn(
                          'tabular-nums text-[10px] font-bold',
                          audit.overall_score >= 70
                            ? 'text-green-400'
                            : audit.overall_score >= 50
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        )}
                      >
                        {Math.round(audit.overall_score)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {(auditsData?.total ?? 0) > 3 && (
                <Link href={`/projects/${project.id}/audits`} onClick={onAction}>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md text-xs text-white/30 hover:text-white/60 transition-colors">
                    <span>Wszystkie audyty ({auditsData?.total}) →</span>
                  </div>
                </Link>
              )}
            </>
          ) : (
            <div className="px-2 py-1 text-xs text-white/30 italic">Brak audytów</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main sidebar ──────────────────────────────────────────────────────────────

export function UnifiedSidebar({ onAction }: { onAction?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()
  const toggleChatPanel = useChatStore((s) => s.togglePanel)
  const { isSuperAdmin } = useAdmin()

  // Keyboard shortcut: Ctrl+Shift+C toggles chat
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

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: projectsData = [] } = useQuery({
    queryKey: ['projects', currentWorkspace?.id],
    queryFn: () => projectsAPI.list(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
    staleTime: 30_000,
  })

  // Fetch audits (for audit selector when in audit route)
  const { data: auditsData } = useQuery({
    queryKey: ['audits', currentWorkspace?.id],
    queryFn: () => auditsAPI.list(currentWorkspace!.id),
    enabled: !!currentWorkspace?.id,
    staleTime: 30_000,
  })

  const audits = auditsData?.items || []

  // System status
  const { data: systemStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { systemAPI } = await import('@/lib/api')
      return systemAPI.getStatus()
    },
    refetchInterval: 30_000,
  })

  // ── Route analysis ───────────────────────────────────────────────────────────
  const projectMatch = pathname.match(/\/projects\/([^\/]+)/)
  const currentProjectId = projectMatch?.[1]
  const auditMatch = pathname.match(/\/audits\/([^\/]+)/)
  const currentAuditId = auditMatch?.[1]
  const auditProjectId = currentAuditId
    ? audits.find((a) => a.id === currentAuditId)?.project_id ?? null
    : null

  const isInSettings = pathname.startsWith('/settings')
  const isInAudit = pathname.startsWith('/audits') && !!currentAuditId
  const isInProject = pathname.startsWith('/projects') && !!currentProjectId

  // ── Sidebar UI state ─────────────────────────────────────────────────────────
  const [projectSearch, setProjectSearch] = useState('')
  const [settingsOpen, setSettingsOpen] = React.useState(isInSettings)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // New audit dialog state (triggered from project tree)
  const [newAuditProject, setNewAuditProject] = useState<Project | null>(null)

  // Auto-expand active project
  useEffect(() => {
    if (currentProjectId) {
      setExpandedProjects((prev) => new Set([...prev, currentProjectId]))
    }
  }, [currentProjectId])

  useEffect(() => {
    if (auditProjectId) {
      setExpandedProjects((prev) => new Set([...prev, auditProjectId]))
    }
  }, [auditProjectId])

  useEffect(() => {
    setSettingsOpen(pathname.startsWith('/settings'))
  }, [pathname])

  // ── Filtered projects ────────────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    const q = projectSearch.toLowerCase().trim()
    if (!q) return projectsData
    return projectsData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.url ?? '').toLowerCase().includes(q)
    )
  }, [projectsData, projectSearch])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAuditChange = (value: string) => {
    router.push(`/audits/${value}`)
    onAction?.()
  }

  const replaceAuditId = (href: string) => {
    if (!currentAuditId) return '#'
    return href.replace('[id]', currentAuditId)
  }

  const isAuditDisabled = !currentAuditId

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'online': return 'bg-green-500'
      case 'offline': return 'bg-red-500'
      case 'error': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex h-screen w-64 flex-col border-r border-white/10 bg-gradient-to-b from-[#0b363d] to-[#001113] text-white">
        {/* Logo + home */}
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
                <a
                  href="/"
                  onClick={onAction}
                  className="flex items-center justify-center h-8 w-8 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                  aria-label="Strona główna"
                >
                  <ArrowLeft className="h-4 w-4" />
                </a>
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
        <nav className="flex-1 space-y-3 px-3 py-4 overflow-y-auto scrollbar-hide">

          {/* ── Dashboard ── */}
          <div className="space-y-0.5">
            <Link href="/dashboard" onClick={onAction}>
              <Button
                variant="ghost"
                className={cn(
                  'group relative w-full justify-start font-normal text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200',
                  pathname === '/dashboard' &&
                    'bg-accent/10 text-accent font-medium hover:bg-accent/20 hover:text-accent'
                )}
              >
                {pathname === '/dashboard' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
                )}
                <RiDashboardFill
                  className={cn(
                    'mr-3 h-4 w-4 transition-colors',
                    pathname === '/dashboard' ? 'text-accent' : 'text-white/50 group-hover:text-white'
                  )}
                />
                Dashboard
              </Button>
            </Link>
          </div>

          {/* ── PROJEKTY section ── */}
          <div className="space-y-1">
            <div className="px-3 flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Projekty</p>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Search bar */}
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              <input
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Szukaj projektu..."
                className="w-full bg-white/5 border border-white/10 rounded-md pl-8 pr-8 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-colors"
              />
              {projectSearch && (
                <button
                  onClick={() => setProjectSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Project list */}
            <div className="space-y-0.5">
              {filteredProjects.length === 0 && projectSearch ? (
                <p className="px-3 py-2 text-xs text-white/30 italic">Brak wyników</p>
              ) : filteredProjects.length === 0 ? (
                <div className="px-3 py-3 text-xs text-white/30 text-center space-y-2">
                  <p>Brak projektów</p>
                  <Link href="/projects" onClick={onAction} className="block text-accent hover:underline">
                    Utwórz pierwszy projekt →
                  </Link>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <ProjectSidebarItem
                    key={project.id}
                    project={project}
                    isExpanded={expandedProjects.has(project.id)}
                    isActive={
                      currentProjectId === project.id ||
                      auditProjectId === project.id
                    }
                    currentAuditId={currentAuditId}
                    workspaceId={currentWorkspace!.id}
                    onToggle={() =>
                      setExpandedProjects((prev) => {
                        const next = new Set(prev)
                        next.has(project.id) ? next.delete(project.id) : next.add(project.id)
                        return next
                      })
                    }
                    onAction={onAction}
                    onNewAudit={(p) => setNewAuditProject(p)}
                  />
                ))
              )}
            </div>

            {/* Nowy projekt CTA */}
            <Link href="/projects" onClick={onAction}>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-white/40 hover:text-accent hover:bg-accent/10 transition-colors border border-dashed border-white/10 hover:border-accent/30 mt-1">
                <Plus className="h-3.5 w-3.5" />
                <span>Nowy projekt</span>
              </button>
            </Link>
          </div>

          {/* ── AKTUALNY AUDYT — shown only when in /audits/* ── */}
          {isInAudit && (
            <div className="space-y-4">
              <div className="px-3">
                <div className="flex items-center gap-2 py-1">
                  <div className="h-px flex-1 bg-white/10" />
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    Aktualny audyt
                  </p>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                {/* Audit selector — shows audits from same project if available */}
                <div className="mt-2">
                  <Select value={currentAuditId || ''} onValueChange={handleAuditChange}>
                    <SelectTrigger className="w-full h-9 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/30">
                      <SelectValue placeholder="Wybierz audyt..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b363d] border-white/10 text-white">
                      {audits.length === 0 ? (
                        <SelectItem value="none" disabled>Brak audytów</SelectItem>
                      ) : (
                        audits
                          .filter((a) =>
                            auditProjectId ? a.project_id === auditProjectId : true
                          )
                          .map((audit) => (
                            <SelectItem
                              key={audit.id}
                              value={audit.id}
                              className="focus:bg-white/10 focus:text-white"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[180px]">{audit.url}</span>
                                <span className="text-[10px] text-white/50">
                                  {new Date(audit.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Audit nav sections */}
              <div
                key={currentAuditId || 'no-audit'}
                className={cn('space-y-1', isAuditDisabled && 'opacity-50 pointer-events-none')}
              >
                <NavSection
                  title="Dane audytu"
                  icon={FileText}
                  items={auditDataItems.map((i) => ({ ...i, href: replaceAuditId(i.href) }))}
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
                  items={auditAiItems.map((i) => ({ ...i, href: replaceAuditId(i.href) }))}
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
                  items={auditReportsItems.map((i) => ({ ...i, href: replaceAuditId(i.href) }))}
                  value="audit-reports"
                  variant="audit"
                  onItemClick={onAction}
                  disabled={isAuditDisabled}
                  className="text-white/70 hover:text-white"
                />
              </div>

              {/* Back to project */}
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
                  <Link
                    href={
                      auditProjectId ? `/projects/${auditProjectId}/audits` : '/dashboard'
                    }
                    onClick={onAction}
                  >
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
          )}

          {/* ── SYSTEM / Settings ── */}
          <div className="space-y-1">
            <div className="px-3 flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">System</p>
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
            <SystemStatusSection systemStatus={systemStatus} getStatusColor={getStatusColor} />
            {isSuperAdmin && (
              <Link href="/admin" onClick={onAction}>
                <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-400/80 hover:bg-white/10 hover:text-red-400">
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span>Panel Admina</span>
                </div>
              </Link>
            )}
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

      {/* New Audit Dialog (triggered from project tree) */}
      {newAuditProject && (
        <NewAuditDialog
          open={!!newAuditProject}
          onOpenChange={(open) => {
            if (!open) setNewAuditProject(null)
          }}
          projectId={newAuditProject.id}
          projectUrl={newAuditProject.url ?? undefined}
          onSuccess={() => setNewAuditProject(null)}
        />
      )}
    </>
  )
}
