'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { projectsAPI, auditsAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatScore, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Loader2, BarChart3, Calendar, Users, Plus, ArrowRight } from 'lucide-react'
import { NewAuditDialog } from '@/components/NewAuditDialog'
import { useState } from 'react'

export default function ProjectDashboardPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [showNewAudit, setShowNewAudit] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId),
    enabled: !!projectId,
  })

  const { data: auditsData } = useQuery({
    queryKey: ['audits', project?.workspace_id, projectId],
    queryFn: () => auditsAPI.list(project!.workspace_id, projectId),
    enabled: !!project?.workspace_id,
  })

  const audits = auditsData?.items ?? []
  const latestAudit = audits[0]

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.url}</p>
        </div>
        <Button onClick={() => setShowNewAudit(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy audyt
        </Button>
      </div>

      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Audyty</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.stats?.audits_count ?? 0}</div>
            <Link href={`/projects/${projectId}/audits`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
              Zobacz listę <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ostatni wynik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.stats?.latest_audit_score != null
                ? formatScore(project.stats.latest_audit_score)
                : '—'}
            </div>
            {project.stats?.latest_audit_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(project.stats.latest_audit_at)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Harmonogram</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {project.stats?.schedule_active ? 'Aktywny' : 'Nieaktywny'}
            </div>
            <Link href={`/projects/${projectId}/schedule`} className="text-xs text-primary hover:underline mt-1 inline-block">
              Zarządzaj
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Zespół</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link href={`/projects/${projectId}/team`} className="text-sm text-primary hover:underline">
              Zarządzaj zespołem projektu
            </Link>
          </CardContent>
        </Card>
      </div>

      {latestAudit && (
        <Card>
          <CardHeader>
            <CardTitle>Ostatni audyt</CardTitle>
            <CardDescription>{latestAudit.url}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row items-center justify-between">
            <div className="flex gap-4">
              <span className="text-sm text-muted-foreground">
                Wynik: <strong>{formatScore(latestAudit.overall_score)}</strong>
              </span>
              <span className="text-sm text-muted-foreground">
                {latestAudit.completed_at ? formatDate(latestAudit.completed_at) : latestAudit.status}
              </span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/audits/${latestAudit.id}`}>Otwórz</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/projects/${projectId}/audits`}>Wszystkie audyty</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/projects/${projectId}/compare`}>Porównaj audyty</Link>
        </Button>
      </div>

      <NewAuditDialog
        open={showNewAudit}
        onOpenChange={setShowNewAudit}
        projectId={projectId}
        projectUrl={project.url}
        onSuccess={() => setShowNewAudit(false)}
      />
    </div>
  )
}
