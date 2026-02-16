'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { projectsAPI } from '@/lib/api'
import { useProject } from '@/lib/ProjectContext'
import { Loader2 } from 'lucide-react'

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const { setCurrentProject } = useProject()

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsAPI.get(projectId),
    enabled: !!projectId,
  })

  useEffect(() => {
    if (project) {
      setCurrentProject(project)
    }
    return () => setCurrentProject(null)
  }, [project, setCurrentProject])

  useEffect(() => {
    if (isError) {
      router.push('/projects')
    }
  }, [isError, router])

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
