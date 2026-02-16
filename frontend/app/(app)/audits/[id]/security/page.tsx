'use client'

/**
 * Security Analysis Page - 3-Phase System
 * 
 * Dane: Security metrics, SSL status, mixed content
 * Analiza: AI security insights
 * Plan: Actionable security tasks
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Shield, Lock, Unlock, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { toast } from 'sonner'
import type { Audit } from '@/lib/api'

export default function SecurityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mode, setMode] = useAuditMode('data')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  const { data: audit, isLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as Audit | undefined
      const isRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      return (isRunning || isAiRunning || isPlanRunning) ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'security'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'security' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const security = audit?.results?.security
  const aiContext = audit?.results?.ai_contexts?.security

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

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit || audit.status !== 'completed') {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony.</p>
      </div>
    )
  }

  if (!security) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych o bezpieczeństwie.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Bezpieczeństwa</h1>
      </div>

      <ModeSwitcher
        mode={mode}
        onModeChange={setMode}
        taskCount={tasks.length}
        pendingTaskCount={tasks.filter(t => t.status === 'pending').length}
        hasAiData={!!aiContext}
        hasExecutionPlan={audit?.execution_plan_status === 'completed'}
        isAiLoading={audit?.ai_status === 'processing'}
        isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
      />

      {mode === 'data' && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 @lg:grid-cols-3 gap-8">
            <div className="@lg:col-span-2 space-y-6">
                {/* Main Security Status */}
                <Card className={security.security_score >= 90 ? "border-green-200 bg-green-50/10" : "border-yellow-200 bg-yellow-50/10"}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle>Status Bezpieczeństwa</CardTitle>
                      <CardDescription>Ogólna ocena zabezpieczeń witryny</CardDescription>
                    </div>
                    <div className={`text-4xl font-bold ${security.security_score >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {security.security_score}/100
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-background border mt-4">
                      {security.is_https ? (
                        <div className="flex items-center gap-3 text-green-600">
                          <Lock className="h-6 w-6" />
                          <div>
                            <p className="font-bold">Połączenie szyfrowane (HTTPS)</p>
                            <p className="text-xs text-muted-foreground">Twoja strona używa certyfikatu SSL.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-red-600">
                          <Unlock className="h-6 w-6" />
                          <div>
                            <p className="font-bold">Brak szyfrowania (HTTP)</p>
                            <p className="text-xs text-muted-foreground">Strona przesyła dane otwartym tekstem!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Mixed Content Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Mixed Content
                    </CardTitle>
                    <CardDescription>Zasoby ładowane przez niezabezpieczony protokół HTTP na stronie HTTPS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {security.mixed_content_count > 0 ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                          <p className="text-sm font-bold text-red-600">Wykryto {security.mixed_content_count} elementów Mixed Content</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Niektóre obrazy, skrypty lub style są ładowane przez http:// zamiast https://. 
                            Może to powodować ostrzeżenia w przeglądarkach użytkowników.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">Brak problemów z Mixed Content.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Security Headers Checklist */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Nagłówki Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'HSTS', status: security.is_https },
                      { name: 'CSP', status: false },
                      { name: 'X-Frame-Options', status: true },
                      { name: 'X-Content-Type', status: true },
                    ].map((header, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="font-mono">{header.name}</span>
                        {header.status ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">OBECNY</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">BRAK</Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {security.recommendations && security.recommendations.length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Rekomendacje Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-xs space-y-3">
                        {security.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle>Surowe dane Security</CardTitle>
                <CardDescription>JSON dump danych zabezpieczeń</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                  {JSON.stringify(security, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="security"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="security"
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          executionPlanStatus={audit?.execution_plan_status ?? null}
          isGeneratingPlan={generatePlanMutation.isPending || audit?.execution_plan_status === 'processing'}
          onGeneratePlan={() => generatePlanMutation.mutate()}
        />
      )}
    </div>
  )
}
