'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Loader2, Globe2, TrendingUp, TrendingDown, AlertCircle, 
  Search, Filter, ChevronLeft, ChevronRight, ExternalLink,
  BarChart3, Calendar, Users, Target, Layers
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  PositionsDistributionChart,
  SeasonalityChart,
  CompetitorsBarChart
} from '@/components/AuditCharts'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { Audit } from '@/lib/api'
import { AuditPageLayout } from '@/components/AuditPageLayout'
import { AiInsightsPanel } from '@/components/AiInsightsPanel'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function OverviewTab({ vis, stats, dash, audit }: { vis: any; stats: any; dash: any; audit: Audit }) {
  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOP 3', value: stats.top3?.recent_value, diff: stats.top3?.diff, id: 'senuto_top3' },
          { label: 'TOP 10', value: stats.top10?.recent_value, diff: stats.top10?.diff, id: 'senuto_top10' },
          { label: 'TOP 50', value: stats.top50?.recent_value, diff: stats.top50?.diff, id: 'senuto_top50' },
          { label: 'Widoczność', value: Math.round(dash.statistics?.visibility?.recent_value || 0).toLocaleString(), diff: dash.statistics?.visibility?.diff, id: 'senuto_visibility' },
        ].map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                {card.label}
                <InfoTooltip id={card.id as any} />
              </CardDescription>
              <CardTitle className="text-3xl font-bold">
                {card.value || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {card.diff !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${card.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {card.diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(card.diff)} {card.diff >= 0 ? 'wzrost' : 'spadek'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Rozkład Pozycji
            </CardTitle>
            <CardDescription>Liczba fraz w poszczególnych przedziałach pozycji (1-50)</CardDescription>
          </CardHeader>
          <CardContent>
            <PositionsDistributionChart data={vis.distribution?.[0]?.data?.positions_distribution_top50} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Sezonowość
            </CardTitle>
            <CardDescription>Przewidywane trendy widoczności w skali roku</CardDescription>
          </CardHeader>
          <CardContent>
            <SeasonalityChart data={vis.seasonality} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Konkurenci w Google
            </CardTitle>
            <CardDescription>Domeny o najbardziej zbliżonym profilu słów kluczowych</CardDescription>
          </CardHeader>
          <CardContent>
            <CompetitorsBarChart competitors={vis.competitors || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Sekcje Witryny
            </CardTitle>
            <CardDescription>Najwidoczniejsze obszary domeny</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(vis.sections || []).slice(0, 6).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded border bg-accent/10">
                  <div className="text-xs font-medium truncate max-w-[150px]">{s.section || s.subdomain}</div>
                  <Badge variant="outline" className="text-[10px]">{Math.round(s.statistics?.visibility?.recent_value || 0)} pkt</Badge>
                </div>
              ))}
              {(vis.sections || []).length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">Brak danych o sekcjach.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {vis.cannibalization?.keywords?.length > 0 && (
        <Card className="border-red-200 bg-red-50/30 dark:bg-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Wykryta Kanibalizacja
            </CardTitle>
            <CardDescription>Słowa kluczowe, na które rankuje więcej niż jeden adres URL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-red-100 overflow-hidden bg-white dark:bg-slate-950">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Słowo kluczowe</TableHead>
                    <TableHead>Zduplikowane adresy URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vis.cannibalization.keywords.slice(0, 10).map((c: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-bold text-xs">{c.keyword}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {c.urls?.map((u: string, idx: number) => (
                            <div key={idx} className="text-[10px] text-primary truncate max-w-[500px]">{u}</div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function KeywordsTab({ vis }: { vis: any }) {
  const [searchTerm, setSearchTerm] = useState('')
  const allPositions = vis.positions || []
  const filteredPositions = allPositions.filter((p: any) => 
    p.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns = [
    { key: 'keyword', label: 'Fraza', className: 'font-medium' },
    { 
      key: 'statistics.position.current', 
      label: 'Pozycja', 
      className: 'text-center font-bold',
      render: (_: any, row: any) => row.statistics?.position?.current
    },
    { 
      key: 'statistics.position.diff', 
      label: 'Zmiana', 
      className: 'text-center',
      render: (_: any, row: any) => {
        const diff = row.statistics?.position?.diff
        return (
          <Badge variant={diff < 0 ? 'default' : diff > 0 ? 'destructive' : 'outline'}>
            {diff === 0 ? '-' : (diff < 0 ? `+${Math.abs(diff)}` : `-${diff}`)}
          </Badge>
        )
      }
    },
    { 
      key: 'statistics.searches.current', 
      label: 'Wyszukiwania', 
      className: 'text-center',
      render: (_: any, row: any) => row.statistics?.searches?.current?.toLocaleString()
    },
    { 
      key: 'statistics.visibility.current', 
      label: 'Widoczność', 
      className: 'text-right font-mono text-xs',
      render: (_: any, row: any) => row.statistics?.visibility?.current?.toFixed(2)
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Najważniejsze Frazy
            </CardTitle>
            <CardDescription>Słowa kluczowe generujące największy ruch</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj frazy..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataExplorerTable
          data={filteredPositions}
          columns={columns}
          pageSize={20}
          exportFilename="widocznosc_frazy"
        />
      </CardContent>
    </Card>
  )
}

function RawDataTab({ vis, audit }: { vis: any; audit: Audit }) {
  const [activeDataset, setActiveDataset] = useState('positions')
  
  const datasets: Record<string, { label: string; data: any[] }> = {
    positions: { label: 'Pozycje', data: vis.positions || [] },
    wins: { label: 'Wzrosty', data: vis.wins || [] },
    losses: { label: 'Spadki', data: vis.losses || [] },
    competitors: { label: 'Konkurenci', data: vis.competitors || [] },
    sections: { label: 'Sekcje', data: vis.sections || [] },
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
        exportFilename={`widocznosc_raw_${activeDataset}`}
      />
    </div>
  )
}

export default function VisibilityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuth(!!session)
      if (!session) router.push('/login')
    }
    checkAuth()
  }, [router])

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
  })

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const senuto = audit?.results?.senuto
  if (!senuto || !senuto.visibility) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Brak danych widoczności</h1>
        <p className="text-muted-foreground">Analiza widoczności nie została przeprowadzona dla tego audytu.</p>
      </div>
    )
  }

  const vis = senuto.visibility
  const stats = vis.statistics?.statistics || {}
  const dash = vis.dashboard || {}
  const hasAiData = !!(audit?.results?.ai_contexts?.visibility)

  return (
    <AuditPageLayout
      aiPanel={<AiInsightsPanel area="visibility" audit={audit!} />}
      aiPanelTitle="AI: Widoczność"
      hasAiData={hasAiData}
    >
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Globe2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Analiza Widoczności</h1>
            <p className="text-sm text-muted-foreground">Baza: {senuto.country_id === 200 ? 'Polska 2.0' : 'Inna'} • Tryb: {senuto.fetch_mode}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="keywords">Frazy</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <OverviewTab vis={vis} stats={stats} dash={dash} audit={audit!} />
          </TabsContent>

          <TabsContent value="keywords" className="pt-6">
            <KeywordsTab vis={vis} />
          </TabsContent>

          <TabsContent value="raw" className="pt-6">
            <RawDataTab vis={vis} audit={audit!} />
          </TabsContent>
        </Tabs>
      </div>
    </AuditPageLayout>
  )
}
