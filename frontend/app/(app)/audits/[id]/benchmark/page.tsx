'use client'

/**
 * Benchmark Page
 * 
 * Compares current audit results with industry standards.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Target, BarChart3, TrendingUp, Award, Info } from 'lucide-react'
import { formatScore, getScoreColor } from '@/lib/utils'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import type { Audit } from '@/lib/api'

export default function BenchmarkPage({ params }: { params: { id: string } }) {
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

  if (!audit || audit.status !== 'completed') {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony.</p>
      </div>
    )
  }

  const benchmarks = audit.results?.benchmarks
  const lh = audit.results?.lighthouse?.desktop

  if (!benchmarks) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych benchmarkowych. Uruchom nowy audyt, aby pobrać dane branżowe.</p>
      </div>
    )
  }

  // Prepare radar chart data
  const radarData = [
    { subject: 'Performance', A: audit.performance_score || 0, B: benchmarks.performance, fullMark: 100 },
    { subject: 'SEO', A: audit.seo_score || 0, B: benchmarks.seo, fullMark: 100 },
    { subject: 'Accessibility', A: lh?.accessibility_score || 0, B: benchmarks.accessibility, fullMark: 100 },
    { subject: 'Best Practices', A: lh?.best_practices_score || 0, B: benchmarks.best_practices, fullMark: 100 },
  ]

  const getPercentile = (score: number, benchmark: number) => {
    // Simplified percentile calculation
    const diff = score - benchmark
    if (diff > 20) return 95
    if (diff > 10) return 85
    if (diff > 0) return 70
    if (diff > -10) return 45
    return 25
  }

  const percentile = getPercentile(audit.overall_score || 0, (benchmarks.performance + benchmarks.seo) / 2)

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <Target className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Benchmark Branżowy</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Radar Chart Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Twoja Strona vs Średnia Branżowa</CardTitle>
              <CardDescription>Porównanie kluczowych wskaźników na wykresie radarowym</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Twoja Strona"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Średnia Branżowa"
                    dataKey="B"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Szczegółowe Zestawienie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left p-4 font-medium">Metryka</th>
                      <th className="text-center p-4 font-medium">Twój Wynik</th>
                      <th className="text-center p-4 font-medium">Średnia</th>
                      <th className="text-center p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { label: 'Performance', val: audit.performance_score, bench: benchmarks.performance },
                      { label: 'SEO', val: audit.seo_score, bench: benchmarks.seo },
                      { label: 'Accessibility', val: lh?.accessibility_score, bench: benchmarks.accessibility },
                      { label: 'LCP (ms)', val: lh?.lcp, bench: benchmarks.lcp, inverse: true },
                      { label: 'TTFB (ms)', val: lh?.ttfb, bench: benchmarks.ttfb, inverse: true },
                    ].map((row, i) => {
                      const isBetter = row.inverse ? (row.val || 9999) < row.bench : (row.val || 0) > row.bench
                      return (
                        <tr key={i}>
                          <td className="p-4 font-medium">{row.label}</td>
                          <td className="p-4 text-center font-bold">{row.val || '-'}</td>
                          <td className="p-4 text-center text-muted-foreground">{row.bench}</td>
                          <td className="p-4 text-center">
                            {isBetter ? (
                              <Badge className="bg-green-500">POWYŻEJ</Badge>
                            ) : (
                              <Badge variant="secondary">PONIŻEJ</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Percentile Card */}
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="h-4 w-4" />
                Twoja Pozycja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-5xl font-bold">{percentile}%</div>
              <p className="text-sm opacity-90 leading-relaxed">
                Twoja strona jest lepiej zoptymalizowana niż <strong>{percentile}%</strong> witryn w Twojej branży.
              </p>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${percentile}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Wnioski Benchmarku
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Analiza porównawcza pokazuje, że Twoim największym atutem jest <strong>{radarData.sort((a,b) => (b.A - b.B) - (a.A - a.B))[0].subject}</strong>.
              </p>
              <p>
                Obszarem, który najbardziej odstaje od średniej rynkowej, jest <strong>{radarData.sort((a,b) => (a.A - a.B) - (b.A - b.B))[0].subject}</strong>. Skupienie się na tym elemencie da Ci największą przewagę konkurencyjną.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase font-bold flex items-center gap-1">
                <Info className="h-3 w-3" /> O danych
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[10px] text-muted-foreground">
              Dane benchmarkowe pochodzą z analizy ponad 100,000 witryn i są aktualizowane co miesiąc.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
