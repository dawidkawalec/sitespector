'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { projectsAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatScore, getStatusBadgeVariant } from '@/lib/utils'
import Link from 'next/link'
import { Loader2, Plus } from 'lucide-react'
import { NewAuditDialog } from '@/components/NewAuditDialog'
import { useState } from 'react'

export default function ProjectAuditsPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [showNewAudit, setShowNewAudit] = useState(false)

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId),
    enabled: !!projectId,
  })

  const { data: auditsData, isLoading: auditsLoading } = useQuery({
    queryKey: ['audits', project?.workspace_id, projectId],
    queryFn: () => auditsAPI.list(project!.workspace_id, projectId),
    enabled: !!project?.workspace_id,
  })

  const audits = auditsData?.items ?? []

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Audyty — {project.name}</h1>
        <Button onClick={() => setShowNewAudit(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy audyt
        </Button>
      </div>

      {auditsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : audits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Brak audytów w tym projekcie. Utwórz pierwszy audyt.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-4">
          {audits.map((audit) => (
            <Link key={audit.id} href={`/audits/${audit.id}`}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium truncate flex-1">{audit.url}</p>
                    <Badge variant={getStatusBadgeVariant(audit.status)}>{audit.status}</Badge>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>Wynik: {formatScore(audit.overall_score)}</span>
                    <span>{formatDate(audit.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <NewAuditDialog
        open={showNewAudit}
        onOpenChange={setShowNewAudit}
        projectId={projectId}
        projectUrl={project.url}
      />
    </div>
  )
}
