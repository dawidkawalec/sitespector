'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  type LucideIcon,
  FileText,
  Search,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Globe2,
  Bot,
  Sparkles,
  Gauge,
  Wrench,
  MousePointer,
  Shield,
  Network,
  Zap,
  ArrowLeftRight,
  BarChart3,
  Users,
  FileDown,
  ScrollText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavSection } from './NavSection'
import { NavItem } from './NavItem'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { auditsAPI, projectsAPI } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AuditSidebarProps {
  auditId: string
  onNavigate?: () => void
  className?: string
}

interface SidebarGroup {
  title: string
  icon: LucideIcon
  value: string
  items: Array<{
    href: string
    icon: LucideIcon
    label: string
  }>
}

export function AuditSidebar({ auditId, onNavigate, className }: AuditSidebarProps) {
  const router = useRouter()
  const { currentWorkspace } = useWorkspace()

  const { data: currentAudit } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => auditsAPI.get(auditId),
    enabled: !!auditId,
    staleTime: 30_000,
  })

  const { data: project } = useQuery({
    queryKey: ['project', currentAudit?.project_id],
    queryFn: () => projectsAPI.get(currentAudit!.project_id!),
    enabled: !!currentAudit?.project_id,
    staleTime: 30_000,
  })

  const { data: auditsData } = useQuery({
    queryKey: ['audits', currentWorkspace?.id, currentAudit?.project_id],
    queryFn: () => auditsAPI.list(currentWorkspace!.id, currentAudit?.project_id ?? undefined),
    enabled: !!currentWorkspace?.id && !!currentAudit?.project_id,
    staleTime: 30_000,
  })

  const groups = useMemo<SidebarGroup[]>(
    () => [
      {
        title: 'SEO i Tresc',
        icon: Search,
        value: 'seo-content',
        items: [
          { href: `/audits/${auditId}/seo`, icon: Search, label: 'SEO' },
          { href: `/audits/${auditId}/content-quality`, icon: Sparkles, label: 'Content Quality' },
          { href: `/audits/${auditId}/schema`, icon: Code2, label: 'Schema.org' },
          { href: `/audits/${auditId}/links`, icon: LinkIcon, label: 'Linki' },
          { href: `/audits/${auditId}/images`, icon: ImageIcon, label: 'Obrazy' },
        ],
      },
      {
        title: 'Widocznosc i AI',
        icon: Globe2,
        value: 'visibility-ai',
        items: [
          { href: `/audits/${auditId}/visibility`, icon: Globe2, label: 'Widocznosc' },
          { href: `/audits/${auditId}/ai-overviews`, icon: Sparkles, label: 'AI Overviews' },
          { href: `/audits/${auditId}/ai-readiness`, icon: Bot, label: 'AI Readiness' },
        ],
      },
      {
        title: 'Technikalia',
        icon: Gauge,
        value: 'technical',
        items: [
          { href: `/audits/${auditId}/technical`, icon: Wrench, label: 'Technical SEO' },
          { href: `/audits/${auditId}/performance`, icon: Gauge, label: 'Wydajnosc' },
          { href: `/audits/${auditId}/ux-check`, icon: MousePointer, label: 'Uzytecznosc' },
          { href: `/audits/${auditId}/security`, icon: Shield, label: 'Bezpieczenstwo' },
          { href: `/audits/${auditId}/architecture`, icon: Network, label: 'Architektura' },
        ],
      },
      {
        title: 'Strategia',
        icon: Zap,
        value: 'strategy',
        items: [
          { href: `/audits/${auditId}/quick-wins`, icon: Zap, label: 'Quick Wins' },
          { href: `/audits/${auditId}/ai-strategy`, icon: Sparkles, label: 'Strategia AI' },
        ],
      },
      {
        title: 'Raporty',
        icon: ScrollText,
        value: 'reports',
        items: [
          { href: `/audits/${auditId}/comparison`, icon: ArrowLeftRight, label: 'Porownanie' },
          { href: `/audits/${auditId}/benchmark`, icon: BarChart3, label: 'Benchmark' },
          { href: `/audits/${auditId}/competitors`, icon: Users, label: 'Konkurencja' },
          { href: `/audits/${auditId}/pdf`, icon: FileDown, label: 'Raport PDF' },
          { href: `/audits/${auditId}/client-report`, icon: FileText, label: 'Raport klienta' },
        ],
      },
    ],
    [auditId]
  )

  const availableAudits = auditsData?.items ?? []

  const handleAuditChange = (value: string) => {
    router.push(`/audits/${value}`)
    onNavigate?.()
  }

  return (
    <aside
      className={cn(
        'flex h-full w-[292px] flex-col border-r border-stone-200/85 bg-gradient-to-b from-[#fff9f3] via-[#fffaf5] to-[#f8f1e8] text-stone-900 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-black dark:text-white',
        className
      )}
    >
      <div className="border-b border-stone-200/85 px-3 py-3.5 dark:border-white/10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 dark:text-white/45">Aktualny audyt</p>
        <div className="mt-2.5">
          <NavItem href={`/audits/${auditId}`} icon={FileText} label="Podsumowanie" onClick={onNavigate} />
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-3.5">
        {groups.map((group) => (
          <NavSection
            key={group.value}
            title={group.title}
            icon={group.icon}
            value={group.value}
            defaultOpen
            variant="audit"
            items={group.items}
            onItemClick={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-2.5 border-t border-stone-200/85 bg-amber-50/60 px-3 py-3.5 dark:border-white/10 dark:bg-black/10">
        {project && (
          <p className="truncate text-xs text-stone-600 dark:text-white/60">
            Projekt: <span className="text-stone-900 dark:text-white">{project.name}</span>
          </p>
        )}
        <Select value={auditId} onValueChange={handleAuditChange}>
          <SelectTrigger className="h-9 border-stone-200 bg-[#fffaf2] text-xs text-stone-800 transition-colors hover:bg-[#fff5e8] focus:ring-accent/40 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            <SelectValue placeholder="Wybierz audyt..." />
          </SelectTrigger>
          <SelectContent className="border-stone-200 bg-[#fffaf5] text-stone-900 dark:border-white/10 dark:bg-slate-900 dark:text-white">
            {availableAudits.length === 0 ? (
              <SelectItem value="empty" disabled>
                Brak audytow
              </SelectItem>
            ) : (
              availableAudits.map((audit) => (
                <SelectItem
                  key={audit.id}
                  value={audit.id}
                  className="focus:bg-amber-100/70 focus:text-stone-900 data-[state=checked]:text-accent dark:focus:bg-white/10 dark:focus:text-white"
                >
                  {new Date(audit.created_at).toLocaleDateString('pl-PL')}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </aside>
  )
}
