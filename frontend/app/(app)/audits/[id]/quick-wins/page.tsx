'use client'

/**
 * Quick Wins Page - Task-based view
 * 
 * Shows all tasks where is_quick_win === true
 * Grouped by module, sorted by impact score
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Flame, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TaskListView } from '@/components/audit/TaskListView'
import { toast } from 'sonner'

export default function QuickWinsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setIsAuth(true)
      }
    }
    checkAuth()
  }, [router])

  // Fetch audit
  const { data: audit, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as any
      const isRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      return (isRunning || isAiRunning || isPlanRunning) ? 3000 : false
    },
  })

  // Fetch quick wins tasks
  const { data: tasksResponse, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'quick-wins'],
    queryFn: () => auditsAPI.getTasks(params.id, { is_quick_win: true }),
    enabled: isAuth && !!audit,
    refetchInterval: audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []

  // Task handlers
  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (error) {
      toast.error('Nie udało się zaktualizować zadania')
    }
  }

  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      refetchTasks()
      toast.success('Zapisano notatki')
    } catch (error) {
      toast.error('Nie udało się zapisać notatek')
    }
  }

  const generatePlanMutation = useMutation({
    mutationFn: () => auditsAPI.runExecutionPlan(params.id),
    onSuccess: async () => {
      await refetchAudit()
      await refetchTasks()
      toast.success('Rozpoczęto generowanie planu wykonania')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Nie udało się uruchomić generowania planu')
    },
  })

  if (!isAuth || auditLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Group tasks by module
  const tasksByModule = tasks.reduce((acc: Record<string, any[]>, task: any) => {
    if (!acc[task.module]) {
      acc[task.module] = []
    }
    acc[task.module].push(task)
    return acc
  }, {})

  const moduleNames: Record<string, string> = {
    seo: 'SEO',
    performance: 'Wydajność',
    visibility: 'Widoczność',
    ai_overviews: 'AI Overviews',
    links: 'Linki',
    images: 'Obrazy',
    ux: 'UX',
    security: 'Bezpieczeństwo'
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Quick Wins</h1>
              <p className="text-muted-foreground">Szybkie wygrane - łatwe do wdrożenia, duży wpływ</p>
            </div>
          </div>
        </div>

        {audit?.execution_plan_status !== 'completed' && (
          <Card className="border-orange-200 dark:border-orange-900 bg-orange-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {audit?.execution_plan_status === 'processing'
                      ? 'Generowanie planu wykonania...'
                      : 'Plan wykonania nie został wygenerowany'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {audit?.execution_plan_status === 'processing'
                      ? 'To może potrwać 1-3 minuty. Quick wins pojawią się automatycznie.'
                      : 'Wygeneruj plan, aby zobaczyć quick wins.'}
                  </p>
                </div>
                {audit?.execution_plan_status !== 'processing' && (
                  <Button
                    size="sm"
                    onClick={() => generatePlanMutation.mutate()}
                    disabled={generatePlanMutation.isPending}
                  >
                    {generatePlanMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generowanie...
                      </>
                    ) : (
                      'Wygeneruj plan'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="outline" className="text-base px-4 py-2 border-orange-500 bg-orange-500/10">
            <Flame className="w-4 h-4 mr-2" />
            {tasks.length} Quick Wins
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2">
            {tasks.filter((t: any) => t.status === 'pending').length} do zrobienia
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2 text-green-600 dark:text-green-400">
            {tasks.filter((t: any) => t.status === 'done').length} zrobione
          </Badge>
        </div>
      )}

      {/* Loading */}
      {tasksLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Tasks by Module */}
      {!tasksLoading && tasks.length > 0 && (
        <div className="space-y-8">
          {Object.entries(tasksByModule).map(([module, moduleTasks]) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  {moduleNames[module] || module}
                  <Badge variant="secondary">{moduleTasks.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Quick wins z modułu {moduleNames[module] || module}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaskListView
                  tasks={moduleTasks}
                  module={module}
                  onStatusChange={handleStatusChange}
                  onNotesChange={handleNotesChange}
                  showModuleFilter={false}
                  executionPlanStatus={audit?.execution_plan_status ?? null}
                  isGeneratingPlan={generatePlanMutation.isPending || audit?.execution_plan_status === 'processing'}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!tasksLoading && tasks.length === 0 && audit?.execution_plan_status === 'completed' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak quick wins</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Nie znaleziono zadań spełniających kryteria quick wins (wysoki wpływ + łatwa realizacja).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
