'use client'

/**
 * Competitors Analysis Page
 * 
 * Displays competitor audit results for comparison including:
 * - Comparison table (scores, CWV)
 * - Bar charts for visual comparison
 * - AI competitive analysis summary
 * - Winner indicators
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users } from 'lucide-react'
import { formatNumber, formatScore } from '@/lib/utils'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { CompetitorsDualBarChart } from '@/components/AuditCharts'

function metricValue(metric: any): number {
  if (typeof metric === 'number') return Number(metric) || 0
  if (!metric || typeof metric !== 'object') return 0
  return Number(metric.current ?? metric.recent_value ?? metric.value ?? 0) || 0
}

export default function CompetitorsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

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
        <p className="text-muted-foreground">Audyt nie został znaleziony.</p>
      </div>
    )
  }

  const senutoCompetitors = audit.results?.senuto?.visibility?.competitors || []
  const competitorsForChart = (senutoCompetitors || []).filter((c: any) => c?.is_main_domain !== true)
  const visibilityAi = audit.results?.ai_contexts?.visibility || {}
  const metricsLegend = Array.isArray(visibilityAi?.metrics_legend) ? visibilityAi.metrics_legend : []
  const nextSteps = Array.isArray(visibilityAi?.next_steps_for_management) ? visibilityAi.next_steps_for_management : []
  const rows = (senutoCompetitors || [])
    .filter((c: any) => c?.is_main_domain !== true)
    .map((c: any) => ({
      domain: c.domain,
      common_keywords: c.common_keywords || 0,
      visibility: metricValue(c.statistics?.visibility),
      ads_equivalent: metricValue(c.statistics?.ads_equivalent),
      top3: metricValue(c.statistics?.top3),
      top3_diff: c.statistics?.top3?.diff || 0,
      top10: metricValue(c.statistics?.top10),
      top10_diff: c.statistics?.top10?.diff || 0,
      top50: metricValue(c.statistics?.top50),
      top50_diff: c.statistics?.top50?.diff || 0,
      domain_rank: metricValue(c.statistics?.domain_rank),
      domain_rank_diff: c.statistics?.domain_rank?.diff || 0,
    }))
    .sort((a: any, b: any) => (b.common_keywords || 0) - (a.common_keywords || 0))

  const columns = [
    { key: 'domain', label: 'Domena', className: 'font-medium' },
    { key: 'common_keywords', label: 'Wspólne słowa', render: (v: any) => formatNumber(v || 0) },
    { key: 'visibility', label: 'Szac. ruch', render: (v: any) => formatNumber(v || 0) },
    { key: 'ads_equivalent', label: 'Ads Equivalent', render: (v: any) => `${formatNumber(v || 0)} PLN` },
    {
      key: 'top3',
      label: 'TOP3',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <span>{formatNumber(row.top3)}</span>
          <Badge variant={row.top3_diff >= 0 ? 'default' : 'destructive'} className="text-[9px] h-4">
            {row.top3_diff >= 0 ? `+${formatNumber(row.top3_diff)}` : formatNumber(row.top3_diff)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'top10',
      label: 'TOP10',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <span>{formatNumber(row.top10)}</span>
          <Badge variant={row.top10_diff >= 0 ? 'default' : 'destructive'} className="text-[9px] h-4">
            {row.top10_diff >= 0 ? `+${formatNumber(row.top10_diff)}` : formatNumber(row.top10_diff)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'top50',
      label: 'TOP50',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <span>{formatNumber(row.top50)}</span>
          <Badge variant={row.top50_diff >= 0 ? 'default' : 'destructive'} className="text-[9px] h-4">
            {row.top50_diff >= 0 ? `+${formatNumber(row.top50_diff)}` : formatNumber(row.top50_diff)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'domain_rank',
      label: 'Ranking',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5">
          <span>{formatNumber(row.domain_rank)}</span>
          <Badge variant={row.domain_rank_diff <= 0 ? 'default' : 'destructive'} className="text-[9px] h-4">
            {row.domain_rank_diff <= 0 ? `+${formatNumber(Math.abs(row.domain_rank_diff))}` : `-${formatNumber(row.domain_rank_diff)}`}
          </Badge>
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Konkurencji</h1>
      </div>
      
      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Brak danych konkurencji z Senuto.</p>
            <p className="text-sm mt-2">Upewnij się, że analiza Senuto zakończyła się poprawnie.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {visibilityAi?.non_technical_summary && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Wnioski biznesowe (AI)</CardTitle>
                <CardDescription>Wyjaśnienie konkurencji bez technicznego żargonu.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{visibilityAi.non_technical_summary}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Legenda metryk konkurencji</CardTitle>
              <CardDescription>Co oznaczają liczby i jak je interpretować biznesowo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Wspólne słowa:</strong> liczba fraz, na które konkurujesz z daną domeną.</p>
              <p><strong>TOP3/TOP10/TOP50:</strong> skala widoczności konkurenta w wynikach Google.</p>
              <p><strong>Domain Rank:</strong> orientacyjna siła domeny w SEO (im niżej, tym zwykle mocniejsza pozycja).</p>
              <p><strong>Ads Equivalent:</strong> przybliżony koszt pozyskania podobnego ruchu w kampaniach płatnych.</p>
            </CardContent>
          </Card>

          {metricsLegend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Legenda metryk (AI)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metricsLegend.slice(0, 6).map((item: any, idx: number) => (
                  <div key={`${item.metric || 'metric'}-${idx}`} className="rounded border p-3 text-sm">
                    <p className="font-semibold">{item.metric}</p>
                    <p className="text-muted-foreground">{item.meaning}</p>
                    <p className="text-xs mt-1"><span className="font-medium">Wpływ:</span> {item.business_impact}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Wyniki organiczne</CardTitle>
              <CardDescription>Wspólne słowa kluczowe vs wszystkie słowa</CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitorsDualBarChart competitors={competitorsForChart} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Szczegółowe porównanie</CardTitle>
              <CardDescription>TOP3/TOP10/TOP50, ruch, ekwiwalent reklam i ranking</CardDescription>
            </CardHeader>
            <CardContent>
              <DataExplorerTable data={rows} columns={columns} pageSize={20} exportFilename="konkurencja_senuto" />
            </CardContent>
          </Card>

          {nextSteps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Kolejne kroki (AI)</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-6 space-y-2 text-sm">
                  {nextSteps.slice(0, 8).map((step: string, idx: number) => (
                    <li key={`${step}-${idx}`}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
