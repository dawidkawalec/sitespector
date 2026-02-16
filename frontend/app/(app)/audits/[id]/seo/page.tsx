'use client'

/**
 * SEO Analysis Page - 3-Phase System
 *
 * Dane: SEO metrics, technical SEO, All Pages table, status distribution
 * Analiza: AI SEO insights from ai_contexts.seo
 * Plan: Actionable SEO improvement tasks
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PageStatusChart } from '@/components/AuditCharts'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Audit } from '@/lib/api'

function OverviewTab({ crawl, allPages, params, renderFixSuggestion, exportToCSV }: { crawl: any; allPages: any[]; params: any; renderFixSuggestion: any; exportToCSV: any }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const pageSize = 20
  const [currentPage, setCurrentPage] = useState(1)

  const filteredPages = allPages.filter((page: any) => {
    const matchesSearch = page.url.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (page.title && page.title.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === '404' && page.status_code === 404) ||
                         (statusFilter === '3xx' && page.status_code >= 300 && page.status_code < 400) ||
                         (statusFilter === '200' && page.status_code === 200) ||
                         (statusFilter === 'noindex' && page.indexability === 'non-indexable')
    return matchesSearch && matchesStatus
  })

  const paginatedPages = filteredPages.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Strony
              <InfoTooltip id="word_count" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crawl.pages_crawled || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Przeskanowanych stron</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Błędy 404
              <InfoTooltip id="broken_links" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(crawl.technical_seo?.broken_links || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {crawl.technical_seo?.broken_links || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Niedziałające linki</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Bez Canonical
              <InfoTooltip id="canonical" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(crawl.technical_seo?.missing_canonical || 0) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {crawl.technical_seo?.missing_canonical || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Brak tagu canonical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sitemap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {crawl.has_sitemap ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-bold">{crawl.has_sitemap ? 'Wykryto' : 'Brak'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Status mapy strony</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-6">
        <Card className="@lg:col-span-2">
          <CardHeader>
            <CardTitle>Problemy Techniczne</CardTitle>
            <CardDescription>Krytyczne błędy i ostrzeżenia SEO</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {crawl.technical_seo?.broken_links > 0 && (
                <AccordionItem value="broken-links" className="border-none">
                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Wykryto niedziałające linki (404)</p>
                        <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                      </div>
                      <AccordionContent>
                        {renderFixSuggestion('broken_links', allPages.filter((p: any) => p.status_code >= 400).map((p: any) => p.url))}
                      </AccordionContent>
                    </div>
                  </div>
                </AccordionItem>
              )}
              {crawl.technical_seo?.missing_canonical > 0 && (
                <AccordionItem value="missing-canonical" className="border-none">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Brak tagów canonical</p>
                        <AccordionTrigger className="py-0 h-auto hover:no-underline" />
                      </div>
                      <AccordionContent>
                        {renderFixSuggestion('missing_canonical', allPages.filter((p: any) => !p.canonical).map((p: any) => p.url))}
                      </AccordionContent>
                    </div>
                  </div>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statusy HTTP</CardTitle>
            <CardDescription>Rozkład kodów odpowiedzi</CardDescription>
          </CardHeader>
          <CardContent>
            <PageStatusChart statusData={crawl.pages_by_status || {}} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col @md:flex-row @md:items-center justify-between gap-4">
            <CardTitle>Wszystkie Strony</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full @md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj URL..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtruj" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="200">200 OK</SelectItem>
                  <SelectItem value="404">404 Błędy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={filteredPages}
            columns={[
              { key: 'url', label: 'URL', className: 'font-medium truncate', maxWidth: '300px' },
              { key: 'status_code', label: 'Status', render: (v: any) => <Badge variant={v === 200 ? 'default' : 'destructive'}>{v}</Badge> },
              { key: 'title', label: 'Title', className: 'truncate', maxWidth: '200px' },
              { key: 'word_count', label: 'Słowa' },
            ]}
            pageSize={20}
            exportFilename="seo_strony"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function RawDataTab({ crawl, audit }: { crawl: any; audit: Audit }) {
  const [activeDataset, setActiveDataset] = useState('internal_all')
  const rawTabs = crawl.sf_raw_tabs || {}
  
  const availableTabs = Object.keys(rawTabs).filter(k => rawTabs[k] && rawTabs[k].length > 0)
  if (availableTabs.length === 0) {
    return <p className="text-muted-foreground py-8 text-center">Brak surowych danych (RAW) dla tego audytu.</p>
  }

  const currentData = rawTabs[activeDataset] || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center overflow-x-auto">
        <Tabs value={activeDataset} onValueChange={setActiveDataset}>
          <TabsList className="h-auto flex-wrap">
            {availableTabs.map(tabKey => (
              <TabsTrigger key={tabKey} value={tabKey} className="text-xs">
                {tabKey.replace('_', ' ')} <Badge variant="secondary" className="ml-1.5 text-[9px] h-4 px-1">{rawTabs[tabKey].length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <DataExplorerTable
        data={currentData}
        columns={currentData.length > 0 ? Object.keys(currentData[0]).slice(0, 8).map(k => ({ key: k, label: k })) : []}
        pageSize={25}
        exportFilename={`seo_raw_${activeDataset}`}
      />
    </div>
  )
}

export default function SeoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [mode, setMode] = useAuditMode('data')
  const [activeTab, setActiveTab] = useState('overview')
  const [loadingFix, setLoadingFix] = useState<string | null>(null)
  const [fixSuggestions, setFixSuggestions] = useState<Record<string, any>>({})

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
  const crawl = audit?.results?.crawl
  const aiContext = audit?.results?.ai_contexts?.seo

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

  const handleGetFixSuggestion = async (issueType: string, urls: string[]) => {
    if (loadingFix) return
    setLoadingFix(issueType)
    try {
      const suggestion = await auditsAPI.getFixSuggestion(params.id, issueType, urls)
      setFixSuggestions(prev => ({ ...prev, [issueType]: suggestion }))
      toast.success('Wygenerowano sugestię AI')
    } catch (error) {
      toast.error('Błąd AI')
    } finally {
      setLoadingFix(null)
    }
  }

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

  if (!crawl) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych SEO (crawl).</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Search className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza SEO</h1>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <OverviewTab
              crawl={crawl}
              allPages={crawl.all_pages || []}
              params={params}
              renderFixSuggestion={(type: string, urls: string[]) => (
                <div className="mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleGetFixSuggestion(type, urls)} disabled={!!loadingFix}>
                    {loadingFix === type ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                    {fixSuggestions[type] ? 'Odśwież sugestię' : 'Generuj sugestię AI'}
                  </Button>
                  {fixSuggestions[type] && (
                    <div className="mt-4 p-4 bg-primary/5 rounded border text-sm">
                      <p className="font-bold mb-2">Sugestia AI:</p>
                      <p>{fixSuggestions[type].importance}</p>
                      <ul className="list-disc pl-5 mt-2">
                        {fixSuggestions[type].steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              exportToCSV={() => {}}
            />
          </TabsContent>

          <TabsContent value="raw" className="pt-6">
            <RawDataTab crawl={crawl} audit={audit} />
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="seo"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
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
