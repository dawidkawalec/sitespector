'use client'

/**
 * Comparison Page
 * 
 * Compares the current audit with previous audits of the same URL.
 * Displays trends and delta indicators.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/lib/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Loader2, ArrowLeftRight, TrendingUp, TrendingDown, Minus, Calendar, ExternalLink,
  CheckCircle2, AlertCircle
} from 'lucide-react'
import { formatScore, getScoreColor, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import type { Audit } from '@/lib/api'

interface KeywordDeltaRow {
  keyword: string
  previousPosition: number | null
  currentPosition: number | null
  delta: number | null
  searchVolume: number
  url: string
  kind: 'improved' | 'declined' | 'new' | 'lost' | 'stable'
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getTechnicalHealthScore(audit: Audit | null | undefined): number {
  return toNumber(audit?.results?.technical_health_index?.score, 0)
}

function getVisibilityMomentumScore(audit: Audit | null | undefined): number {
  return toNumber(audit?.results?.visibility_momentum?.score, 0)
}

function getAiReadinessScore(audit: Audit | null | undefined): number {
  return toNumber(audit?.results?.crawl?.ai_readiness?.score, 0)
}

function getSearches(row: any): number {
  return toNumber(
    row?.statistics?.searches?.current ??
      row?.search_volume ??
      row?.searches ??
      row?.monthly_searches,
    0
  )
}

function getKeyword(row: any): string {
  const raw = row?.keyword ?? row?.phrase ?? row?.name ?? ''
  return typeof raw === 'string' ? raw.trim() : ''
}

function getPosition(row: any): number | null {
  const raw =
    row?.statistics?.position?.current ??
    row?.position ??
    row?.current_position ??
    row?.best_position
  if (raw === null || raw === undefined) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value)
}

function getKeywordUrl(row: any): string {
  const raw =
    row?.statistics?.url?.current ??
    row?.url ??
    row?.landing_page ??
    row?.best_url ??
    ''
  return typeof raw === 'string' ? raw : ''
}

function getPositionsList(audit: Audit | null | undefined): any[] {
  const rows = audit?.results?.senuto?.visibility?.positions
  return Array.isArray(rows) ? rows : []
}

function buildKeywordDeltaRows(currentAudit: Audit, comparisonAudit: Audit | null): KeywordDeltaRow[] {
  if (!comparisonAudit) return []

  const currentRows = getPositionsList(currentAudit)
  const previousRows = getPositionsList(comparisonAudit)
  const currentMap = new Map<string, any>()
  const previousMap = new Map<string, any>()

  currentRows.forEach((row) => {
    const keyword = getKeyword(row)
    if (keyword && !currentMap.has(keyword)) {
      currentMap.set(keyword, row)
    }
  })

  previousRows.forEach((row) => {
    const keyword = getKeyword(row)
    if (keyword && !previousMap.has(keyword)) {
      previousMap.set(keyword, row)
    }
  })

  const allKeywords = new Set<string>([
    ...Array.from(currentMap.keys()),
    ...Array.from(previousMap.keys()),
  ])

  const rows: KeywordDeltaRow[] = []
  allKeywords.forEach((keyword) => {
    const currentRow = currentMap.get(keyword)
    const previousRow = previousMap.get(keyword)
    const currentPosition = getPosition(currentRow)
    const previousPosition = getPosition(previousRow)
    const currentSearches = getSearches(currentRow)
    const previousSearches = getSearches(previousRow)
    const searchVolume = Math.max(currentSearches, previousSearches)
    const url = getKeywordUrl(currentRow) || getKeywordUrl(previousRow)

    let delta: number | null = null
    if (currentPosition !== null && previousPosition !== null) {
      delta = previousPosition - currentPosition
    }

    let kind: KeywordDeltaRow['kind'] = 'stable'
    if (previousPosition === null && currentPosition !== null) {
      kind = 'new'
    } else if (previousPosition !== null && currentPosition === null) {
      kind = 'lost'
    } else if (delta !== null && delta > 0) {
      kind = 'improved'
    } else if (delta !== null && delta < 0) {
      kind = 'declined'
    }

    rows.push({
      keyword,
      previousPosition,
      currentPosition,
      delta,
      searchVolume,
      url,
      kind,
    })
  })

  return rows.sort((a, b) => {
    const scoreA = Math.abs(a.delta ?? 0) * 100000 + a.searchVolume
    const scoreB = Math.abs(b.delta ?? 0) * 100000 + b.searchVolume
    return scoreB - scoreA
  })
}

export default function ComparisonPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)
  const { currentWorkspace } = useWorkspace()

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

  // 1. Get current audit
  const { data: currentAudit, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuth,
  })

  // 2. Get history for this URL
  const { data: history, isLoading: isLoadingHistory, isError: isErrorHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['audit-history', currentAudit?.url, currentWorkspace?.id],
    queryFn: () => auditsAPI.getHistory(currentWorkspace!.id, currentAudit!.url, currentAudit?.project_id || undefined),
    enabled: !!currentAudit?.url && !!currentWorkspace?.id,
  })

  const [comparisonId, setComparisonId] = useState<string>("")
  const audits = history || []

  // Set default comparison audit (the one before current)
  useEffect(() => {
    if (!currentAudit) return
    if (audits.length > 1 && !comparisonId) {
      const idx = audits.findIndex((a) => a.id === currentAudit.id)
      if (idx !== -1 && audits[idx + 1]) {
        setComparisonId(audits[idx + 1].id)
      } else if (idx !== 0) {
        setComparisonId(audits[0].id)
      }
    }
  }, [audits, currentAudit, comparisonId])

  if (!isAuth || isLoadingCurrent || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isErrorHistory) {
    return (
      <div className="container mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Błąd ładowania historii</h2>
        <p className="text-muted-foreground">Nie udało się pobrać poprzednich audytów dla tego adresu URL.</p>
        <Button onClick={() => refetchHistory()}>Spróbuj ponownie</Button>
      </div>
    )
  }

  if (!currentAudit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie został znaleziony.</p>
      </div>
    )
  }

  const comparisonAudit = audits.find(a => a.id === comparisonId) || (audits.length > 1 ? audits[1] : null)
  const previousAudit = comparisonAudit // for backward compatibility in existing code

  // Prepare chart data (chronological order)
  const chartData = [...audits]
    .reverse()
    .map(a => {
      const technicalRaw = a?.results?.technical_health_index?.score
      const aiRaw = a?.results?.crawl?.ai_readiness?.score
      const momentumRaw = a?.results?.visibility_momentum?.score
      return {
        date: new Date(a.created_at).toLocaleDateString(),
        overall: a.overall_score || 0,
        seo: a.seo_score || 0,
        performance: a.performance_score || 0,
        content: a.content_score || 0,
        technicalHealth: technicalRaw === null || technicalRaw === undefined ? null : toNumber(technicalRaw, 0),
        aiReadiness: aiRaw === null || aiRaw === undefined ? null : toNumber(aiRaw, 0),
        momentumNormalized:
          momentumRaw === null || momentumRaw === undefined ? null : ((toNumber(momentumRaw, 0) + 100) / 2),
      }
    })

  const getDelta = (current: number | null | undefined, previous: number | null | undefined) => {
    if (current === null || current === undefined || previous === null || previous === undefined) return null
    return current - previous
  }

  const DeltaIndicator = ({ value }: { value: number | null }) => {
    if (value === null) return null
    if (value > 0) return <span className="text-green-600 flex items-center gap-0.5 text-xs font-bold"><TrendingUp className="h-3 w-3" /> +{value}</span>
    if (value < 0) return <span className="text-red-600 flex items-center gap-0.5 text-xs font-bold"><TrendingDown className="h-3 w-3" /> {value}</span>
    return <span className="text-muted-foreground flex items-center gap-0.5 text-xs font-bold"><Minus className="h-3 w-3" /> 0</span>
  }

  const keywordDeltaRows = buildKeywordDeltaRows(currentAudit, comparisonAudit)
  const improvedKeywords = keywordDeltaRows.filter((row) => row.kind === 'improved').length
  const declinedKeywords = keywordDeltaRows.filter((row) => row.kind === 'declined').length
  const newKeywords = keywordDeltaRows.filter((row) => row.kind === 'new').length
  const lostKeywords = keywordDeltaRows.filter((row) => row.kind === 'lost').length
  const movedToPageOne = keywordDeltaRows.filter(
    (row) => row.previousPosition !== null && row.previousPosition > 10 && row.currentPosition !== null && row.currentPosition <= 10
  ).length

  const thiDelta = getDelta(getTechnicalHealthScore(currentAudit), getTechnicalHealthScore(comparisonAudit))
  const momentumDelta = getDelta(getVisibilityMomentumScore(currentAudit), getVisibilityMomentumScore(comparisonAudit))
  const aiReadinessDelta = getDelta(getAiReadinessScore(currentAudit), getAiReadinessScore(comparisonAudit))
  const hasTechnicalHealthTrend = chartData.some((point) => point.technicalHealth !== null)
  const hasAiReadinessTrend = chartData.some((point) => point.aiReadiness !== null)
  const hasMomentumTrend = chartData.some((point) => point.momentumNormalized !== null)

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Porównanie Audytów</h1>
        </div>
        
        {audits.length > 1 && (
          <div className="flex items-center gap-3 bg-accent/30 p-2 rounded-lg border">
            <span className="text-xs font-medium text-muted-foreground">Porównaj z:</span>
            <Select value={comparisonId} onValueChange={setComparisonId}>
              <SelectTrigger className="w-[220px] h-9 text-xs bg-white dark:bg-gray-950">
                <SelectValue placeholder="Wybierz audyt..." />
              </SelectTrigger>
              <SelectContent>
                {audits.filter(a => a.id !== currentAudit.id).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="font-medium">{formatDate(a.created_at).split(',')[0]}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">Score: {formatScore(a.overall_score || 0)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {audits.length < 2 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Brak historii dla tego URL</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Aby zobaczyć trendy i porównać wyniki, musisz wykonać co najmniej dwa audyty dla tego samego adresu URL.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-primary/25 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">ROI od ostatniego audytu</CardTitle>
              <CardDescription>
                Szybki dowod postepu na metrykach 3A i zmianach keywordow.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 @md:grid-cols-5 gap-3">
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">THI</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold">{Math.round(getTechnicalHealthScore(currentAudit))}</span>
                    <DeltaIndicator value={thiDelta} />
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Momentum</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold">{getVisibilityMomentumScore(currentAudit).toFixed(1)}</span>
                    <DeltaIndicator value={momentumDelta} />
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">AI Readiness</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold">{Math.round(getAiReadinessScore(currentAudit))}</span>
                    <DeltaIndicator value={aiReadinessDelta} />
                  </div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Frazy do TOP10</p>
                  <p className="mt-1 text-lg font-bold text-green-600">+{movedToPageOne}</p>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Bilans fraz</p>
                  <p className="mt-1 text-lg font-bold">{improvedKeywords - declinedKeywords}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Wyników</CardTitle>
              <CardDescription>Zmiana wynikow i metryk 3A w czasie dla {currentAudit.url}</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSeo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  <Area type="monotone" dataKey="overall" name="Wynik Ogólny" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOverall)" strokeWidth={3} />
                  <Area type="monotone" dataKey="seo" name="SEO" stroke="#10b981" fillOpacity={1} fill="url(#colorSeo)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="performance" name="Wydajność" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPerformance)" strokeWidth={2.5} />
                  {hasTechnicalHealthTrend && (
                    <Area
                      type="monotone"
                      dataKey="technicalHealth"
                      name="THI"
                      stroke="#7c3aed"
                      fillOpacity={0}
                      strokeWidth={2}
                    />
                  )}
                  {hasAiReadinessTrend && (
                    <Area
                      type="monotone"
                      dataKey="aiReadiness"
                      name="AI Readiness"
                      stroke="#0d9488"
                      fillOpacity={0}
                      strokeWidth={2}
                    />
                  )}
                  {hasMomentumTrend && (
                    <Area
                      type="monotone"
                      dataKey="momentumNormalized"
                      name="Momentum (norm.)"
                      stroke="#dc2626"
                      fillOpacity={0}
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Delta Comparison Cards */}
          <div className="grid grid-cols-2 @lg:grid-cols-4 gap-4">
            {[
              { label: 'Ogólny', current: currentAudit.overall_score, prev: previousAudit?.overall_score },
              { label: 'SEO', current: currentAudit.seo_score, prev: previousAudit?.seo_score },
              { label: 'Wydajność', current: currentAudit.performance_score, prev: previousAudit?.performance_score },
              { label: 'Treść', current: currentAudit.content_score, prev: previousAudit?.content_score },
            ].map((item, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-wider">{item.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className={`text-3xl font-bold ${getScoreColor(item.current)}`}>{formatScore(item.current)}</div>
                    <div className="pb-1">
                      <DeltaIndicator value={getDelta(item.current, item.prev)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Side-by-Side Detail Comparison */}
          <Tabs defaultValue="scores" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:w-[560px]">
              <TabsTrigger value="scores">Wyniki</TabsTrigger>
              <TabsTrigger value="technical">Techniczne</TabsTrigger>
              <TabsTrigger value="positions">Pozycje</TabsTrigger>
              <TabsTrigger value="issues">Problemy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scores" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-6">
                {/* Current Audit Scores */}
                <Card className="border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge>BIEŻĄCY</Badge>
                      {formatDate(currentAudit.created_at)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'SEO', score: currentAudit.seo_score },
                      { label: 'Wydajność', score: currentAudit.performance_score },
                      { label: 'Treść', score: currentAudit.content_score },
                    ].map((s, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{s.label}</span>
                          <span className="font-bold">{formatScore(s.score)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div className={cn("h-full", getScoreColor(s.score).replace('text-', 'bg-'))} style={{ width: `${s.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Comparison Audit Scores */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Badge variant="outline">POPRZEDNI</Badge>
                      {comparisonAudit ? formatDate(comparisonAudit.created_at) : 'Brak danych'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {comparisonAudit ? [
                      { label: 'SEO', score: comparisonAudit.seo_score },
                      { label: 'Wydajność', score: comparisonAudit.performance_score },
                      { label: 'Treść', score: comparisonAudit.content_score },
                    ].map((s, i) => (
                      <div key={i} className="space-y-1 opacity-70">
                        <div className="flex justify-between text-xs">
                          <span>{s.label}</span>
                          <span className="font-bold">{formatScore(s.score)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-muted-foreground/40" style={{ width: `${s.score}%` }} />
                        </div>
                      </div>
                    )) : (
                      <div className="h-full flex items-center justify-center py-10 text-xs text-muted-foreground italic">
                        Wybierz audyt do porównania
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6 pt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metryka</TableHead>
                        <TableHead className="text-center">{comparisonAudit ? formatDate(comparisonAudit.created_at).split(',')[0] : 'Poprzedni'}</TableHead>
                        <TableHead className="text-center">Bieżący</TableHead>
                        <TableHead className="text-right">Zmiana</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { label: 'Liczba stron', cur: currentAudit.results?.crawl?.pages_crawled, prev: comparisonAudit?.results?.crawl?.pages_crawled },
                        { label: 'Błędy 404', cur: currentAudit.results?.crawl?.links?.broken, prev: comparisonAudit?.results?.crawl?.links?.broken, inverse: true },
                        { label: 'Brak Canonical', cur: currentAudit.results?.crawl?.technical_seo?.missing_canonical, prev: comparisonAudit?.results?.crawl?.technical_seo?.missing_canonical, inverse: true },
                        { label: 'LCP (ms)', cur: currentAudit.results?.lighthouse?.desktop?.lcp, prev: comparisonAudit?.results?.lighthouse?.desktop?.lcp, inverse: true },
                        { label: 'TTFB (ms)', cur: currentAudit.results?.lighthouse?.desktop?.ttfb, prev: comparisonAudit?.results?.lighthouse?.desktop?.ttfb, inverse: true },
                        { label: 'Word Count (avg)', cur: currentAudit.results?.content_analysis?.word_count, prev: comparisonAudit?.results?.content_analysis?.word_count },
                        { label: 'THI', cur: getTechnicalHealthScore(currentAudit), prev: getTechnicalHealthScore(comparisonAudit) },
                        { label: 'AI Readiness', cur: getAiReadinessScore(currentAudit), prev: getAiReadinessScore(comparisonAudit) },
                        { label: 'Visibility Momentum', cur: getVisibilityMomentumScore(currentAudit), prev: getVisibilityMomentumScore(comparisonAudit) },
                      ].map((row, i) => {
                        const delta = getDelta(row.cur, row.prev)
                        const isGood = row.inverse ? (delta !== null && delta < 0) : (delta !== null && delta > 0)
                        const isBad = row.inverse ? (delta !== null && delta > 0) : (delta !== null && delta < 0)
                        
                        return (
                          <TableRow key={i}>
                            <TableCell className="text-xs font-medium">{row.label}</TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground">{row.prev ?? '-'}</TableCell>
                            <TableCell className="text-center text-xs font-bold">{row.cur ?? '-'}</TableCell>
                            <TableCell className="text-right">
                              {delta !== null ? (
                                <Badge variant="outline" className={cn(
                                  "text-[10px]",
                                  isGood && "text-green-600 border-green-200 bg-green-50",
                                  isBad && "text-red-600 border-red-200 bg-red-50"
                                )}>
                                  {delta > 0 ? `+${delta}` : delta}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="positions" className="space-y-6 pt-4">
              <div className="grid grid-cols-2 @md:grid-cols-5 gap-3">
                <div className="rounded-lg border p-3 bg-accent/5">
                  <p className="text-[10px] uppercase text-muted-foreground">Improved</p>
                  <p className="text-2xl font-bold text-green-600">{improvedKeywords}</p>
                </div>
                <div className="rounded-lg border p-3 bg-accent/5">
                  <p className="text-[10px] uppercase text-muted-foreground">Declined</p>
                  <p className="text-2xl font-bold text-red-600">{declinedKeywords}</p>
                </div>
                <div className="rounded-lg border p-3 bg-accent/5">
                  <p className="text-[10px] uppercase text-muted-foreground">New</p>
                  <p className="text-2xl font-bold">{newKeywords}</p>
                </div>
                <div className="rounded-lg border p-3 bg-accent/5">
                  <p className="text-[10px] uppercase text-muted-foreground">Lost</p>
                  <p className="text-2xl font-bold">{lostKeywords}</p>
                </div>
                <div className="rounded-lg border p-3 bg-accent/5">
                  <p className="text-[10px] uppercase text-muted-foreground">Do TOP10</p>
                  <p className="text-2xl font-bold text-primary">+{movedToPageOne}</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Delta keywordow</CardTitle>
                  <CardDescription>
                    Porownanie pozycji fraz miedzy {comparisonAudit ? formatDate(comparisonAudit.created_at).split(',')[0] : 'poprzednim'} a biezacym audytem.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fraza</TableHead>
                        <TableHead className="text-center">Poprzednio</TableHead>
                        <TableHead className="text-center">Teraz</TableHead>
                        <TableHead className="text-center">Delta</TableHead>
                        <TableHead className="text-center">SV</TableHead>
                        <TableHead>URL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {keywordDeltaRows.slice(0, 40).map((row) => (
                        <TableRow key={row.keyword}>
                          <TableCell className="max-w-[260px] font-medium truncate">{row.keyword}</TableCell>
                          <TableCell className="text-center text-xs">{row.previousPosition ?? '-'}</TableCell>
                          <TableCell className="text-center text-xs font-bold">{row.currentPosition ?? '-'}</TableCell>
                          <TableCell className="text-center">
                            {row.delta === null ? (
                              <Badge variant="outline">{row.kind === 'new' ? 'NEW' : row.kind === 'lost' ? 'LOST' : '-'}</Badge>
                            ) : row.delta > 0 ? (
                              <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">+{row.delta}</Badge>
                            ) : row.delta < 0 ? (
                              <Badge variant="destructive">{row.delta}</Badge>
                            ) : (
                              <Badge variant="outline">0</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs">{row.searchVolume}</TableCell>
                          <TableCell className="max-w-[280px] text-xs text-muted-foreground truncate">{row.url || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {keywordDeltaRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                            Brak danych pozycji do porownania.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-6">
                {/* Fixed Issues */}
                <Card className="border-green-200 bg-green-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> Naprawione problemy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {/* Simplified logic for demo: compare broken links and missing canonical */}
                    {(comparisonAudit?.results?.crawl?.links?.broken || 0) > (currentAudit.results?.crawl?.links?.broken || 0) && (
                      <div className="text-xs p-2 bg-white rounded border border-green-100 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Naprawiono {(comparisonAudit?.results?.crawl?.links?.broken || 0) - (currentAudit.results?.crawl?.links?.broken || 0)} uszkodzonych linków
                      </div>
                    )}
                    {(comparisonAudit?.results?.crawl?.technical_seo?.missing_canonical || 0) > (currentAudit.results?.crawl?.technical_seo?.missing_canonical || 0) && (
                      <div className="text-xs p-2 bg-white rounded border border-green-100 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Dodano {(comparisonAudit?.results?.crawl?.technical_seo?.missing_canonical || 0) - (currentAudit.results?.crawl?.technical_seo?.missing_canonical || 0)} tagów kanonicznych
                      </div>
                    )}
                    {/* Fallback if no specific improvements detected */}
                    <div className="text-xs text-muted-foreground italic p-4 text-center">
                      Kontynuuj optymalizację aby zobaczyć listę naprawionych błędów.
                    </div>
                  </CardContent>
                </Card>

                {/* New Issues */}
                <Card className="border-red-200 bg-red-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" /> Nowe problemy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(currentAudit.results?.crawl?.links?.broken || 0) > (comparisonAudit?.results?.crawl?.links?.broken || 0) && (
                      <div className="text-xs p-2 bg-white rounded border border-red-100 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Pojawiło się {(currentAudit.results?.crawl?.links?.broken || 0) - (comparisonAudit?.results?.crawl?.links?.broken || 0)} nowych błędów 404
                      </div>
                    )}
                    {(currentAudit.results?.lighthouse?.desktop?.performance_score || 0) < (comparisonAudit?.results?.lighthouse?.desktop?.performance_score || 0) - 5 && (
                      <div className="text-xs p-2 bg-white rounded border border-red-100 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Spadek wydajności o {formatScore((comparisonAudit?.results?.lighthouse?.desktop?.performance_score || 0) - (currentAudit.results?.lighthouse?.desktop?.performance_score || 0))} pkt
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground italic p-4 text-center">
                      Brak nowych krytycznych regresji.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Audit History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Historia Audytów</CardTitle>
              <CardDescription>Pełna lista audytów wykonanych dla tego URL</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-center">Ogólny</TableHead>
                      <TableHead className="text-center">SEO</TableHead>
                      <TableHead className="text-center">Wydajność</TableHead>
                      <TableHead className="text-center">Treść</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audits.map((a) => (
                      <TableRow key={a.id} className={a.id === currentAudit.id ? "bg-accent/30" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {formatDate(a.created_at)}
                            {a.id === currentAudit.id && <Badge variant="outline" className="text-[10px]">BIEŻĄCY</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getScoreColor(a.overall_score).replace('text-', 'bg-')}>{formatScore(a.overall_score)}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{formatScore(a.seo_score)}</TableCell>
                        <TableCell className="text-center font-semibold">{formatScore(a.performance_score)}</TableCell>
                        <TableCell className="text-center font-semibold">{formatScore(a.content_score)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/audits/${a.id}`)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
