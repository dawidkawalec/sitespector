'use client'

/**
 * AI Analysis Page
 * 
 * Displays AI-powered content analysis including:
 * - Quality score & Readability
 * - Local SEO panel
 * - Performance Analysis panel
 * - Competitive Analysis panel
 * - AI recommendations & Summary
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, Sparkles, MapPin, Zap, Users, CheckCircle2, XCircle, BarChart3 } from 'lucide-react'
import { WordCountChart } from '@/components/AuditCharts'
import type { Audit } from '@/lib/api'

export default function AIAnalysisPage({ params }: { params: { id: string } }) {
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
        <p className="text-muted-foreground">Audyt nie jest jeszcze ukończony lub nie zawiera analizy AI.</p>
      </div>
    )
  }

  const content = audit.results?.content_analysis
  const localSeo = audit.results?.local_seo
  const perfAnalysis = audit.results?.performance_analysis
  const compAnalysis = audit.results?.competitive_analysis
  const crawl = audit.results?.crawl

  if (!content) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak analizy treści AI.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Analiza AI</h1>
      </div>
      
      {/* Content Metrics & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metryki Treści</CardTitle>
              <CardDescription>Automatyczna ocena jakości i czytelności</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-card p-4 rounded-lg border flex flex-col items-center text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Quality Score</div>
                  <div className={`text-3xl font-bold ${content.quality_score >= 80 ? 'text-green-600' : content.quality_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {content.quality_score || 0}/100
                  </div>
                </div>
                <div className="bg-card p-4 rounded-lg border flex flex-col items-center text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Liczba Słów</div>
                  <div className="text-3xl font-bold">{content.word_count || 0}</div>
                </div>
                <div className="bg-card p-4 rounded-lg border flex flex-col items-center text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Czytelność (Flesch)</div>
                  <div className="text-3xl font-bold">{content.readability_score || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Podsumowanie AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{content.summary || "Brak podsumowania AI dla tego audytu."}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                O Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] space-y-2">
              <p>Wynik obliczany na podstawie:</p>
              <ul className="space-y-1">
                <li className="flex justify-between"><span>Title tag (30-70)</span><span className="font-mono">-20/10</span></li>
                <li className="flex justify-between"><span>Meta description</span><span className="font-mono">-15</span></li>
                <li className="flex justify-between"><span>Tag H1 (dokładnie 1)</span><span className="font-mono">-15</span></li>
                <li className="flex justify-between"><span>Obrazy z ALT</span><span className="font-mono">-2/img</span></li>
                <li className="flex justify-between"><span>Min. 300 słów</span><span className="font-mono">-10</span></li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Rozkład Liczby Słów</CardTitle>
            </CardHeader>
            <CardContent>
              <WordCountChart pages={crawl?.all_pages || []} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local SEO Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Lokalne SEO
            </CardTitle>
            <CardDescription>Analiza pod kątem biznesu lokalnego</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border">
              <span className="text-sm font-medium">Wykryto lokalną firmę</span>
              <Badge variant={localSeo?.is_local_business ? 'default' : 'secondary'}>
                {localSeo?.is_local_business ? 'Tak' : 'Nie'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border flex flex-col items-center text-center gap-1">
                <span className="text-[10px] uppercase text-muted-foreground">Dane NAP</span>
                {localSeo?.has_nap ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
              </div>
              <div className="p-3 rounded-lg border flex flex-col items-center text-center gap-1">
                <span className="text-[10px] uppercase text-muted-foreground">Schema Markup</span>
                {localSeo?.has_schema_markup ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
              </div>
            </div>
            {localSeo?.recommendations?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">Rekomendacje Lokalne:</p>
                <ul className="text-xs space-y-1">
                  {localSeo.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Analysis Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Analiza Wydajności AI
            </CardTitle>
            <CardDescription>Wnioski z metryk Core Web Vitals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border">
              <span className="text-sm font-medium">Wpływ na użytkownika</span>
              <Badge variant={perfAnalysis?.impact === 'high' ? 'destructive' : perfAnalysis?.impact === 'medium' ? 'default' : 'secondary'}>
                {perfAnalysis?.impact?.toUpperCase() || 'LOW'}
              </Badge>
            </div>
            <div className="space-y-3">
              {perfAnalysis?.issues?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase text-red-600">Wykryte Problemy:</p>
                  {perfAnalysis.issues.map((issue: string, i: number) => (
                    <div key={i} className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-100 dark:border-red-900/30">
                      {issue}
                    </div>
                  ))}
                </div>
              )}
              {perfAnalysis?.recommendations?.length > 0 && (
                <div className="space-y-1 pt-2">
                  <p className="text-xs font-bold uppercase text-green-600">Zalecane Działania:</p>
                  <ul className="text-xs space-y-1">
                    {perfAnalysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-green-600">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Analysis Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Analiza Konkurencji AI
          </CardTitle>
          <CardDescription>Jak wypadasz na tle {compAnalysis?.competitors_analyzed || 0} konkurentów</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Twoje Mocne Strony
              </p>
              <div className="space-y-2">
                {compAnalysis?.strengths?.map((s: string, i: number) => (
                  <div key={i} className="text-xs p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-100 dark:border-green-900/30 leading-relaxed">
                    {s}
                  </div>
                )) || <p className="text-xs text-muted-foreground italic">Brak danych.</p>}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-red-600 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Słabe Strony
              </p>
              <div className="space-y-2">
                {compAnalysis?.weaknesses?.map((w: string, i: number) => (
                  <div key={i} className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-100 dark:border-red-900/30 leading-relaxed">
                    {w}
                  </div>
                )) || <p className="text-xs text-muted-foreground italic">Brak danych.</p>}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-blue-600 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" /> Okazje (Opportunities)
              </p>
              <div className="space-y-2">
                {compAnalysis?.opportunities?.map((o: string, i: number) => (
                  <div key={i} className="text-xs p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900/30 leading-relaxed">
                    {o}
                  </div>
                )) || <p className="text-xs text-muted-foreground italic">Brak danych.</p>}
              </div>
            </div>
          </div>
          
          {compAnalysis?.recommendations?.length > 0 && (
            <div className="mt-6 p-4 bg-accent/30 rounded-lg border">
              <p className="text-sm font-bold mb-3">Strategiczne Rekomendacje:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {compAnalysis.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i+1}</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* General Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Wszystkie Rekomendacje AI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.recommendations?.map((item: string, i: number) => (
              <div key={i} className="text-sm bg-muted/50 p-4 rounded-lg border flex gap-4 items-start">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </div>
            )) || <p className="text-muted-foreground">Brak dodatkowych rekomendacji.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Info({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}
