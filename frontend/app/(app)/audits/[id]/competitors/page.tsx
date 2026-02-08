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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Trophy, TrendingUp, AlertCircle, CheckCircle2, XCircle, BarChart3 } from 'lucide-react'
import { formatScore, getScoreColor, getStatusBadgeVariant } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import type { Audit } from '@/lib/api'

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

  const competitors = audit.competitors || []
  const compAnalysis = audit.results?.competitive_analysis
  const mainSiteLh = audit.results?.lighthouse?.desktop

  // Prepare chart data
  const chartData = [
    {
      name: 'Twoja Strona',
      performance: audit.performance_score || 0,
      seo: audit.seo_score || 0,
      content: audit.content_score || 0,
      isMain: true,
      status: audit.status
    },
    ...competitors
      .map((c: any) => ({
        name: c.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
        performance: c.results?.lighthouse?.desktop?.performance_score || 0,
        seo: c.results?.lighthouse?.desktop?.seo_score || 0,
        content: c.results?.lighthouse?.desktop?.best_practices_score || 0, // Fallback for content
        isMain: false,
        status: c.status
      }))
  ]

  const getWinner = (metric: string) => {
    if (chartData.length < 2) return null
    return [...chartData].sort((a: any, b: any) => b[metric] - a[metric])[0]
  }

  const perfWinner = getWinner('performance')
  const seoWinner = getWinner('seo')

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza Konkurencji</h1>
      </div>
      
      {competitors.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Brak dodanych konkurentów do porównania.</p>
            <p className="text-sm mt-2">Podczas tworzenia nowego audytu możesz dodać do 3 konkurentów.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Comparison Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Porównanie Wyników</CardTitle>
              <CardDescription>Zestawienie głównych wskaźników Twojej strony i konkurencji</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  />
                  <Legend />
                  <Bar dataKey="performance" name="Performance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="seo" name="SEO" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Szczegółowe Porównanie Metryk</CardTitle>
              <CardDescription>Bezpośrednie zestawienie wyników Lighthouse i Core Web Vitals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Metryka</TableHead>
                      <TableHead className="text-center bg-primary/5 font-bold">
                        <div className="flex flex-col items-center">
                          <span>Twoja Strona</span>
                          <Badge variant={getStatusBadgeVariant(audit.status)} className="mt-1 text-[8px] h-4">
                            {audit.status}
                          </Badge>
                        </div>
                      </TableHead>
                      {competitors.map((c: any) => (
                        <TableHead key={c.id} className="text-center truncate max-w-[150px]">
                          <div className="flex flex-col items-center">
                            <span className="truncate w-full">{c.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                            <Badge variant={getStatusBadgeVariant(c.status)} className="mt-1 text-[8px] h-4">
                              {c.status}
                            </Badge>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Performance Score</TableCell>
                      <TableCell className={`text-center font-bold ${getScoreColor(audit.performance_score)}`}>{formatScore(audit.performance_score)}</TableCell>
                      {competitors.map((c: any) => (
                        <TableCell key={c.id} className={`text-center ${getScoreColor(c.results?.lighthouse?.desktop?.performance_score)}`}>
                          {formatScore(c.results?.lighthouse?.desktop?.performance_score)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">SEO Score</TableCell>
                      <TableCell className={`text-center font-bold ${getScoreColor(audit.seo_score)}`}>{formatScore(audit.seo_score)}</TableCell>
                      {competitors.map((c: any) => (
                        <TableCell key={c.id} className={`text-center ${getScoreColor(c.results?.lighthouse?.desktop?.seo_score)}`}>
                          {formatScore(c.results?.lighthouse?.desktop?.seo_score)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">LCP (ms)</TableCell>
                      <TableCell className="text-center font-bold">{mainSiteLh?.lcp || '-'}</TableCell>
                      {competitors.map((c: any) => (
                        <TableCell key={c.id} className="text-center">{c.results?.lighthouse?.desktop?.lcp || '-'}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">CLS</TableCell>
                      <TableCell className="text-center font-bold">{mainSiteLh?.cls?.toFixed(3) || '-'}</TableCell>
                      {competitors.map((c: any) => (
                        <TableCell key={c.id} className="text-center">{c.results?.lighthouse?.desktop?.cls?.toFixed(3) || '-'}</TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">TTFB (ms)</TableCell>
                      <TableCell className="text-center font-bold">{mainSiteLh?.ttfb || '-'}</TableCell>
                      {competitors.map((c: any) => (
                        <TableCell key={c.id} className="text-center">{c.results?.lighthouse?.desktop?.ttfb || '-'}</TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Winner Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                  <Trophy className="h-4 w-4" />
                  Lider Wydajności
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold truncate">{perfWinner?.name}</div>
                <div className="text-sm text-muted-foreground mt-1">Wynik: {perfWinner?.performance}/100</div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                  <Trophy className="h-4 w-4" />
                  Lider SEO
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold truncate">{seoWinner?.name}</div>
                <div className="text-sm text-muted-foreground mt-1">Wynik: {seoWinner?.seo}/100</div>
              </CardContent>
            </Card>
          </div>

          {/* AI Competitive Analysis Summary */}
          {compAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Wnioski z Analizy Konkurencji AI
                </CardTitle>
                <CardDescription>Strategiczne spojrzenie na Twoją pozycję rynkową</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Twoje Przewagi
                    </p>
                    <div className="space-y-2">
                      {compAnalysis.strengths?.map((s: string, i: number) => (
                        <div key={i} className="text-xs p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30 leading-relaxed">
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-red-600 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Gdzie Konkurencja Jest Lepsza
                    </p>
                    <div className="space-y-2">
                      {compAnalysis.weaknesses?.map((w: string, i: number) => (
                        <div key={i} className="text-xs p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/30 leading-relaxed">
                          {w}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-accent/30 rounded-lg border">
                  <p className="text-sm font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Rekomendacje Strategiczne:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {compAnalysis.recommendations?.map((rec: string, i: number) => (
                      <div key={i} className="flex gap-3 text-sm items-start">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">{i+1}</span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
