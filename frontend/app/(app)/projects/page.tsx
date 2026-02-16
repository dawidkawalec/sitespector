'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { projectsAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { formatScore } from '@/lib/utils'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'

export default function ProjectsListPage() {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspace()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
    }
    checkAuth()
  }, [router])

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects', currentWorkspace?.id],
    queryFn: () => projectsAPI.list(currentWorkspace!.id),
    enabled: isAuth && !!currentWorkspace,
  })

  if (!isAuth) return null
  if (isWorkspaceLoading || !currentWorkspace) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projekty</h1>
          <p className="text-muted-foreground">
            Strony i audyty w workspace &quot;{currentWorkspace.name}&quot;
          </p>
        </div>
        <Button onClick={() => setShowCreateProject(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nowy projekt
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">Brak projektów</CardTitle>
            <CardDescription className="mb-4 max-w-sm">
              Utwórz projekt dla strony (np. domena.pl), aby grupować audyty i harmonogramy.
            </CardDescription>
            <Button onClick={() => setShowCreateProject(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Utwórz pierwszy projekt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                  <CardDescription className="truncate">{project.url}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{project.stats?.audits_count ?? 0} audytów</span>
                    {project.stats?.latest_audit_score != null && (
                      <span className="font-medium text-foreground">
                        Ostatni: {formatScore(project.stats.latest_audit_score)}
                      </span>
                    )}
                  </div>
                  {project.stats?.schedule_active && (
                    <p className="text-xs text-muted-foreground mt-1">Harmonogram aktywny</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={showCreateProject}
        onOpenChange={setShowCreateProject}
        onSuccess={() => {
          refetch()
          setShowCreateProject(false)
        }}
      />
    </div>
  )
}
