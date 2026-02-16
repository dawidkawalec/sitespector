'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsAPI, auditsAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Plus } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ProjectSchedulePage() {
  const params = useParams()
  const projectId = params.projectId as string
  const queryClient = useQueryClient()

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId),
    enabled: !!projectId,
  })

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', project?.workspace_id, projectId],
    queryFn: () => auditsAPI.listSchedules(project!.workspace_id, projectId),
    enabled: !!project?.workspace_id,
  })

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Harmonogram</h1>
        <p className="text-muted-foreground">Projekt: {project.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cykliczne audyty
          </CardTitle>
          <CardDescription>
            Ustaw powtarzające się audyty (np. co tydzień) dla {project.url}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedulesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Brak harmonogramów. Możesz dodać harmonogram w ustawieniach automatyzacji workspace
              i powiązać go z tym projektem, lub użyć API z project_id.
            </p>
          ) : (
            <ul className="space-y-2">
              {schedules.map((s: { id: string; url: string; frequency: string; is_active: boolean }) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm">{s.url}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.is_active ? 'default' : 'secondary'}>
                      {s.frequency}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
