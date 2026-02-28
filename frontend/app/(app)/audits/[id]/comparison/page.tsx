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
  ChevronDown, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Layout
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
    queryFn: () => auditsAPI.getHistory(currentWorkspace!.id, currentAudit!.url),
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
    .map(a => ({
      date: new Date(a.created_at).toLocaleDateString(),
      overall: a.overall_score || 0,
      seo: a.seo_score || 0,
      performance: a.performance_score || 0,
      content: a.content_score || 0,
    }))

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
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Wyników</CardTitle>
              <CardDescription>Zmiana wyników w czasie dla {currentAudit.url}</CardDescription>
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
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="scores">Wyniki</TabsTrigger>
              <TabsTrigger value="technical">Techniczne</TabsTrigger>
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
