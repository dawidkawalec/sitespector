'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI, type Audit } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2, Shield, Wrench } from 'lucide-react'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/utils'

function IssuesList({ issues }: { issues: any[] }) {
  if (!issues || issues.length === 0) {
    return <p className="text-xs text-green-700 dark:text-green-300">Brak wykrytych problemow.</p>
  }

  return (
    <ul className="space-y-1.5">
      {issues.slice(0, 8).map((issue: any, idx: number) => (
        <li key={idx} className="text-xs flex items-start gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
          <span>{typeof issue === 'string' ? issue : JSON.stringify(issue)}</span>
        </li>
      ))}
    </ul>
  )
}

function RobotsPanel({ robots }: { robots: any }) {
  const userAgents = Object.entries(robots?.user_agents || {})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Robots.txt</CardTitle>
        <CardDescription>User agents, blokady i problemy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">User agents</p>
            <p className="text-xl font-bold">{formatNumber(userAgents.length)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Problemy</p>
            <p className="text-xl font-bold">{formatNumber((robots?.issues || []).length)}</p>
          </div>
        </div>

        {userAgents.length > 0 && (
          <div className="space-y-2">
            {userAgents.slice(0, 5).map(([name, rules]: [string, any]) => (
              <div key={name} className="p-2 rounded border text-xs">
                <p className="font-semibold">{name}</p>
                <p className="text-muted-foreground">
                  Disallow: {formatNumber((rules?.disallow || []).length)} | Allow: {formatNumber((rules?.allow || []).length)}
                </p>
              </div>
            ))}
          </div>
        )}

        <IssuesList issues={robots?.issues || []} />
      </CardContent>
    </Card>
  )
}

function SitemapPanel({ sitemap }: { sitemap: any }) {
  const mismatchRows = useMemo(() => {
    const rows: Array<{ url: string; source: string }> = []
    for (const item of sitemap?.in_sitemap_not_crawled || []) {
      rows.push({ url: typeof item === 'string' ? item : item?.url || String(item), source: 'W sitemap, niecrawlowane' })
    }
    for (const item of sitemap?.crawled_not_in_sitemap || []) {
      rows.push({ url: typeof item === 'string' ? item : item?.url || String(item), source: 'Crawlowane, poza sitemap' })
    }
    return rows
  }, [sitemap])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sitemap Analysis</CardTitle>
        <CardDescription>Coverage, stale entries i URL mismatches</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Coverage</p>
            <p className="text-xl font-bold">{Number(sitemap?.coverage_pct || 0).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Stale entries</p>
            <p className="text-xl font-bold">{formatNumber(sitemap?.stale_entries || 0)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Mismatches</p>
            <p className="text-xl font-bold">
              {formatNumber((sitemap?.in_sitemap_not_crawled_count || 0) + (sitemap?.crawled_not_in_sitemap_count || 0))}
            </p>
          </div>
        </div>

        {mismatchRows.length > 0 && (
          <DataExplorerTable
            data={mismatchRows}
            columns={[
              { key: 'url', label: 'URL', className: 'max-w-[420px]' },
              { key: 'source', label: 'Typ rozbieznosci' },
            ]}
            pageSize={8}
            exportFilename="technical_sitemap_mismatches"
          />
        )}
      </CardContent>
    </Card>
  )
}

function DomainConfigPanel({ domainConfig }: { domainConfig: any }) {
  const variantRows = useMemo(() => {
    return Object.entries(domainConfig?.variants || {}).map(([variant, details]: [string, any]) => ({
      variant,
      status_code: details?.status_code ?? '-',
      final_url: details?.final_url || details?.url || '-',
      redirect_hops: details?.redirect_hops ?? 0,
    }))
  }, [domainConfig])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Config</CardTitle>
        <CardDescription>4 warianty domeny, redirect chain i HTTPS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={domainConfig?.is_https ? 'default' : 'destructive'}>
            {domainConfig?.is_https ? 'HTTPS OK' : 'HTTPS missing'}
          </Badge>
          {domainConfig?.preferred_url && <Badge variant="outline">Preferred: {domainConfig.preferred_url}</Badge>}
        </div>

        {variantRows.length > 0 && (
          <DataExplorerTable
            data={variantRows}
            columns={[
              { key: 'variant', label: 'Wariant' },
              { key: 'status_code', label: 'Status' },
              { key: 'redirect_hops', label: 'Redirect hops' },
              { key: 'final_url', label: 'Final URL', className: 'max-w-[320px]' },
            ]}
            pageSize={8}
            exportFilename="technical_domain_variants"
          />
        )}

        <IssuesList issues={domainConfig?.issues || []} />
      </CardContent>
    </Card>
  )
}

function RenderNoJsPanel({ renderNoJs }: { renderNoJs: any }) {
  const score = Number(renderNoJs?.score || 0)
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Render Without JS</CardTitle>
        <CardDescription>Score, detekcja SPA i problemy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Score</p>
            <p className={`text-xl font-bold ${scoreColor}`}>{formatNumber(score)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Status</p>
            <p className="text-sm font-bold">{renderNoJs?.status || 'unknown'}</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Likely SPA</p>
            <p className="text-sm font-bold">{renderNoJs?.likely_spa_shell ? 'Tak' : 'Nie'}</p>
          </div>
        </div>

        <IssuesList issues={renderNoJs?.issues || []} />

        {(renderNoJs?.recommendations || []).length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Rekomendacje</p>
            <ul className="space-y-1">
              {(renderNoJs.recommendations || []).slice(0, 6).map((rec: string, idx: number) => (
                <li key={idx} className="text-xs flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Soft404Panel({ soft404 }: { soft404: any }) {
  const sampleRows = useMemo(() => {
    const rows: Array<{ type: string; url: string }> = []
    for (const item of soft404?.soft_404_samples || []) {
      rows.push({ type: 'Soft 404', url: typeof item === 'string' ? item : item?.url || String(item) })
    }
    for (const item of soft404?.low_content_samples || []) {
      rows.push({ type: 'Low content', url: typeof item === 'string' ? item : item?.url || String(item) })
    }
    return rows
  }, [soft404])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Soft 404 / Low Content</CardTitle>
        <CardDescription>County i probki URL-i problematycznych</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Soft 404</p>
            <p className="text-xl font-bold">{formatNumber(soft404?.soft_404_count || 0)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Low content</p>
            <p className="text-xl font-bold">{formatNumber(soft404?.low_content_count || 0)}</p>
          </div>
        </div>

        {sampleRows.length > 0 && (
          <DataExplorerTable
            data={sampleRows}
            columns={[
              { key: 'type', label: 'Typ' },
              { key: 'url', label: 'URL', className: 'max-w-[420px]' },
            ]}
            pageSize={8}
            exportFilename="technical_soft404_lowcontent"
          />
        )}

        <IssuesList issues={soft404?.issues || []} />
      </CardContent>
    </Card>
  )
}

function DirectivesPanel({ directives }: { directives: any }) {
  const directiveSamples = (directives?.directives_samples || []).map((entry: any) => ({
    url: entry?.url || '-',
    directives: entry?.directives || entry?.meta_robots || '-',
    x_robots: entry?.x_robots_tag || '-',
  }))
  const hreflangSamples = (directives?.hreflang_samples || []).map((entry: any) => ({
    url: entry?.url || '-',
    hreflang: entry?.hreflang || '-',
    valid: String(entry?.is_valid ?? '-'),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Directives / Hreflang</CardTitle>
        <CardDescription>County, probki i wykryte problemy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 @md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Noindex</p>
            <p className="text-lg font-bold">{formatNumber(directives?.noindex_count || 0)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Nofollow</p>
            <p className="text-lg font-bold">{formatNumber(directives?.nofollow_count || 0)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">X-Robots</p>
            <p className="text-lg font-bold">{formatNumber(directives?.x_robots_count || 0)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-accent/5">
            <p className="text-[11px] uppercase text-muted-foreground">Hreflang</p>
            <p className="text-lg font-bold">{formatNumber(directives?.hreflang_count || 0)}</p>
          </div>
        </div>

        {directiveSamples.length > 0 && (
          <DataExplorerTable
            data={directiveSamples}
            columns={[
              { key: 'url', label: 'URL', className: 'max-w-[300px]' },
              { key: 'directives', label: 'Directives' },
              { key: 'x_robots', label: 'X-Robots' },
            ]}
            pageSize={6}
            exportFilename="technical_directives_samples"
          />
        )}

        {hreflangSamples.length > 0 && (
          <DataExplorerTable
            data={hreflangSamples}
            columns={[
              { key: 'url', label: 'URL', className: 'max-w-[300px]' },
              { key: 'hreflang', label: 'Hreflang' },
              { key: 'valid', label: 'Valid' },
            ]}
            pageSize={6}
            exportFilename="technical_hreflang_samples"
          />
        )}

        <IssuesList issues={directives?.issues || []} />
      </CardContent>
    </Card>
  )
}

export default function TechnicalPage({ params }: { params: { id: string } }) {
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
      return (isRunning || isAiRunning || isPlanRunning) ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'seo'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'seo' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.seo

  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (error) {
      toast.error('Nie udalo sie zaktualizowac zadania')
    }
  }

  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      refetchTasks()
      toast.success('Zapisano notatki')
    } catch (error) {
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukonczony.</p>
      </div>
    )
  }

  const crawl = audit.results?.crawl
  if (!crawl) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Brak danych technicznych</h1>
        <p className="text-muted-foreground">Dane `results.crawl` nie sa dostepne dla tego audytu.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Wrench className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Technical SEO</h1>
          <p className="text-sm text-muted-foreground">
            Widok danych z `results.crawl`: robots, sitemap, domain config, no-JS render, soft 404, directives.
          </p>
        </div>
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

      {mode === 'data' && (
        <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
          <RobotsPanel robots={crawl.robots_txt || {}} />
          <SitemapPanel sitemap={crawl.sitemap_analysis || {}} />
          <DomainConfigPanel domainConfig={crawl.domain_config || {}} />
          <RenderNoJsPanel renderNoJs={crawl.render_nojs || {}} />
          <Soft404Panel soft404={crawl.soft_404 || {}} />
          <DirectivesPanel directives={crawl.directives_hreflang || {}} />
        </div>
      )}

      {mode === 'analysis' && (
        <AnalysisView area="seo" aiContext={aiContext} isLoading={audit?.ai_status === 'processing'} />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="seo"
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
