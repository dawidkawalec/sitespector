'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI, projectsAPI } from '@/lib/api'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { cn } from '@/lib/utils'

interface Crumb {
  label: string
  href?: string
}

const AUDIT_SECTION_LABELS: Record<string, string> = {
  seo: 'SEO',
  schema: 'Schema.org',
  performance: 'Wydajnosc',
  visibility: 'Widocznosc',
  'ai-overviews': 'AI Overviews',
  links: 'Linki',
  images: 'Obrazy',
  'ux-check': 'Uzytecznosc',
  security: 'Bezpieczenstwo',
  'ai-strategy': 'Strategia AI',
  'quick-wins': 'Quick Wins',
  comparison: 'Porownanie',
  benchmark: 'Benchmark',
  competitors: 'Konkurencja',
  architecture: 'Architektura',
  pdf: 'Raport PDF',
  'client-report': 'Raport klienta',
  debug: 'Debug',
  'ai-analysis': 'AI Analysis',
  'ai-content': 'AI Content',
  'crawl-data': 'Crawl data',
  'lighthouse-data': 'Lighthouse data',
}

const SETTINGS_LABELS: Record<string, string> = {
  profile: 'Profil',
  team: 'Zespol',
  billing: 'Platnosci',
  schedules: 'Automatyzacja',
  appearance: 'Wyglad',
  notifications: 'Powiadomienia',
  agents: 'Agenci czatu',
}

function formatAuditDate(date: string | null | undefined): string {
  if (!date) return 'Audyt'
  return new Date(date).toLocaleDateString('pl-PL')
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspace()

  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const projectId = projectMatch?.[1] ?? null
  const projectSubPath = pathname.split('/').slice(3)[0] ?? null

  const auditMatch = pathname.match(/^\/audits\/([^/]+)/)
  const auditId = auditMatch?.[1] ?? null
  const auditSubPath = pathname.split('/').slice(3)[0] ?? null

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const { data: audit } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => auditsAPI.get(auditId!),
    enabled: !!auditId,
    staleTime: 30_000,
  })

  const { data: auditProject } = useQuery({
    queryKey: ['project', audit?.project_id],
    queryFn: () => projectsAPI.get(audit!.project_id!),
    enabled: !!audit?.project_id && !!currentWorkspace?.id,
    staleTime: 30_000,
  })

  const crumbs = useMemo<Crumb[]>(() => {
    if (pathname === '/dashboard') {
      return [{ label: 'Dashboard' }]
    }

    if (pathname === '/projects') {
      return [{ label: 'Projekty' }]
    }

    if (projectId) {
      const items: Crumb[] = [
        { label: 'Projekty', href: '/projects' },
        { label: project?.name ?? 'Projekt', href: `/projects/${projectId}` },
      ]

      if (projectSubPath === 'audits') items.push({ label: 'Audyty' })
      if (projectSubPath === 'compare') items.push({ label: 'Porownanie' })
      if (projectSubPath === 'schedule') items.push({ label: 'Harmonogram' })
      if (projectSubPath === 'team') items.push({ label: 'Zespol' })
      return items
    }

    if (auditId) {
      const items: Crumb[] = []
      if (auditProject?.id) {
        items.push({
          label: auditProject.name,
          href: `/projects/${auditProject.id}`,
        })
      }
      items.push({
        label: formatAuditDate(audit?.created_at),
        href: `/audits/${auditId}`,
      })
      if (auditSubPath) {
        items.push({ label: AUDIT_SECTION_LABELS[auditSubPath] ?? 'Sekcja' })
      }
      return items
    }

    if (pathname.startsWith('/settings')) {
      const settingKey = pathname.split('/')[2]
      return [
        { label: 'Ustawienia', href: '/settings/profile' },
        { label: SETTINGS_LABELS[settingKey] ?? 'Sekcja' },
      ]
    }

    if (pathname.startsWith('/admin')) {
      return [{ label: 'Admin' }]
    }

    return [{ label: 'SiteSpector' }]
  }, [
    pathname,
    projectId,
    project?.name,
    projectSubPath,
    auditId,
    audit?.created_at,
    auditSubPath,
    auditProject?.id,
    auditProject?.name,
  ])

  return (
    <nav
      aria-label="Breadcrumbs"
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] px-2 py-1 text-sm',
        className
      )}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <div key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="truncate rounded px-1.5 py-0.5 font-medium text-muted-foreground transition-all duration-150 hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'truncate rounded px-1.5 py-0.5',
                  isLast ? 'font-semibold text-foreground bg-muted/55' : 'font-medium text-muted-foreground'
                )}
              >
                {crumb.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
