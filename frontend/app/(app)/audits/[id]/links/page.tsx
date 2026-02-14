'use client'

/**
 * Links Analysis Page - 3-Phase System
 * 
 * Dane: Internal links, incoming links, raw data
 * Analiza: AI link insights
 * Plan: Actionable link tasks
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2, XCircle, Search, Filter, ExternalLink, ArrowRight, Link2Off, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import type { Audit } from '@/lib/api'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { toast } from 'sonner'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { LinkAttributesPieChart } from '@/components/AuditCharts'
import { formatNumber } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfoTooltip } from '@/components/ui/info-tooltip'

function InternalLinksTab({ linksData, allPages }: { linksData: any; allPages: any[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [linkType, setLinkType] = useState('all')

  const filteredLinks = allPages.filter((page: any) => {
    const matchesSearch = page.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = linkType === 'all' || 
                       (linkType === 'broken' && page.status_code === 404) ||
                       (linkType === 'redirect' && page.status_code >= 300 && page.status_code < 400) ||
                       (linkType === 'external' && page.external_outlinks > 0)
    return matchesSearch && matchesType
  })

  const columns = [
    { key: 'url', label: 'URL Strony', className: 'font-medium truncate', maxWidth: '300px' },
    { 
      key: 'status_code', 
      label: 'Status',
      render: (v: any) => (
        <Badge variant={v === 200 ? 'default' : v < 400 ? 'secondary' : 'destructive'}>
          {v}
        </Badge>
      )
    },
    { key: 'inlinks', label: 'Inlinks' },
    { key: 'outlinks', label: 'Outlinks' },
    { key: 'external_outlinks', label: 'Ext. Outlinks' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Problemy z Linkami</CardTitle>
            <CardDescription>Wykryte błędy w strukturze linkowania</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(linksData.broken || 0) > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30">
                  <Link2Off className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Wykryto niedziałające linki (404)</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {linksData.broken} linków prowadzi do nieistniejących stron.
                    </p>
                  </div>
                </div>
              )}
              {linksData.broken === 0 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Brak niedziałających linków!</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Struktura Linkowania</CardTitle>
            <CardDescription>Rozkład linków przychodzących i wychodzących</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Linki Wewnętrzne</span>
                  <span className="font-bold">{linksData.internal || 0}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (linksData.internal / (linksData.internal + linksData.external || 1)) * 100)}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Linki Zewnętrzne</span>
                  <span className="font-bold">{linksData.external || 0}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (linksData.external / (linksData.internal + linksData.external || 1)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Szczegóły Linkowania per Strona</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj URL..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="broken">Broken (404)</SelectItem>
                  <SelectItem value="redirect">Redirects</SelectItem>
                  <SelectItem value="external">Z zewn. linkami</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={filteredLinks}
            columns={columns}
            pageSize={20}
            exportFilename="linki_wewnetrzne"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function IncomingLinksTab({ senuto, audit }: { senuto: any; audit: Audit }) {
  const [searchTerm, setSearchTerm] = useState('')
  const bl = senuto.backlinks
  if (!bl) return <p className="text-muted-foreground py-8 text-center">Brak danych o linkach przychodzących.</p>

  const stats = bl.statistics || {}
  const attrs = bl.link_attributes?.[audit.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '')] || []
  const allLinks = bl.list || []
  const filteredLinks = allLinks.filter((l: any) => 
    l.ref_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.anchor?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    { 
      key: 'ref_url', 
      label: 'Strona Linkująca', 
      className: 'max-w-[300px]',
      render: (_: any, l: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-muted-foreground uppercase">{l.ref_domain}</span>
          <a href={l.ref_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex items-center gap-1">
            {l.ref_url} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )
    },
    { key: 'anchor', label: 'Anchor', className: 'text-xs italic' },
    { key: 'link_type', label: 'Typ', render: (v: any) => <Badge variant="outline" className="text-[10px]">{v}</Badge> },
    { 
      key: 'rel', 
      label: 'Rel', 
      render: (v: any) => (
        <div className="flex flex-wrap gap-1">
          {v?.map((r: string, idx: number) => (
            <Badge key={idx} variant={r === 'nofollow' ? 'destructive' : 'default'} className="text-[8px] h-4">
              {r}
            </Badge>
          ))}
        </div>
      )
    },
    { key: 'first_seen', label: 'Wykryto', className: 'text-right text-xs text-muted-foreground' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Wszystkie Linki', value: formatNumber(stats.backlinks_count), id: 'backlinks_count' },
          { label: 'Domeny Ref.', value: formatNumber(stats.domains_count), id: 'ref_domains' },
          { label: 'IP Referujące', value: formatNumber(stats.ips_count), id: 'ref_domains' },
          { label: 'Linki Follow', value: `${formatNumber((attrs.find((a:any)=>a.attribute==='follow')?.percent || 0) * 100)}%`, id: 'follow_ratio' },
        ].map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                {card.label}
                <InfoTooltip id={card.id as any} />
              </CardDescription>
              <CardTitle className="text-3xl font-bold">{card.value || 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Atrybuty Linków</CardTitle></CardHeader>
          <CardContent><LinkAttributesPieChart attributes={attrs} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Najsilniejsze Domeny</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(bl.ref_domains || []).slice(0, 6).map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 rounded border bg-accent/5">
                  <span className="truncate font-medium">{d.ref_domain}</span>
                  <span className="text-muted-foreground">{d.backlinks_count} linków</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Najczęstsze Anchory</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const domainKey = Object.keys(bl.anchors || {})[0];
                const anchors = domainKey ? bl.anchors[domainKey] : [];
                return (anchors || []).slice(0, 6).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded border bg-accent/5">
                    <span className="truncate font-medium italic">"{a.anchor || 'Brak tekstu'}"</span>
                    <Badge variant="secondary">{a.count}</Badge>
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Lista Linków Przychodzących</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj w linkach..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={filteredLinks}
            columns={columns}
            pageSize={20}
            exportFilename="linki_przychodzace"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function RawDataTab({ audit }: { audit: Audit }) {
  const [activeDataset, setActiveDataset] = useState('internal')
  const rawTabs = audit.results?.crawl?.sf_raw_tabs || {}
  const senutoBl = audit.results?.senuto?.backlinks || {}

  const datasets: Record<string, { label: string; data: any[] }> = {
    internal: { label: 'Wszystkie (Crawl)', data: rawTabs.internal_all || audit.results?.crawl?.all_pages || [] },
    backlinks: { label: 'Backlinki (Full)', data: senutoBl.list || [] },
    anchors: { label: 'Anchory (Full)', data: Object.values(senutoBl.anchors || {}).flat() },
    domains: { label: 'Domeny (Full)', data: senutoBl.ref_domains || [] },
  }

  const currentData = datasets[activeDataset].data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center overflow-x-auto">
        <Tabs value={activeDataset} onValueChange={setActiveDataset}>
          <TabsList>
            {Object.entries(datasets).map(([key, ds]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {ds.label} <Badge variant="secondary" className="ml-1.5 text-[9px] h-4 px-1">{ds.data.length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <DataExplorerTable
        data={currentData}
        columns={currentData.length > 0 ? Object.keys(currentData[0]).slice(0, 8).map(k => ({ key: k, label: k })) : []}
        pageSize={25}
        exportFilename={`linki_raw_${activeDataset}`}
      />
    </div>
  )
}

export default function LinksPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('internal')
  const [mode, setMode] = useAuditMode('data')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'incoming' || tab === 'internal' || tab === 'raw') {
      setActiveTab(tab)
    }
  }, [searchParams])

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

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'links'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'links' }),
    enabled: isAuth && !!audit && mode === 'plan'
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.links

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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera danych linków.</p>
      </div>
    )
  }

  const linksData = audit.results?.crawl?.links
  const allPages = audit.results?.crawl?.all_pages || []
  const senuto = audit.results?.senuto
  const hasAiData = !!(audit?.results?.ai_contexts?.links || audit?.results?.ai_contexts?.backlinks)

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <LinkIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Linków</h1>
      </div>

      <ModeSwitcher
        mode={mode}
        onModeChange={setMode}
        taskCount={tasks.length}
        pendingTaskCount={tasks.filter(t => t.status === 'pending').length}
        hasAiData={hasAiData}
        hasExecutionPlan={audit?.execution_plan_status === 'completed'}
        isAiLoading={audit?.ai_status === 'processing'}
        isExecutionPlanLoading={audit?.execution_plan_status === 'processing'}
      />

      {mode === 'data' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="internal">
              Wewnętrzne
              <Badge variant="secondary" className="ml-2 text-[9px] h-4 px-1">
                {formatNumber(allPages.length)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="incoming">
              Przychodzące
              <Badge variant="secondary" className="ml-2 text-[9px] h-4 px-1">
                {formatNumber(senuto?.backlinks?.list?.length || 0)}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="pt-6">
            <InternalLinksTab linksData={linksData} allPages={allPages} />
          </TabsContent>

          <TabsContent value="incoming" className="pt-6">
            <IncomingLinksTab senuto={senuto} audit={audit!} />
          </TabsContent>

          <TabsContent value="raw" className="pt-6">
            <RawDataTab audit={audit!} />
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="links"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="links"
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
        />
      )}
    </div>
  )
}
