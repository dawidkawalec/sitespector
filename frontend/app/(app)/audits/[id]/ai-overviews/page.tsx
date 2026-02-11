'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles, Users, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { AuditPageLayout } from '@/components/AuditPageLayout'
import { AiInsightsPanel } from '@/components/AiInsightsPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { formatNumber, formatScore } from '@/lib/utils'
import { IntentBadge } from '@/components/ui/intent-badge'
import { AIOCompetitorsChart, AIOPositionDistributionChart, IntentDistributionPieChart } from '@/components/AuditCharts'

export default function AiOverviewsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('keywords')

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

  const aio = audit?.results?.senuto?.visibility?.ai_overviews
  if (!aio) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Brak danych AI Overviews</h1>
        <p className="text-muted-foreground">Ten audyt nie zawiera danych AI Overviews z Senuto.</p>
      </div>
    )
  }

  const stats = aio.statistics || {}
  const keywords = aio.keywords || []
  const competitors = aio.competitors || []

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

  return (
    <AuditPageLayout
      aiPanel={<AiInsightsPanel area="visibility" audit={audit!} />}
      aiPanelTitle="AI: AI Overviews"
      hasAiData={!!audit?.results?.ai_contexts?.ai_overviews}
      isAiLoading={audit?.ai_status === 'processing'}
    >
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">AI Overviews</h1>
            <p className="text-sm text-muted-foreground">Analiza obecności domeny w AI Overviews</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cytowania w AIO</CardDescription>
              <CardTitle className="text-3xl font-bold">{formatNumber(stats.aio_keywords_with_domain_count || 0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Śr. pozycja w AIO</CardDescription>
              <CardTitle className="text-3xl font-bold">{formatScore(stats.aio_avg_pos || 0)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Zyski / Straty</CardDescription>
              <CardTitle className="text-3xl font-bold">
                {formatNumber(stats.aio_wins_count || 0)} / {formatNumber(stats.aio_losses_count || 0)}
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
              <CardTitle className="text-3xl font-bold">{formatScore(stats.aio_vis_loss_percentage || 0)}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              data={keywords}
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
    </AuditPageLayout>
  )
}

