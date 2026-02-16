'use client'

/**
 * AI Overviews Page - 3-Phase System
 *
 * Dane: AIO metrics, keywords, competitors, charts
 * Analiza: AI insights from ai_contexts.ai_overviews
 * Plan: Actionable AI Overviews improvement tasks
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Users, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { formatNumber, formatScore } from '@/lib/utils'
import { IntentBadge } from '@/components/ui/intent-badge'
import { AIOCompetitorsChart, AIOPositionDistributionChart, IntentDistributionPieChart } from '@/components/AuditCharts'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { toast } from 'sonner'

export default function AiOverviewsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mode, setMode] = useAuditMode('data')
  const [activeTab, setActiveTab] = useState('keywords')

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
      const data = query?.state?.data as any
      const isRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      return (isRunning || isAiRunning || isPlanRunning) ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'ai_overviews'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'ai_overviews' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.ai_overviews

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

  const visibility = audit?.results?.senuto?.visibility || {}
  const aio = visibility?.ai_overviews
  const visibilityStats = visibility?.statistics?.statistics || {}

  const hasAioBlock = !!aio
  const stats = {
    ...(aio?.statistics || {}),
    aio_keywords_with_domain_count:
      (aio?.statistics?.aio_keywords_with_domain_count ?? visibilityStats?.aio_visible_keywords?.recent_value ?? 0),
    aio_keywords_count:
      (aio?.statistics?.aio_keywords_count ?? visibilityStats?.aio_keywords?.recent_value ?? 0),
    aio_avg_pos: aio?.statistics?.aio_avg_pos ?? null,
    aio_wins_count: aio?.statistics?.aio_wins_count ?? null,
    aio_losses_count: aio?.statistics?.aio_losses_count ?? null,
    aio_vis_loss_percentage: aio?.statistics?.aio_vis_loss_percentage ?? null,
  }

  const keywords = aio?.keywords || []
  const competitors = aio?.competitors || []

  const aioPositionDistribution = useMemo(() => {
    const dist: Record<string, number> = {}
    keywords.forEach((k: any) => {
      const pos = k?.best_aio_pos
      if (typeof pos === 'number' && pos > 0) {
        dist[String(pos)] = (dist[String(pos)] || 0) + 1
      }
    })
    return dist
  }, [keywords])

  const intentDistribution = useMemo(() => {
    const counter: Record<string, number> = {}
    keywords.forEach((k: any) => {
      const intent = k?.intentions?.main_intent || 'unknown'
      counter[intent] = (counter[intent] || 0) + 1
    })
    return Object.entries(counter).map(([name, value]) => ({ name, value }))
  }, [keywords])

  const fallbackRows = useMemo(() => {
    if (keywords.length > 0) return []
    const positions = visibility?.positions || []
    return positions.slice(0, 500).map((row: any) => ({
      keyword: row.keyword,
      searches: row?.statistics?.searches?.current || 0,
      organic_pos: row?.statistics?.position?.current || null,
      best_aio_pos: null,
      best_aio_url: null,
      intentions: row?.statistics?.intentions || {},
      aio_length: null,
      aio_domains_count: null,
    }))
  }, [keywords, visibility])

  const keywordColumns = [
    { key: 'keyword', label: 'Słowo kluczowe', className: 'font-medium max-w-[260px]', maxWidth: '260px' },
    { key: 'searches', label: 'Wyszukiwania', render: (v: any) => formatNumber(v || 0) },
    { key: 'organic_pos', label: 'Poz. organiczna' },
    { key: 'best_aio_pos', label: 'Poz. w AIO' },
    {
      key: 'intent',
      label: 'Intencja',
      sortable: false,
      render: (_: any, row: any) => (
        <IntentBadge
          intent={row?.intentions?.main_intent}
          stage={row?.intentions?.journey_stage}
        />
      ),
    },
    { key: 'aio_length', label: 'Długość AIO', render: (v: any) => formatNumber(v || 0) },
    { key: 'aio_domains_count', label: 'Liczba domen' },
    {
      key: 'best_aio_url',
      label: 'URL w AIO',
      className: 'max-w-[300px]',
      maxWidth: '300px',
      render: (v: any) => (
        <span className="text-xs text-muted-foreground truncate block">{v || '—'}</span>
      ),
    },
  ]

  const competitorsChartData = competitors.map((c: any) => ({
    domain: c.domain,
    common: c.aio_common_words || 0,
    exclusiveMe: c.aio_exclusive_to_me || 0,
    exclusiveCompetitor: c.aio_exclusive_to_competitor || 0,
  }))

  const competitorsColumns = [
    { key: 'domain', label: 'Domena', className: 'font-medium' },
    { key: 'aio_avg_position', label: 'Śr. pozycja AIO', render: (v: any) => formatScore(v || 0) },
    { key: 'all_aio_avg_position', label: 'Śr. pozycja ogółem', render: (v: any) => formatScore(v || 0) },
    { key: 'aio_common_words', label: 'Wspólne słowa', render: (v: any) => formatNumber(v || 0) },
    { key: 'aio_exclusive_to_me', label: 'Unikalne dla mnie', render: (v: any) => formatNumber(v || 0) },
    { key: 'aio_exclusive_to_competitor', label: 'Unikalne konkurenta', render: (v: any) => formatNumber(v || 0) },
  ]

  // Keep hooks ordering stable across all renders.
  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Overviews</h1>
          <p className="text-sm text-muted-foreground">Analiza obecności domeny w AI Overviews</p>
        </div>
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
        <div className="space-y-8">
        <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cytowania w AIO</CardDescription>
              <CardTitle className="text-3xl font-bold">{formatNumber(stats.aio_keywords_with_domain_count || 0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Śr. pozycja w AIO</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {stats.aio_avg_pos !== null && stats.aio_avg_pos !== undefined ? formatScore(stats.aio_avg_pos) : '—'}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Zyski / Straty</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {stats.aio_wins_count !== null && stats.aio_losses_count !== null
                  ? `${formatNumber(stats.aio_wins_count || 0)} / ${formatNumber(stats.aio_losses_count || 0)}`
                  : '—'}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <TrendingDown className="h-3 w-3 text-red-600" />
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Szacowana utrata ruchu</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {stats.aio_vis_loss_percentage !== null && stats.aio_vis_loss_percentage !== undefined
                  ? `${formatScore(stats.aio_vis_loss_percentage)}%`
                  : '—'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {!hasAioBlock && (
          <Card className="border-yellow-200 bg-yellow-50/30 dark:bg-yellow-950/10">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Ten audyt zawiera tylko metryki AIO ze statystyk Senuto (bez szczegółowej listy słów i konkurencji).
              Uruchom nowy audyt, aby pobrać pełny moduł AI Overviews.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Pozycje wejścia do AIO</CardTitle>
            </CardHeader>
            <CardContent>
              <AIOPositionDistributionChart data={aioPositionDistribution} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Rozkład intencji</CardTitle>
            </CardHeader>
            <CardContent>
              <IntentDistributionPieChart data={intentDistribution} />
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="keywords">Słowa kluczowe</TabsTrigger>
            <TabsTrigger value="competitors">Konkurencja</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="pt-6">
            <DataExplorerTable
              data={keywords.length > 0 ? keywords : fallbackRows}
              columns={keywordColumns}
              pageSize={20}
              exportFilename="aio_keywords"
            />
          </TabsContent>

          <TabsContent value="competitors" className="pt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Porównanie z konkurencją</CardTitle>
                <CardDescription>Wspólne i unikalne słowa AIO</CardDescription>
              </CardHeader>
              <CardContent>
                <AIOCompetitorsChart data={competitorsChartData} />
              </CardContent>
            </Card>
            <DataExplorerTable
              data={competitors}
              columns={competitorsColumns}
              pageSize={20}
              exportFilename="aio_competitors"
            />
          </TabsContent>
        </Tabs>
        </div>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="ai_overviews"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="ai_overviews"
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

