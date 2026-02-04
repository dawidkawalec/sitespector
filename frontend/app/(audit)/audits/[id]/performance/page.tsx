'use client'

/**
 * Performance Analysis Page
 * 
 * Displays Lighthouse performance metrics including:
 * - Core Web Vitals (FCP, LCP, CLS, etc.)
 * - Desktop and mobile scores
 * - Performance recommendations
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { formatScore, getScoreColor } from '@/lib/utils'
import type { Audit } from '@/lib/api'

export default function PerformancePage({ params }: { params: { id: string } }) {
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera danych wydajności.</p>
      </div>
    )
  }

  const lh = audit.results?.lighthouse?.desktop
  const lhMobile = audit.results?.lighthouse?.mobile

  if (!lh) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak danych Lighthouse.</p>
      </div>
    )
  }

  const metrics = [
    { label: 'First Contentful Paint', value: lh.fcp ? `${lh.fcp}ms` : '-', valueMobile: lhMobile?.fcp ? `${lhMobile.fcp}ms` : '-', score: lh.performance_score },
    { label: 'Largest Contentful Paint', value: lh.lcp ? `${lh.lcp}ms` : '-', valueMobile: lhMobile?.lcp ? `${lhMobile.lcp}ms` : '-', score: lh.performance_score },
    { label: 'Total Blocking Time', value: lh.total_blocking_time ? `${lh.total_blocking_time}ms` : '-', valueMobile: lhMobile?.total_blocking_time ? `${lhMobile.total_blocking_time}ms` : '-', score: lh.performance_score },
    { label: 'Cumulative Layout Shift', value: lh.cls !== undefined ? lh.cls.toFixed(3) : '-', valueMobile: lhMobile?.cls !== undefined ? lhMobile.cls.toFixed(3) : '-', score: lh.performance_score },
    { label: 'Speed Index', value: lh.speed_index ? `${lh.speed_index}ms` : '-', valueMobile: lhMobile?.speed_index ? `${lhMobile.speed_index}ms` : '-', score: lh.performance_score },
    { label: 'Time to First Byte', value: lh.ttfb ? `${lh.ttfb}ms` : '-', valueMobile: lhMobile?.ttfb ? `${lhMobile.ttfb}ms` : '-', score: lh.performance_score },
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Analiza Wydajności</h1>
      
      <div className="space-y-6">
        {/* Lighthouse Scores */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Performance</CardDescription>
              <CardTitle className={`text-3xl ${getScoreColor(lh.performance_score)}`}>
                {formatScore(lh.performance_score)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Accessibility</CardDescription>
              <CardTitle className={`text-3xl ${getScoreColor(lh.accessibility_score)}`}>
                {formatScore(lh.accessibility_score)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Best Practices</CardDescription>
              <CardTitle className={`text-3xl ${getScoreColor(lh.best_practices_score)}`}>
                {formatScore(lh.best_practices_score)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>SEO</CardDescription>
              <CardTitle className={`text-3xl ${getScoreColor(lh.seo_score)}`}>
                {formatScore(lh.seo_score)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Core Web Vitals */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                  {metric.value || '-'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Desktop: {metric.value}</div>
                {lhMobile && (
                  <div className="text-xs text-muted-foreground">Mobile: {metric.valueMobile}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Rekomendacje Wydajności</CardTitle>
            <CardDescription>Sugestie optymalizacji oparte na danych Lighthouse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lh.performance_score < 50 && (
                <p className="text-sm text-red-600">
                  Wydajność wymaga pilnej uwagi. Rozważ optymalizację obrazów, redukcję JavaScript i włączenie cache.
                </p>
              )}
              {lh.performance_score >= 50 && lh.performance_score < 80 && (
                <p className="text-sm text-yellow-600">
                  Wydajność jest na poziomie średnim. Jest pole do poprawy poprzez optymalizację zasobów.
                </p>
              )}
              {lh.performance_score >= 80 && (
                <p className="text-sm text-green-600">
                  Świetna wydajność! Strona ładuje się szybko i zapewnia dobre doświadczenie użytkownika.
                </p>
              )}
              
              {lh.lcp && lh.lcp > 2500 && (
                <p className="text-sm text-red-600 mt-2">
                  LCP powyżej 2.5s - optymalizuj największy element treści (obrazy, wideo).
                </p>
              )}
              
              {lh.cls && lh.cls > 0.1 && (
                <p className="text-sm text-red-600 mt-2">
                  CLS powyżej 0.1 - ustabilizuj layout, dodaj wymiary do obrazów i iframe.
                </p>
              )}
              
              {lh.ttfb && lh.ttfb > 600 && (
                <p className="text-sm text-yellow-600 mt-2">
                  TTFB powyżej 600ms - rozważ optymalizację serwera lub CDN.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile vs Desktop Comparison */}
        {lhMobile && (
          <Card>
            <CardHeader>
              <CardTitle>Porównanie Mobile vs Desktop</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Desktop</h3>
                  <div className="space-y-1 text-sm">
                    <div>Performance: <span className={getScoreColor(lh.performance_score)}>{formatScore(lh.performance_score)}</span></div>
                    <div>FCP: {lh.fcp}ms</div>
                    <div>LCP: {lh.lcp}ms</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Mobile</h3>
                  <div className="space-y-1 text-sm">
                    <div>Performance: <span className={getScoreColor(lhMobile.performance_score)}>{formatScore(lhMobile.performance_score)}</span></div>
                    <div>FCP: {lhMobile.fcp}ms</div>
                    <div>LCP: {lhMobile.lcp}ms</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
