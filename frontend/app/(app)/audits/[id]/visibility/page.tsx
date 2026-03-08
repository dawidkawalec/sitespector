'use client'

/**
 * Visibility Analysis Page - 3-Phase System
 *
 * Dane: Visibility metrics, positions, gains/losses, competitors, features, sections, cannibalization
 * Analiza: AI visibility insights from ai_contexts.visibility
 * Plan: Actionable visibility improvement tasks
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Loader2, Globe2, TrendingUp, TrendingDown, AlertCircle,
  BarChart3, Calendar, Users, Target, Layers, Gauge
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  PositionsDistributionChart,
  SeasonalityChart,
  CompetitorsDualBarChart,
  IntentDistributionPieChart,
  DifficultyDistributionChart,
  SearchVolumeDistributionChart,
  SerpFeaturesChart,
  WordCountDistributionChart,
  TrendsPeakChart,
  PositionSparkline,
  TrendsSparkline,
  AIOPositionDistributionChart,
} from '@/components/AuditCharts'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { Audit } from '@/lib/api'
import { DataExplorerTable } from '@/components/DataExplorerTable'
import { ModeSwitcher, useAuditMode } from '@/components/audit/ModeSwitcher'
import { AnalysisView } from '@/components/audit/AnalysisView'
import { TaskListView } from '@/components/audit/TaskListView'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatNumber, formatScore } from '@/lib/utils'
import { IntentBadge } from '@/components/ui/intent-badge'
import { DifficultyBadge } from '@/components/ui/difficulty-badge'
import { SerpTags } from '@/components/ui/serp-tags'
import { KeywordFeaturesTable, type KeywordFeatureRow } from '@/components/KeywordFeaturesTable'

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

function metricValue(metric: any): number {
  if (typeof metric === 'number') return Number(metric) || 0
  if (!metric || typeof metric !== 'object') return 0
  return Number(metric.current ?? metric.recent_value ?? metric.value ?? 0) || 0
}

function metricDiff(metric: any): number | undefined {
  if (!metric || typeof metric !== 'object') return undefined
  const raw = metric.diff
  if (typeof raw === 'number') return raw
  return undefined
}

function getPosition(row: any): number {
  return row?.statistics?.position?.current ?? 9999
}

function getDiff(row: any): number {
  return row?.statistics?.position?.diff ?? 0
}

function getSearches(row: any): number {
  return row?.statistics?.searches?.current ?? 0
}

function getDifficulty(row: any): number {
  return row?.statistics?.difficulty?.current ?? 0
}

function getSnippets(row: any): string[] {
  return row?.statistics?.snippets?.current || []
}

function getTrafficEstimate(row: any): number {
  const visibility = row?.statistics?.visibility?.current || 0
  const searches = getSearches(row)
  return Math.round((visibility || 0) + searches * 0.05)
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function positionBucket(position: number): 'top3' | 'top4_10' | 'top11_20' | 'top21_50' | 'over50' {
  if (position <= 3) return 'top3'
  if (position <= 10) return 'top4_10'
  if (position <= 20) return 'top11_20'
  if (position <= 50) return 'top21_50'
  return 'over50'
}

function buildTrafficFallback(positions: any[]) {
  const byPositionBracket: Record<string, { label: string; keywords: number; estimated_traffic: number }> = {
    top3: { label: 'TOP 3', keywords: 0, estimated_traffic: 0 },
    top4_10: { label: 'TOP 4-10', keywords: 0, estimated_traffic: 0 },
    top11_20: { label: 'TOP 11-20', keywords: 0, estimated_traffic: 0 },
    top21_50: { label: 'TOP 21-50', keywords: 0, estimated_traffic: 0 },
    over50: { label: '50+', keywords: 0, estimated_traffic: 0 },
  }

  const topTrafficKeywords = positions
    .map((row: any) => ({
      keyword: row?.keyword || row?.phrase || '—',
      position: getPosition(row),
      search_volume: getSearches(row),
      estimated_traffic: getTrafficEstimate(row),
      url: row?.statistics?.url?.current || row?.url || '',
    }))
    .sort((a: any, b: any) => (b.estimated_traffic || 0) - (a.estimated_traffic || 0))

  const urlMap = new Map<string, number>()
  topTrafficKeywords.forEach((row: any) => {
    if (!row.url) return
    urlMap.set(row.url, (urlMap.get(row.url) || 0) + toNumber(row.estimated_traffic, 0))
  })

  topTrafficKeywords.forEach((row: any) => {
    const bucket = positionBucket(toNumber(row.position, 9999))
    byPositionBracket[bucket].keywords += 1
    byPositionBracket[bucket].estimated_traffic += toNumber(row.estimated_traffic, 0)
  })

  const opportunities = topTrafficKeywords
    .filter((row: any) => toNumber(row.position, 0) >= 10 && toNumber(row.position, 0) <= 20)
    .map((row: any) => {
      const currentTraffic = toNumber(row.estimated_traffic, 0)
      const potentialTraffic = Math.round(toNumber(row.search_volume, 0) * 0.11)
      return {
        keyword: row.keyword,
        current_pos: row.position,
        target_pos: 3,
        search_volume: row.search_volume,
        current_traffic: currentTraffic,
        potential_traffic: potentialTraffic,
        gain: Math.max(0, potentialTraffic - currentTraffic),
        url: row.url,
      }
    })
    .sort((a: any, b: any) => toNumber(b.gain, 0) - toNumber(a.gain, 0))

  const totalEstimatedMonthly = topTrafficKeywords.reduce((acc: number, row: any) => acc + toNumber(row.estimated_traffic, 0), 0)
  const potentialGain = opportunities.reduce((acc: number, row: any) => acc + toNumber(row.gain, 0), 0)

  return {
    total_estimated_monthly: Math.round(totalEstimatedMonthly),
    potential_gain: Math.round(potentialGain),
    potential_monthly: Math.round(totalEstimatedMonthly + potentialGain),
    by_position_bracket: byPositionBracket,
    top_traffic_keywords: topTrafficKeywords.slice(0, 20),
    top_traffic_urls: Array.from(urlMap.entries())
      .map(([url, estimated]) => ({ url, estimated_traffic: Math.round(estimated) }))
      .sort((a, b) => b.estimated_traffic - a.estimated_traffic)
      .slice(0, 20),
    top_opportunities: opportunities.slice(0, 20),
  }
}

function makeRangeLabel(start: number, size: number) {
  return `${start}-${start + size - 1}`
}

function buildFeatureRows(groups: Record<string, any[]>, totalTraffic: number): KeywordFeatureRow[] {
  return Object.entries(groups).map(([range, rows]) => {
    const top3 = rows.filter((r: any) => getPosition(r) <= 3).length
    const top10 = rows.filter((r: any) => getPosition(r) <= 10).length
    const top50 = rows.filter((r: any) => getPosition(r) <= 50).length
    const estimatedTraffic = rows.reduce((acc: number, row: any) => acc + getTrafficEstimate(row), 0)
    return {
      range,
      top3,
      top10,
      top50,
      estimatedTraffic,
      estimatedTrafficPercent: totalTraffic > 0 ? (estimatedTraffic / totalTraffic) * 100 : 0,
    }
  })
}

function keywordColumns() {
  return [
    { key: 'keyword', label: 'Fraza', className: 'font-medium max-w-[260px]', maxWidth: '260px' },
    {
      key: 'intent',
      label: 'Intencja',
      sortable: false,
      render: (_: any, row: any) => (
        <IntentBadge
          intent={row?.statistics?.intentions?.main_intent}
          stage={row?.statistics?.intentions?.journey_stage}
        />
      ),
    },
    {
      key: 'difficulty',
      label: 'Trudność',
      render: (_: any, row: any) => <DifficultyBadge value={getDifficulty(row)} />,
    },
    {
      key: 'searches',
      label: 'Wyszuk.',
      render: (_: any, row: any) => formatNumber(getSearches(row)),
    },
    {
      key: 'position',
      label: 'Pozycja',
      render: (_: any, row: any) => (
        <div className="font-bold text-center">{getPosition(row)}</div>
      ),
    },
    {
      key: 'change',
      label: 'Zmiana',
      render: (_: any, row: any) => {
        const diff = getDiff(row)
        if (diff === 0) return <Badge variant="outline">0</Badge>
        const isUp = diff < 0
        return (
          <Badge variant={isUp ? 'default' : 'destructive'}>
            {isUp ? `+${Math.abs(diff)}` : `-${diff}`}
          </Badge>
        )
      },
    },
    {
      key: 'history',
      label: 'Historia',
      sortable: false,
      render: (_: any, row: any) => <PositionSparkline history={row?.statistics?.position?.history || {}} />,
    },
    {
      key: 'trends',
      label: 'Trendy',
      sortable: false,
      render: (_: any, row: any) => <TrendsSparkline trend={row?.statistics?.trends?.history || []} />,
    },
    {
      key: 'serp',
      label: 'SERP',
      sortable: false,
      render: (_: any, row: any) => <SerpTags snippets={getSnippets(row)} />,
    },
    {
      key: 'url',
      label: 'URL',
      className: 'max-w-[260px]',
      maxWidth: '260px',
      render: (_: any, row: any) => (
        <span className="text-xs text-muted-foreground truncate block">
          {row?.statistics?.url?.current || '—'}
        </span>
      ),
    },
    {
      key: 'cpc',
      label: 'CPC',
      render: (_: any, row: any) => {
        const cpc = row?.statistics?.cpc?.current
        return cpc ? `${cpc} PLN` : '—'
      },
    },
    {
      key: 'est',
      label: 'Szac. ruch',
      render: (_: any, row: any) => formatNumber(getTrafficEstimate(row)),
    },
  ]
}

function OverviewTab({
  vis,
  stats,
  dash,
  intentData,
  difficultyData,
  audit,
  aiContext,
}: {
  vis: any
  stats: any
  dash: any
  intentData: Array<{ name: string; value: number }>
  difficultyData: Array<{ range: string; count: number }>
  audit: Audit
  aiContext: any
}) {
  const aioStats = vis?.ai_overviews?.statistics || {}
  const aioKeywords = Array.isArray(vis?.ai_overviews?.keywords) ? vis.ai_overviews.keywords : []
  const aioPositionDistribution = aioKeywords.reduce((acc: Record<string, number>, row: any) => {
    const pos = row?.best_aio_pos ?? row?.best_aio_position
    if (typeof pos === 'number' && pos > 0) {
      acc[String(pos)] = (acc[String(pos)] || 0) + 1
    }
    return acc
  }, {})
  const aioKeywordsCount = Number(aioStats?.aio_keywords_count ?? aioStats?.total_keywords ?? aioKeywords.length ?? 0)
  const aioCitationsCount = Number(aioStats?.aio_keywords_with_domain_count ?? aioStats?.citations_count ?? 0)
  const aioAvgPos = Number(aioStats?.aio_avg_pos ?? aioStats?.avg_position ?? 0)
  const metricsLegend = Array.isArray(aiContext?.metrics_legend) ? aiContext.metrics_legend : []
  const managementSteps = Array.isArray(aiContext?.next_steps_for_management) ? aiContext.next_steps_for_management : []

  return (
    <div className="space-y-8">
      {aiContext?.non_technical_summary && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Wnioski biznesowe (AI)</CardTitle>
            <CardDescription>Interpretacja bez technicznego żargonu.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{aiContext.non_technical_summary}</p>
          </CardContent>
        </Card>
      )}

      {metricsLegend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Legenda metryk widoczności</CardTitle>
            <CardDescription>Jak czytać TOP3/TOP10/TOP50, Domain Rank i Ads Equivalent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {metricsLegend.slice(0, 6).map((item: any, idx: number) => (
              <div key={`${item.metric || 'metric'}-${idx}`} className="rounded border p-3 text-sm">
                <p className="font-semibold">{item.metric}</p>
                <p className="text-muted-foreground">{item.meaning}</p>
                <p className="text-xs mt-1"><span className="font-medium">Wpływ biznesowy:</span> {item.business_impact}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-5 gap-4">
        {[
          { label: 'TOP 3', value: metricValue(stats.top3), diff: metricDiff(stats.top3), id: 'senuto_top3' },
          { label: 'TOP 10', value: metricValue(stats.top10), diff: metricDiff(stats.top10), id: 'senuto_top10' },
          { label: 'TOP 50', value: metricValue(stats.top50), diff: metricDiff(stats.top50), id: 'senuto_top50' },
          { 
            label: 'Widoczność', 
            value: metricValue(stats.visibility) || metricValue(dash?.statistics?.visibility), 
            diff: metricDiff(stats.visibility) ?? metricDiff(dash?.statistics?.visibility), 
            id: 'senuto_visibility' 
          },
        ].map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                {card.label}
                <InfoTooltip id={card.id as any} />
              </CardDescription>
              <CardTitle className="text-3xl font-bold">
                {formatNumber(card.value || 0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {card.diff !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${card.diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {card.diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {formatNumber(Math.abs(card.diff))} {card.diff >= 0 ? 'wzrost' : 'spadek'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Domain Rank</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(metricValue(stats.domain_rank))}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ads Equivalent</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(metricValue(stats.ads_equivalent))} PLN</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AIO Keywords</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(aioKeywordsCount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cytowania AIO</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(aioCitationsCount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Śr. pozycja AIO</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatScore(aioAvgPos)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
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

      <div className="grid grid-cols-1 @lg:grid-cols-3 gap-6">
        <Card className="@lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Konkurenci w Google
            </CardTitle>
            <CardDescription>Domeny o najbardziej zbliżonym profilu słów kluczowych</CardDescription>
          </CardHeader>
          <CardContent>
            <CompetitorsDualBarChart competitors={vis.competitors || []} />
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
                  <Badge variant="outline" className="text-[10px]">{formatNumber(s.statistics?.visibility?.recent_value || 0)} pkt</Badge>
                </div>
              ))}
              {(vis.sections || []).length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">Brak danych o sekcjach.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Rozkład intencji
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IntentDistributionPieChart data={intentData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Rozkład trudności
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyDistributionChart data={difficultyData} />
          </CardContent>
        </Card>
      </div>

      {Object.keys(aioPositionDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Rozkład pozycji wejścia do AIO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIOPositionDistributionChart data={aioPositionDistribution} />
          </CardContent>
        </Card>
      )}

      {managementSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kolejne kroki (AI)</CardTitle>
            <CardDescription>Rekomendowana kolejność działań dla zespołu.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              {managementSteps.slice(0, 8).map((step: string, idx: number) => (
                <li key={`${step}-${idx}`}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PositionsTab({ data, title, filename }: { data: any[]; title: string; filename: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataExplorerTable
          data={data}
          columns={keywordColumns()}
          pageSize={20}
          exportFilename={filename}
          searchPlaceholder="Szukaj frazy, URL, intencji..."
        />
      </CardContent>
    </Card>
  )
}

function RawDataTab({ vis }: { vis: any }) {
  const [activeDataset, setActiveDataset] = useState('positions')
  
  const datasets: Record<string, { label: string; data: any[] }> = {
    positions: { label: 'Pozycje', data: vis.positions || [] },
    wins: { label: 'Wzrosty', data: vis.wins || [] },
    losses: { label: 'Spadki', data: vis.losses || [] },
    competitors: { label: 'Konkurenci', data: vis.competitors || [] },
    sections: { label: 'Sekcje', data: vis.sections || [] },
  }

  const currentData = datasets[activeDataset].data || []

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

function SectionsTab({ vis }: { vis: any }) {
  const [active, setActive] = useState('subdomains')
  const datasets: Record<string, any[]> = {
    subdomains: vis.sections_subdomains || [],
    paths: vis.sections || [],
    urls: vis.sections_urls || [],
  }
  const data = datasets[active] || []
  const columns = [
    {
      key: 'name',
      label: active === 'subdomains' ? 'Subdomena' : active === 'paths' ? 'Ścieżka' : 'URL',
      render: (_: any, row: any) => row.domain || row.section || row.url || row.subdomain || '—',
      className: 'max-w-[400px]',
      maxWidth: '400px',
    },
    { key: 'keywords_count', label: 'Słowa TOP10', render: (_: any, row: any) => formatNumber(row.keywords_count || 0) },
    {
      key: 'vis',
      label: 'Szac. ruch',
      render: (_: any, row: any) => formatNumber(row.statistics?.visibility?.current || row.statistics?.visibility?.recent_value || 0),
    },
    {
      key: 'diff',
      label: 'Zmiana ruchu',
      render: (_: any, row: any) => {
        const diff = row.statistics?.visibility?.diff ?? 0
        if (diff === 0) return <Badge variant="outline">0</Badge>
        return <Badge variant={diff > 0 ? 'default' : 'destructive'}>{diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff)}</Badge>
      },
    },
    { key: 'top3', label: 'TOP3', render: (_: any, row: any) => formatNumber(row.statistics?.top3?.current || row.statistics?.top3?.recent_value || 0) },
    { key: 'top10', label: 'TOP10', render: (_: any, row: any) => formatNumber(row.statistics?.top10?.current || row.statistics?.top10?.recent_value || 0) },
    { key: 'top50', label: 'TOP50', render: (_: any, row: any) => formatNumber(row.statistics?.top50?.current || row.statistics?.top50?.recent_value || 0) },
  ]

  return (
    <div className="space-y-6">
      <Tabs value={active} onValueChange={setActive}>
        <TabsList>
          <TabsTrigger value="subdomains">Subdomeny</TabsTrigger>
          <TabsTrigger value="paths">Ścieżki</TabsTrigger>
          <TabsTrigger value="urls">URLs</TabsTrigger>
        </TabsList>
      </Tabs>
      <DataExplorerTable data={data} columns={columns} pageSize={20} exportFilename={`widocznosc_sections_${active}`} />
    </div>
  )
}

function CannibalizationTab({ vis }: { vis: any }) {
  const data = vis?.cannibalization?.keywords || []
  const pairGroups = Array.from(
    data.reduce((acc: Map<string, any>, row: any) => {
      const currentUrl = row?.statistics?.url?.current || '—'
      const previousUrl = row?.statistics?.url?.previous || '—'
      const pairKey = [currentUrl, previousUrl].sort().join(' || ')
      const searches = Number(row?.statistics?.searches?.current || 0)

      if (!acc.has(pairKey)) {
        acc.set(pairKey, {
          pairKey,
          currentUrl,
          previousUrl,
          keywords: [],
          keywordCount: 0,
          totalSearches: 0,
        })
      }
      const group = acc.get(pairKey)
      group.keywords.push(row)
      group.keywordCount += 1
      group.totalSearches += searches
      return acc
    }, new Map<string, any>())
    .values()
  ).sort((a: any, b: any) => b.totalSearches - a.totalSearches)

  const totalCannibalizedKeywords = data.length
  const totalUrlPairs = pairGroups.length

  const columns = [
    { key: 'keyword', label: 'Słowo kluczowe', className: 'font-medium max-w-[280px]', maxWidth: '280px' },
    {
      key: 'position',
      label: 'Pozycja',
      render: (_: any, row: any) => row.statistics?.position?.current || '—',
    },
    {
      key: 'diff',
      label: 'Zmiana',
      render: (_: any, row: any) => {
        const diff = row.statistics?.position?.diff ?? 0
        if (diff === 0) return <Badge variant="outline">0</Badge>
        return <Badge variant={diff < 0 ? 'default' : 'destructive'}>{diff < 0 ? `+${Math.abs(diff)}` : `-${diff}`}</Badge>
      },
    },
    {
      key: 'history',
      label: 'Historia',
      sortable: false,
      render: (_: any, row: any) => <PositionSparkline history={row.statistics?.position?.history || {}} />,
    },
    {
      key: 'searches',
      label: 'Wyszukiwania',
      render: (_: any, row: any) => formatNumber(row.statistics?.searches?.current || 0),
    },
    {
      key: 'traffic',
      label: 'Szac. ruch',
      render: (_: any, row: any) => formatNumber(getTrafficEstimate(row)),
    },
    {
      key: 'trends',
      label: 'Trendy',
      sortable: false,
      render: (_: any, row: any) => <TrendsSparkline trend={row.statistics?.trends?.history || []} />,
    },
    {
      key: 'difficulty',
      label: 'Trudność',
      render: (_: any, row: any) => <DifficultyBadge value={row.statistics?.difficulty?.current} />,
    },
    {
      key: 'url',
      label: 'URL current/prev',
      className: 'max-w-[300px]',
      maxWidth: '300px',
      render: (_: any, row: any) => (
        <div className="space-y-1">
          <div className="text-[10px] truncate">{row.statistics?.url?.current || '—'}</div>
          <div className="text-[10px] text-muted-foreground truncate">{row.statistics?.url?.previous || '—'}</div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
        <Card className="@md:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Podsumowanie kanibalizacji</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatNumber(totalCannibalizedKeywords)} fraz kanibalizowanych na {formatNumber(totalUrlPairs)} parach URL
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Największa para (SV)</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatNumber(pairGroups[0]?.totalSearches || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Łączny search volume top pary URL.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pary URL najczęściej zamieniające się rankingiem</CardTitle>
          <CardDescription>Posortowane po łącznym search volume.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pairGroups.length > 0 ? (
            pairGroups.slice(0, 12).map((group: any) => (
              <div key={group.pairKey} className="rounded-lg border p-3 bg-accent/10">
                <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-2 mb-2">
                  <div className="text-xs space-y-1">
                    <p className="font-semibold truncate">{group.currentUrl}</p>
                    <p className="text-muted-foreground truncate">{group.previousUrl}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{formatNumber(group.keywordCount)} fraz</Badge>
                    <Badge>{formatNumber(group.totalSearches)} SV</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.keywords.slice(0, 6).map((row: any, idx: number) => (
                    <Badge key={`${group.pairKey}-${idx}`} variant="secondary" className="text-[10px]">
                      {row?.keyword || '—'}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Brak par URL do pokazania.</p>
          )}
        </CardContent>
      </Card>

      <DataExplorerTable data={data} columns={columns} pageSize={20} exportFilename="widocznosc_kanibalizacja" />
    </div>
  )
}

function TrafficImpactTab({ estimation }: { estimation: any }) {
  const bracketsObject = estimation?.by_position_bracket || {}
  const bracketRows = Object.entries(bracketsObject).map(([key, value]: [string, any]) => ({
    key,
    label: value?.label || key,
    keywords: toNumber(value?.keywords, 0),
    estimated_traffic: toNumber(value?.estimated_traffic, 0),
  }))
  const maxTraffic = Math.max(1, ...bracketRows.map((row) => row.estimated_traffic))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 @md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Szacowany ruch miesieczny</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(estimation?.total_estimated_monthly || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Potencjal miesieczny</CardDescription>
            <CardTitle className="text-3xl font-bold">{formatNumber(estimation?.potential_monthly || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Potencjalny wzrost</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">+{formatNumber(estimation?.potential_gain || 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ruch wg przedzialu pozycji</CardTitle>
          <CardDescription>Rozklad estymowanego ruchu pomiedzy TOP3, TOP10, TOP20 i dalsze pozycje.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bracketRows.map((row) => (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted-foreground">
                  {formatNumber(row.estimated_traffic)} ruchu • {formatNumber(row.keywords)} fraz
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(2, (row.estimated_traffic / maxTraffic) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top frazy napedzajace ruch</CardTitle>
        </CardHeader>
        <CardContent>
          <DataExplorerTable
            data={Array.isArray(estimation?.top_traffic_keywords) ? estimation.top_traffic_keywords : []}
            columns={[
              { key: 'keyword', label: 'Fraza', className: 'font-medium max-w-[280px]', maxWidth: '280px' },
              { key: 'position', label: 'Pozycja' },
              { key: 'search_volume', label: 'Wyszuk.' },
              { key: 'estimated_traffic', label: 'Szac. ruch' },
              { key: 'url', label: 'URL', className: 'max-w-[320px]', maxWidth: '320px' },
            ]}
            pageSize={20}
            exportFilename="traffic_top_keywords"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 @lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top URL-e wg ruchu</CardTitle>
          </CardHeader>
          <CardContent>
            <DataExplorerTable
              data={Array.isArray(estimation?.top_traffic_urls) ? estimation.top_traffic_urls : []}
              columns={[
                { key: 'url', label: 'URL', className: 'max-w-[340px]', maxWidth: '340px' },
                { key: 'estimated_traffic', label: 'Szac. ruch' },
              ]}
              pageSize={10}
              exportFilename="traffic_top_urls"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top opportunities</CardTitle>
            <CardDescription>Frazy, gdzie przesuniecie do TOP3 daje najwiekszy wzrost ruchu.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataExplorerTable
              data={Array.isArray(estimation?.top_opportunities) ? estimation.top_opportunities : []}
              columns={[
                { key: 'keyword', label: 'Fraza', className: 'font-medium max-w-[260px]', maxWidth: '260px' },
                { key: 'current_pos', label: 'Akt. pozycja' },
                { key: 'target_pos', label: 'Cel' },
                { key: 'search_volume', label: 'Wyszuk.' },
                { key: 'gain', label: 'Potencjal +', render: (_: any, row: any) => `+${formatNumber(toNumber(row?.gain, 0))}` },
              ]}
              pageSize={10}
              exportFilename="traffic_opportunities"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VisibilityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
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
      const data = query?.state?.data as any
      const isRunning = data?.status === 'processing' || data?.status === 'pending'
      const isAiRunning = data?.ai_status === 'processing'
      const isPlanRunning = data?.execution_plan_status === 'processing'
      return (isRunning || isAiRunning || isPlanRunning) ? 3000 : false
    },
  })

  const { data: tasksResponse, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', params.id, 'visibility'],
    queryFn: () => auditsAPI.getTasks(params.id, { module: 'visibility' }),
    enabled: isAuth && !!audit && mode === 'plan',
    refetchInterval: mode === 'plan' && audit?.execution_plan_status === 'processing' ? 3000 : false,
  })

  const tasks = tasksResponse?.items || []
  const aiContext = audit?.results?.ai_contexts?.visibility

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

  // Keep all hooks above conditional returns to avoid hook-order mismatch between renders.
  const senuto = audit?.results?.senuto
  const vis = senuto?.visibility || {}
  const stats = vis.statistics?.statistics || {}
  const dash = vis.dashboard || {}
  const positions = vis.positions || []
  const positionsCount = Number(senuto?._meta?.positions_count || positions.length || 0)
  const positionsTotal = Number(senuto?._meta?.positions_total || positionsCount || 0)
  const samplingPct = positionsTotal > 0 ? (positionsCount / positionsTotal) * 100 : 100
  const isSampled = positionsTotal > positionsCount
  const wins = vis.wins || []
  const losses = vis.losses || []

  const increases = useMemo(() => [...positions].filter((p: any) => getDiff(p) < 0).sort((a: any, b: any) => getDiff(a) - getDiff(b)), [positions])
  const decreases = useMemo(() => [...positions].filter((p: any) => getDiff(p) > 0).sort((a: any, b: any) => getDiff(b) - getDiff(a)), [positions])

  const intentData = useMemo(() => {
    const counter: Record<string, number> = {}
    positions.forEach((p: any) => {
      const key = p?.statistics?.intentions?.main_intent || 'unknown'
      counter[key] = (counter[key] || 0) + 1
    })
    return Object.entries(counter).map(([name, value]) => ({ name, value }))
  }, [positions])

  const totalTraffic = useMemo(
    () => positions.reduce((acc: number, row: any) => acc + getTrafficEstimate(row), 0),
    [positions]
  )

  const difficultyRows = useMemo(() => {
    const groups: Record<string, any[]> = {}
    positions.forEach((row: any) => {
      const d = Math.max(0, Math.min(100, getDifficulty(row)))
      const rangeStart = Math.floor((d === 100 ? 99 : d) / 10) * 10 + 1
      const key = makeRangeLabel(rangeStart, 10)
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
    })
    return buildFeatureRows(groups, totalTraffic).sort((a, b) => Number(a.range.split('-')[0]) - Number(b.range.split('-')[0]))
  }, [positions, totalTraffic])

  const difficultyChartData = useMemo(
    () => difficultyRows.map((r) => ({ range: r.range, count: r.top50 })),
    [difficultyRows]
  )

  const searchesRows = useMemo(() => {
    const buckets: Record<string, any[]> = {
      '0-10': [],
      '11-50': [],
      '51-100': [],
      '101-500': [],
      '501-1000': [],
      '1001+': [],
    }
    positions.forEach((row: any) => {
      const s = getSearches(row)
      if (s <= 10) buckets['0-10'].push(row)
      else if (s <= 50) buckets['11-50'].push(row)
      else if (s <= 100) buckets['51-100'].push(row)
      else if (s <= 500) buckets['101-500'].push(row)
      else if (s <= 1000) buckets['501-1000'].push(row)
      else buckets['1001+'].push(row)
    })
    return buildFeatureRows(buckets, totalTraffic)
  }, [positions, totalTraffic])

  const serpRows = useMemo(() => {
    const buckets: Record<string, any[]> = {}
    positions.forEach((row: any) => {
      const snippets = getSnippets(row)
      if (snippets.length === 0) {
        buckets['Brak snippetów'] = [...(buckets['Brak snippetów'] || []), row]
      } else {
        snippets.forEach((snippet) => {
          if (!buckets[snippet]) buckets[snippet] = []
          buckets[snippet].push(row)
        })
      }
    })
    return buildFeatureRows(buckets, totalTraffic).sort((a, b) => b.top50 - a.top50)
  }, [positions, totalTraffic])

  const wordsRows = useMemo(() => {
    const buckets: Record<string, any[]> = { '1': [], '2': [], '3': [], '4': [], '5': [], '6+': [] }
    positions.forEach((row: any) => {
      const wc = row?.words_count || 0
      if (wc <= 1) buckets['1'].push(row)
      else if (wc === 2) buckets['2'].push(row)
      else if (wc === 3) buckets['3'].push(row)
      else if (wc === 4) buckets['4'].push(row)
      else if (wc === 5) buckets['5'].push(row)
      else buckets['6+'].push(row)
    })
    return buildFeatureRows(buckets, totalTraffic)
  }, [positions, totalTraffic])

  const peakRows = useMemo(() => {
    const buckets: Record<string, any[]> = Object.fromEntries(MONTHS.map((m) => [m, []]))
    positions.forEach((row: any) => {
      const trend = row?.statistics?.trends?.history || []
      if (!Array.isArray(trend) || trend.length === 0) return
      const max = Math.max(...trend)
      const idx = trend.findIndex((v: number) => v === max)
      if (idx >= 0) buckets[MONTHS[idx]].push(row)
    })
    return buildFeatureRows(buckets, totalTraffic)
  }, [positions, totalTraffic])

  const serpFeatureChartData = useMemo(
    () => serpRows.slice(0, 12).map((r) => ({ name: r.range, count: r.top50 })),
    [serpRows]
  )
  const searchesChartData = useMemo(() => searchesRows.map((r) => ({ range: r.range, count: r.top50 })), [searchesRows])
  const wordsChartData = useMemo(() => wordsRows.map((r) => ({ range: r.range, count: r.top50 })), [wordsRows])
  const peakChartData = useMemo(() => peakRows.map((r) => ({ month: r.range, count: r.top50 })), [peakRows])
  const trafficEstimation = useMemo(() => {
    const raw = audit?.results?.traffic_estimation
    if (raw && typeof raw === 'object') {
      return raw
    }
    return buildTrafficFallback(positions)
  }, [audit?.results?.traffic_estimation, positions])

  if (!isAuth || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!senuto || !senuto.visibility) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Brak danych widoczności</h1>
        <p className="text-muted-foreground">Analiza widoczności nie została przeprowadzona dla tego audytu.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Globe2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Analiza Widoczności</h1>
          <p className="text-sm text-muted-foreground">Baza: {senuto.country_id === 200 ? 'Polska 2.0' : 'Inna'} • Tryb: {senuto.fetch_mode}</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="positions">Pozycje</TabsTrigger>
            <TabsTrigger value="changes">Wzrosty/Spadki</TabsTrigger>
            <TabsTrigger value="acquired">Pozyskane/Utracone</TabsTrigger>
            <TabsTrigger value="features">Cechy fraz</TabsTrigger>
            <TabsTrigger value="traffic">Traffic Impact</TabsTrigger>
            <TabsTrigger value="sections">Strony</TabsTrigger>
            <TabsTrigger value="cannibalization">Kanibalizacja</TabsTrigger>
            <TabsTrigger value="raw">Surowe dane (RAW)</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-6">
            <OverviewTab vis={vis} stats={stats} dash={dash} intentData={intentData} difficultyData={difficultyChartData} audit={audit!} aiContext={aiContext} />
          </TabsContent>

          <TabsContent value="positions" className="pt-6">
            {positionsTotal > 0 && (
              <Alert
                className={
                  isSampled
                    ? 'mb-4 border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20'
                    : 'mb-4 border-green-300 bg-green-50 dark:border-green-900/60 dark:bg-green-950/20'
                }
              >
                <AlertDescription className="text-sm">
                  Pokazujesz <strong>{formatNumber(positionsCount)}</strong> z{' '}
                  <strong>{formatNumber(positionsTotal)}</strong> fraz ({samplingPct.toFixed(1)}%).
                </AlertDescription>
              </Alert>
            )}
            <PositionsTab data={positions} title="Pozycje słów kluczowych" filename="widocznosc_pozycje" />
          </TabsContent>

          <TabsContent value="changes" className="pt-6">
            <div className="grid grid-cols-1 gap-6">
              <PositionsTab data={increases} title="Wzrosty (największe awanse)" filename="widocznosc_wzrosty" />
              <PositionsTab data={decreases} title="Spadki (największe spadki)" filename="widocznosc_spadki" />
            </div>
          </TabsContent>

          <TabsContent value="acquired" className="pt-6">
            <Tabs defaultValue="wins">
              <TabsList>
                <TabsTrigger value="wins">Pozyskane</TabsTrigger>
                <TabsTrigger value="losses">Utracone</TabsTrigger>
              </TabsList>
              <TabsContent value="wins" className="pt-6">
                <PositionsTab data={wins} title="Pozyskane słowa kluczowe" filename="widocznosc_pozyskane" />
              </TabsContent>
              <TabsContent value="losses" className="pt-6">
                <PositionsTab data={losses} title="Utracone słowa kluczowe" filename="widocznosc_utracone" />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="features" className="pt-6">
            <Tabs defaultValue="difficulty">
              <TabsList>
                <TabsTrigger value="difficulty">Trudność</TabsTrigger>
                <TabsTrigger value="searches">Wyszukiwania</TabsTrigger>
                <TabsTrigger value="serp">SERP</TabsTrigger>
                <TabsTrigger value="trends">Trendy</TabsTrigger>
                <TabsTrigger value="words">Liczba słów</TabsTrigger>
              </TabsList>
              <TabsContent value="difficulty" className="pt-6 space-y-6">
                <Card><CardContent className="pt-6"><DifficultyDistributionChart data={difficultyChartData} /></CardContent></Card>
                <KeywordFeaturesTable title="Trudność fraz" rows={difficultyRows} />
              </TabsContent>
              <TabsContent value="searches" className="pt-6 space-y-6">
                <Card><CardContent className="pt-6"><SearchVolumeDistributionChart data={searchesChartData} /></CardContent></Card>
                <KeywordFeaturesTable title="Wyszukiwania fraz" rows={searchesRows} />
              </TabsContent>
              <TabsContent value="serp" className="pt-6 space-y-6">
                <Card><CardContent className="pt-6"><SerpFeaturesChart data={serpFeatureChartData} /></CardContent></Card>
                <KeywordFeaturesTable title="Cechy SERP" rows={serpRows} />
              </TabsContent>
              <TabsContent value="trends" className="pt-6 space-y-6">
                <Card><CardContent className="pt-6"><TrendsPeakChart data={peakChartData} /></CardContent></Card>
                <KeywordFeaturesTable title="Trendy fraz (peak month)" rows={peakRows} />
              </TabsContent>
              <TabsContent value="words" className="pt-6 space-y-6">
                <Card><CardContent className="pt-6"><WordCountDistributionChart data={wordsChartData} /></CardContent></Card>
                <KeywordFeaturesTable title="Liczba słów w frazie" rows={wordsRows} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="traffic" className="pt-6">
            <TrafficImpactTab estimation={trafficEstimation} />
          </TabsContent>

          <TabsContent value="sections" className="pt-6">
            <SectionsTab vis={vis} />
          </TabsContent>

          <TabsContent value="cannibalization" className="pt-6">
            <CannibalizationTab vis={vis} />
          </TabsContent>

          <TabsContent value="raw" className="pt-6">
            <RawDataTab vis={vis} />
          </TabsContent>
        </Tabs>
      )}

      {mode === 'analysis' && (
        <AnalysisView
          area="visibility"
          aiContext={aiContext}
          isLoading={audit?.ai_status === 'processing'}
        />
      )}

      {mode === 'plan' && (
        <TaskListView
          tasks={tasks}
          module="visibility"
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
