'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, ListChecks, ArrowLeftRight, Calendar, Users, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavItem } from './NavItem'
import { projectsAPI } from '@/lib/api'
import { NewAuditDialog } from '@/components/NewAuditDialog'
import { Button } from '@/components/ui/button'

interface ProjectSidebarProps {
  projectId: string
  onNavigate?: () => void
  className?: string
}

export function ProjectSidebar({ projectId, onNavigate, className }: ProjectSidebarProps) {
  const [newAuditOpen, setNewAuditOpen] = useState(false)

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  return (
    <>
      <aside
        className={cn(
          'flex h-full w-[292px] flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-black dark:text-white',
          className
        )}
      >
        <div className="border-b border-slate-200/80 px-3 py-3.5 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/45">Projekt</p>
          <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-white">{project?.name ?? 'Projekt'}</p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3.5">
          <NavItem
            href={`/projects/${projectId}`}
            icon={LayoutDashboard}
            label="Przeglad projektu"
            onClick={onNavigate}
          />
          <NavItem href={`/projects/${projectId}/audits`} icon={ListChecks} label="Audyty" onClick={onNavigate} />
          <NavItem
            href={`/projects/${projectId}/compare`}
            icon={ArrowLeftRight}
            label="Porownanie"
            onClick={onNavigate}
          />
          <NavItem href={`/projects/${projectId}/schedule`} icon={Calendar} label="Harmonogram" onClick={onNavigate} />
          <NavItem href={`/projects/${projectId}/team`} icon={Users} label="Zespol" onClick={onNavigate} />
        </nav>

        <div className="border-t border-slate-200/80 bg-slate-100/60 px-3 py-3.5 dark:border-white/10 dark:bg-black/10">
          <Button
            type="button"
            onClick={() => setNewAuditOpen(true)}
            className="w-full justify-start gap-2 bg-accent/90 text-accent-foreground shadow-sm transition-all duration-200 hover:bg-accent hover:shadow-md hover:-translate-y-[1px] active:translate-y-0"
          >
            <Plus className="h-4 w-4" />
            Nowy audyt
          </Button>
        </div>
      </aside>

      <NewAuditDialog
        open={newAuditOpen}
        onOpenChange={setNewAuditOpen}
        projectId={projectId}
        projectUrl={project?.url ?? undefined}
      />
    </>
  )
}
