'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { projectsAPI, auditsAPI } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatScore } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export default function ProjectComparePage() {
  const params = useParams()
  const projectId = params.projectId as string

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

  const audits = (auditsData?.items ?? []).filter((a) => a.status === 'completed')

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
        <h1 className="text-2xl font-bold">Porównanie audytów</h1>
        <p className="text-muted-foreground">Projekt: {project.name}</p>
      </div>

      {auditsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : audits.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Potrzebujesz co najmniej dwóch ukończonych audytów, aby je porównać.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Data / URL</th>
                <th className="text-right p-2">Ogólny</th>
                <th className="text-right p-2">SEO</th>
                <th className="text-right p-2">Wydajność</th>
                <th className="text-right p-2">Treść</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id} className="border-b">
                  <td className="p-2">
                    <span className="text-muted-foreground text-sm">{audit.created_at.slice(0, 10)}</span>
                    <br />
                    <span className="text-sm truncate max-w-[200px] block">{audit.url}</span>
                  </td>
                  <td className="text-right p-2 font-medium">{formatScore(audit.overall_score)}</td>
                  <td className="text-right p-2">{formatScore(audit.seo_score)}</td>
                  <td className="text-right p-2">{formatScore(audit.performance_score)}</td>
                  <td className="text-right p-2">{formatScore(audit.content_score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
