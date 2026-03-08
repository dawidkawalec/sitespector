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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { formatNumber } from '@/lib/utils'
import { Loader2, Sparkles, ChevronRight, Download } from 'lucide-react'
import { toast } from 'sonner'

function issueLabel(issue: string): string {
  const labels: Record<string, string> = {
    thin_content: 'Thin content',
    very_long_content: 'Bardzo dluga tresc',
    low_text_ratio: 'Niski text ratio',
    missing_title: 'Brak title',
    title_length_out_of_range: 'Title poza zakresem',
    missing_meta_description: 'Brak meta description',
    meta_length_out_of_range: 'Meta poza zakresem',
    missing_h1: 'Brak H1',
    multiple_h1: 'Wiele H1',
    orphan_page: 'Orphan pages',
    deep_page: 'Duza glebokosc',
    hard_to_read: 'Niska czytelnosc',
    duplicate_title: 'Duplikaty title',
    duplicate_meta_description: 'Duplikaty meta',
    duplicate_h1: 'Duplikaty H1',
  }
  return labels[issue] || issue
}

function gradeBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 80) return 'default'
  if (score >= 60) return 'secondary'
  return 'destructive'
}

type DuplicateGroup = {
  value: string
  count: number
  urls: string[]
}

function buildDuplicateGroups(
  pages: any[],
  valueKey: string,
  occurrencesKey: string
): DuplicateGroup[] {
  const groups = new Map<string, Set<string>>()
  for (const page of pages) {
    const occurrences = Number(page?.[occurrencesKey] || 0)
    if (occurrences <= 1) continue
    const value = String(page?.[valueKey] || '').trim()
    const url = String(page?.url || '').trim()
    if (!value || !url) continue
    if (!groups.has(value)) groups.set(value, new Set<string>())
    groups.get(value)?.add(url)
  }

  return Array.from(groups.entries())
    .map(([value, urls]) => ({
      value,
      count: urls.size,
      urls: Array.from(urls).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

function toCsv(groups: DuplicateGroup[], kind: string): string {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`
  const rows = ['type,value,count,urls']
  for (const group of groups) {
    rows.push([
      escape(kind),
      escape(group.value),
      String(group.count),
      escape(group.urls.join(' | ')),
    ].join(','))
  }
  return rows.join('\n')
}

function downloadCsv(filename: string, groups: DuplicateGroup[], kind: string) {
  const csv = toCsv(groups, kind)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ContentQualityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [gradeFilter, setGradeFilter] = useState<'all' | 'A' | 'B' | 'C' | 'D' | 'F'>('all')
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
    queryKey: ['tasks', params.id, 'content_quality'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'content_quality' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.content_quality

  const handleStatusChange = async (taskId: string, status: 'pending' | 'done') => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { status })
      refetchTasks()
      toast.success('Zaktualizowano status zadania')
    } catch (_error) {
      toast.error('Nie udalo sie zaktualizowac zadania')
    }
  }

  const handleNotesChange = async (taskId: string, notes: string) => {
    try {
      await auditsAPI.updateTask(params.id, taskId, { notes })
      refetchTasks()
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

  const cqi = audit.results?.content_quality_index || {}
  const siteScore = Number(cqi?.site_score || 0)
  const grade = cqi?.grade || 'F'
  const status = cqi?.status || 'poor'
  const pages = Array.isArray(cqi?.pages) ? cqi.pages : []
  const crawlPages = Array.isArray(audit.results?.crawl?.all_pages) ? audit.results.crawl.all_pages : []
  const distribution = cqi?.distribution || {}
  const topIssues = Array.isArray(cqi?.top_issues) ? cqi.top_issues : []
  const components = cqi?.components || {}

  const filteredPages =
    gradeFilter === 'all'
      ? pages
      : pages.filter((page: any) => page?.grade === gradeFilter)

  const componentRows = Object.entries(components)
    .map(([key, value]) => ({
      component: key,
      score: Number(value || 0),
    }))
    .sort((a, b) => a.score - b.score)

  const statusLabel =
    status === 'excellent'
      ? 'Excellent'
      : status === 'good'
        ? 'Good'
        : status === 'needs_work'
          ? 'Needs work'
          : 'Poor'

  const issueMax = Math.max(1, ...topIssues.map((issue: any) => Number(issue?.count || 0)))

  const titleDuplicates = buildDuplicateGroups(crawlPages, 'title', 'title_occurrences')
  const metaDuplicates = buildDuplicateGroups(crawlPages, 'meta_description', 'meta_desc_occurrences')
  const h1Duplicates = buildDuplicateGroups(crawlPages, 'h1', 'h1_occurrences')

  const duplicateStats = {
    titleGroups: titleDuplicates.length,
    titlePages: titleDuplicates.reduce((acc, row) => acc + row.count, 0),
    metaGroups: metaDuplicates.length,
    metaPages: metaDuplicates.reduce((acc, row) => acc + row.count, 0),
    h1Groups: h1Duplicates.length,
    h1Pages: h1Duplicates.reduce((acc, row) => acc + row.count, 0),
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Content Quality Index</h1>
            <p className="text-sm text-muted-foreground">Per-page scoring 0-100 na bazie tresci, metadanych, linkowania i crawl depth.</p>
          </div>
        </div>
        <Link href={`/audits/${params.id}`}>
          <Button variant="outline" size="sm">
            Podsumowanie audytu <ChevronRight className="ml-1 h-3.5 w-3.5" />
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

      {mode === 'data' && (
      <>
      <div className="grid grid-cols-1 @md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Site CQI</CardDescription>
            <CardTitle className="text-4xl font-bold">{Math.round(siteScore)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-2xl font-bold">{statusLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={gradeBadgeVariant(siteScore)}>Grade {grade}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pages scored</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(Number(cqi?.pages_count || pages.length || 0))}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Najslabsza skladowa</CardDescription>
            <CardTitle className="text-xl font-bold">
              {componentRows.length > 0 ? componentRows[0].component : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {componentRows.length > 0 ? `${Math.round(componentRows[0].score)}/100` : 'Brak danych'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-[420px] grid-cols-2">
          <TabsTrigger value="overview">Przeglad CQI</TabsTrigger>
          <TabsTrigger value="duplicates">Duplikaty</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rozklad ocen stron</CardTitle>
                <CardDescription>A/B/C/D/F dla wszystkich URL-i w audycie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['A', 'B', 'C', 'D', 'F'] as const).map((gradeKey) => {
                  const value = Number(distribution?.[gradeKey] || 0)
                  const maxValue = Math.max(1, ...(['A', 'B', 'C', 'D', 'F'] as const).map((key) => Number(distribution?.[key] || 0)))
                  return (
                    <div key={gradeKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">Grade {gradeKey}</span>
                        <span className="text-muted-foreground">{formatNumber(value)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (value / maxValue) * 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top issues</CardTitle>
                <CardDescription>Najczesciej powtarzajace sie problemy quality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topIssues.length > 0 ? (
                  topIssues.slice(0, 8).map((issue: any, idx: number) => {
                    const count = Number(issue?.count || 0)
                    return (
                      <div key={`${issue?.issue || 'issue'}-${idx}`} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{issueLabel(String(issue?.issue || ''))}</span>
                          <span className="text-muted-foreground">{formatNumber(count)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.max(2, (count / issueMax) * 100)}%` }} />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">Brak issue summary dla tego audytu.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Component breakdown</CardTitle>
              <CardDescription>Sredni wynik kazdego filaru CQI (0-100)</CardDescription>
            </CardHeader>
            <CardContent>
              <DataExplorerTable
                data={componentRows}
                columns={[
                  { key: 'component', label: 'Component', className: 'font-medium' },
                  { key: 'score', label: 'Score' },
                ]}
                pageSize={8}
                exportFilename="content_quality_components"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <div>
                <CardTitle>Per-page CQI</CardTitle>
                <CardDescription>Lista stron posortowana po score, z filtrami po grade i issue.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'A', 'B', 'C', 'D', 'F'] as const).map((value) => (
                  <Button
                    key={value}
                    variant={gradeFilter === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGradeFilter(value)}
                  >
                    {value === 'all' ? 'Wszystkie' : `Grade ${value}`}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <DataExplorerTable
                data={filteredPages}
                columns={[
                  { key: 'url', label: 'URL', className: 'font-medium max-w-[360px]', maxWidth: '360px' },
                  { key: 'score', label: 'Score' },
                  { key: 'grade', label: 'Grade' },
                  { key: 'status', label: 'Status' },
                  { key: 'word_count', label: 'Word count' },
                  { key: 'text_ratio', label: 'Text ratio' },
                  { key: 'title_length', label: 'Title len' },
                  { key: 'meta_description_length', label: 'Meta len' },
                  { key: 'inlinks', label: 'Inlinks' },
                  { key: 'crawl_depth', label: 'Depth' },
                  {
                    key: 'issues',
                    label: 'Issues',
                    className: 'max-w-[320px]',
                    maxWidth: '320px',
                    render: (_: any, row: any) => {
                      const issues = Array.isArray(row?.issues) ? row.issues : []
                      if (issues.length === 0) return '—'
                      return issues.slice(0, 3).map((issue: string) => issueLabel(issue)).join(', ')
                    },
                  },
                ]}
                pageSize={25}
                exportFilename="content_quality_pages"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duplicates" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Sekcja bazuje na danych ze Screaming Frog (`Occurrences`). Duplikat oznacza, ze identyczny Title/Meta/H1 wystepuje na wiecej niz jednej stronie.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Duplikaty Title</CardDescription>
                <CardTitle className="text-2xl font-bold">{formatNumber(duplicateStats.titleGroups)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{formatNumber(duplicateStats.titlePages)} URL-i</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Duplikaty Meta Description</CardDescription>
                <CardTitle className="text-2xl font-bold">{formatNumber(duplicateStats.metaGroups)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{formatNumber(duplicateStats.metaPages)} URL-i</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Duplikaty H1</CardDescription>
                <CardTitle className="text-2xl font-bold">{formatNumber(duplicateStats.h1Groups)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{formatNumber(duplicateStats.h1Pages)} URL-i</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle>Duplikaty Title</CardTitle>
                <CardDescription>Grupy URL-i, ktore dziela ten sam Title</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCsv('duplicate_titles.csv', titleDuplicates, 'title')}
                disabled={titleDuplicates.length === 0}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <DataExplorerTable
                data={titleDuplicates}
                columns={[
                  { key: 'value', label: 'Title', className: 'font-medium max-w-[420px]', maxWidth: '420px' },
                  { key: 'count', label: 'Liczba URL-i' },
                  {
                    key: 'urls',
                    label: 'URLs',
                    className: 'max-w-[500px]',
                    maxWidth: '500px',
                    render: (_: any, row: DuplicateGroup) => row.urls.slice(0, 3).join(', ') + (row.urls.length > 3 ? ` (+${row.urls.length - 3})` : ''),
                  },
                ]}
                pageSize={15}
                exportFilename="duplicate_titles"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle>Duplikaty Meta Description</CardTitle>
                <CardDescription>Grupy URL-i, ktore dziela ten sam opis meta</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCsv('duplicate_meta_descriptions.csv', metaDuplicates, 'meta_description')}
                disabled={metaDuplicates.length === 0}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <DataExplorerTable
                data={metaDuplicates}
                columns={[
                  { key: 'value', label: 'Meta description', className: 'font-medium max-w-[420px]', maxWidth: '420px' },
                  { key: 'count', label: 'Liczba URL-i' },
                  {
                    key: 'urls',
                    label: 'URLs',
                    className: 'max-w-[500px]',
                    maxWidth: '500px',
                    render: (_: any, row: DuplicateGroup) => row.urls.slice(0, 3).join(', ') + (row.urls.length > 3 ? ` (+${row.urls.length - 3})` : ''),
                  },
                ]}
                pageSize={15}
                exportFilename="duplicate_meta_descriptions"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle>Duplikaty H1</CardTitle>
                <CardDescription>Grupy URL-i, ktore dziela ten sam naglowek H1</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCsv('duplicate_h1.csv', h1Duplicates, 'h1')}
                disabled={h1Duplicates.length === 0}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <DataExplorerTable
                data={h1Duplicates}
                columns={[
                  { key: 'value', label: 'H1', className: 'font-medium max-w-[420px]', maxWidth: '420px' },
                  { key: 'count', label: 'Liczba URL-i' },
                  {
                    key: 'urls',
                    label: 'URLs',
                    className: 'max-w-[500px]',
                    maxWidth: '500px',
                    render: (_: any, row: DuplicateGroup) => row.urls.slice(0, 3).join(', ') + (row.urls.length > 3 ? ` (+${row.urls.length - 3})` : ''),
                  },
                ]}
                pageSize={15}
                exportFilename="duplicate_h1"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}

      {mode === 'analysis' && (
        <AnalysisView area="content_quality" aiContext={aiContext} isLoading={audit?.ai_status === 'processing'} />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="content_quality"
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
