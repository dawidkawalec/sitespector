'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI, type Audit } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { formatNumber } from '@/lib/utils'
import { Bot, CheckCircle2, AlertTriangle, XCircle, Loader2, FileText, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

type CheckStatus = 'pass' | 'warning' | 'fail'

function statusBadgeVariant(status: CheckStatus): 'default' | 'secondary' | 'destructive' {
  if (status === 'pass') return 'default'
  if (status === 'warning') return 'secondary'
  return 'destructive'
}

export default function AiReadinessPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mode, setMode] = useAuditMode('data')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
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
      return isRunning || isAiRunning || isPlanRunning ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'ai_readiness'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'ai_readiness' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.ai_readiness

  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      await refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (_error) {
      toast.error('Nie udalo sie zaktualizowac zadania')
    }
  }

  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      await refetchTasks()
      toast.success('Zapisano notatki')
    } catch (_error) {
      toast.error('Nie udalo sie zapisac notatek')
    }
  }

  const generatePlanMutation = useMutation({
    mutationFn: () => auditsAPI.runExecutionPlan(params.id),
    onSuccess: async () => {
      await refetchAudit()
      await refetchTasks()
      toast.success('Rozpoczeto generowanie planu wykonania')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Nie udalo sie uruchomic generowania planu')
    },
  })
  const recalculateContextMutation = useMutation({
    mutationFn: () => auditsAPI.runAiContext(params.id, 'ai_readiness'),
    onSuccess: async () => {
      await refetchAudit()
      toast.success('Rozpoczeto przeliczanie analizy AI Readiness')
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Nie udalo sie uruchomic przeliczania analizy')
    },
  })

  const aiReadiness = audit?.results?.crawl?.ai_readiness || {}
  const score = Number(aiReadiness?.score || 0)
  const status = aiReadiness?.status || 'not_ready'
  const checks = Array.isArray(aiReadiness?.checks) ? aiReadiness.checks : []
  const recommendations = Array.isArray(aiReadiness?.recommendations) ? aiReadiness.recommendations : []
  const llms = aiReadiness?.llms_txt || {}
  const citationBots = aiReadiness?.citation_bots || {}
  const trainingBots = aiReadiness?.training_bots || {}
  const components = aiReadiness?.components || {}

  const passCount = checks.filter((check: any) => check?.status === 'pass').length
  const warningCount = checks.filter((check: any) => check?.status === 'warning').length
  const failCount = checks.filter((check: any) => check?.status === 'fail').length

  const statusLabel = status === 'ready' ? 'Ready' : status === 'partial' ? 'Partial' : 'Not ready'

  const botRows: Array<{ category: string; state: string; bot: string }> = []
  for (const bot of citationBots?.allowed || []) botRows.push({ category: 'Citation', state: 'Allowed', bot })
  for (const bot of citationBots?.blocked || []) botRows.push({ category: 'Citation', state: 'Blocked', bot })
  for (const bot of citationBots?.unknown || []) botRows.push({ category: 'Citation', state: 'Unknown', bot })
  for (const bot of trainingBots?.allowed || []) botRows.push({ category: 'Training', state: 'Allowed', bot })
  for (const bot of trainingBots?.blocked || []) botRows.push({ category: 'Training', state: 'Blocked', bot })
  for (const bot of trainingBots?.unknown || []) botRows.push({ category: 'Training', state: 'Unknown', bot })

  const checkIcon = (checkStatus: CheckStatus) => {
    if (checkStatus === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (checkStatus === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie zostal znaleziony.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">AI Search Readiness</h1>
            <p className="text-sm text-muted-foreground">Ocena gotowosci domeny na widocznosc w AI search.</p>
          </div>
        </div>
        <Link href={`/audits/${params.id}/technical`}>
          <Button variant="outline" size="sm">
            Technical SEO <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <ModeSwitcher
        mode={mode}
        onModeChange={setMode}
        taskCount={tasks.length}
        pendingTaskCount={tasks.filter((t) => t.status === 'pending').length}
        hasAiData={!!aiContext}
        hasExecutionPlan={audit?.execution_plan_status === 'completed'}
        isAiLoading={audit?.ai_status === 'processing'}
        isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stan i szybkie akcje</CardTitle>
          <CardDescription>Najwazniejsze statusy modulu oraz rerun bez zmiany widoku.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 @lg:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded border bg-accent/5 px-3 py-2">
              <span className="text-muted-foreground">AI context</span>
              <Badge variant={aiContext ? 'default' : 'secondary'}>{aiContext ? 'Gotowy' : 'Brak'}</Badge>
            </div>
            <div className="flex items-center justify-between rounded border bg-accent/5 px-3 py-2">
              <span className="text-muted-foreground">Status AI pipeline</span>
              <Badge variant={audit?.ai_status === 'completed' ? 'default' : 'secondary'}>
                {audit?.ai_status || 'unknown'}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded border bg-accent/5 px-3 py-2">
              <span className="text-muted-foreground">Status execution plan</span>
              <Badge variant={audit?.execution_plan_status === 'completed' ? 'default' : 'secondary'}>
                {audit?.execution_plan_status || 'unknown'}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded border bg-accent/5 px-3 py-2">
              <span className="text-muted-foreground">Taski modułu</span>
              <strong>{formatNumber(tasks.length)}</strong>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => recalculateContextMutation.mutate()}
              disabled={recalculateContextMutation.isPending || audit?.ai_status === 'processing'}
            >
              {recalculateContextMutation.isPending ? 'Przeliczanie...' : 'Przelicz analize AI Readiness'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => generatePlanMutation.mutate()}
              disabled={generatePlanMutation.isPending || audit?.execution_plan_status === 'processing'}
            >
              {generatePlanMutation.isPending ? 'Generowanie...' : 'Wygeneruj plan zadan'}
            </Button>
            {audit?.project_id ? (
              <Link href={`/projects/${audit.project_id}`}>
                <Button variant="ghost" className="w-full">
                  Przejdz do projektu i uruchom nowy audyt (pelny rerun)
                </Button>
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {mode === 'data' && (
        <>
          <div className="grid grid-cols-1 @lg:grid-cols-4 gap-4">
            <Card className="@lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Score</CardTitle>
                <CardDescription>Composite 0-100</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{Math.round(score)}%</div>
                <Badge variant={score >= 75 ? 'default' : score >= 45 ? 'secondary' : 'destructive'} className="mt-2">
                  {statusLabel}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Checks</CardTitle>
                <CardDescription>Pass / Warning / Fail</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Pass: <strong className="text-green-700 dark:text-green-300">{formatNumber(passCount)}</strong></p>
                <p>Warning: <strong className="text-amber-700 dark:text-amber-300">{formatNumber(warningCount)}</strong></p>
                <p>Fail: <strong className="text-red-700 dark:text-red-300">{formatNumber(failCount)}</strong></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Citation Bots</CardTitle>
                <CardDescription>Traffic-driving crawlers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Allowed: <strong>{formatNumber(citationBots?.allowed?.length || 0)}</strong></p>
                <p>Blocked: <strong className="text-red-700 dark:text-red-300">{formatNumber(citationBots?.blocked?.length || 0)}</strong></p>
                <p>Unknown: <strong>{formatNumber(citationBots?.unknown?.length || 0)}</strong></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">llms.txt</CardTitle>
                <CardDescription>Manifest for LLM discovery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Exists: <strong>{llms?.exists ? 'Yes' : 'No'}</strong></p>
                <p>Valid: <strong>{llms?.valid ? 'Yes' : 'No'}</strong></p>
                <p>Sections: <strong>{formatNumber(llms?.sections || 0)}</strong></p>
                <p>Links: <strong>{formatNumber(llms?.links || 0)}</strong></p>
              </CardContent>
            </Card>
          </div>

          {checks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
                <CardDescription>Szczegolowe wyniki kontroli AI readiness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {checks.map((check: any, index: number) => {
                  const currentStatus = (check?.status || 'warning') as CheckStatus
                  return (
                    <div key={`${check?.name || 'check'}-${index}`} className="rounded border p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {checkIcon(currentStatus)}
                          <p className="font-semibold text-sm">{check?.name || 'Check'}</p>
                        </div>
                        <Badge variant={statusBadgeVariant(currentStatus)}>{currentStatus}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{check?.detail || 'Brak szczegolow.'}</p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Bot Configuration</CardTitle>
                <CardDescription>Training i citation bots wykryte w robots.txt</CardDescription>
              </CardHeader>
              <CardContent>
                <DataExplorerTable
                  data={botRows}
                  columns={[
                    { key: 'category', label: 'Category' },
                    { key: 'state', label: 'State' },
                    { key: 'bot', label: 'User-Agent', className: 'font-medium' },
                  ]}
                  pageSize={10}
                  exportFilename="ai_readiness_bots"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  llms.txt preview
                </CardTitle>
                <CardDescription>Pierwsze linie pliku /llms.txt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {llms?.preview ? (
                  <pre className="rounded border bg-muted/40 p-3 text-xs overflow-auto max-h-[320px] whitespace-pre-wrap">
                    {llms.preview}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Brak preview pliku.</p>
                )}
                {Array.isArray(llms?.issues) && llms.issues.length > 0 && (
                  <div className="rounded border border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 space-y-1">
                    {llms.issues.slice(0, 6).map((issue: string, idx: number) => (
                      <p key={`${issue}-${idx}`} className="text-xs">{issue}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Kroki podniesienia AI visibility readiness</CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    {recommendations.map((rec: string, idx: number) => (
                      <li key={`${rec}-${idx}`}>{rec}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">Brak rekomendacji - wynik wyglada dobrze.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Components</CardTitle>
                <CardDescription>Skladowe score AI readiness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(components).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm rounded border bg-accent/5 px-3 py-2">
                    <span className="text-muted-foreground">{key}</span>
                    <strong>{formatNumber(value as number)}</strong>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {mode === 'analysis' && (
        <AnalysisView area="ai_readiness" aiContext={aiContext} isLoading={audit?.ai_status === 'processing'} />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="ai_readiness"
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
