'use client'

/**
 * AI Analysis Page
 * 
 * Displays AI-powered content analysis including:
 * - Quality score
 * - Readability score
 * - AI recommendations
 * - Content metrics
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'
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

  if (!content) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Brak analizy treści AI.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Analiza AI</h1>
      
      <div className="space-y-6">
        {/* Info Boxes - Wyjaśnienia */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Skąd pochodzi Quality Score?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Wynik jakości treści jest obliczany automatycznie na podstawie:
              </p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-fit">•</span>
                  <span><strong>Title tag (30-70 znaków):</strong> -20 pkt jeśli brak, -10 za krótki</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-fit">•</span>
                  <span><strong>Meta description (120-170 znaków):</strong> -15 pkt jeśli brak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-fit">•</span>
                  <span><strong>Tag H1 (dokładnie 1):</strong> -15 pkt jeśli brak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-fit">•</span>
                  <span><strong>Obrazy z ALT:</strong> -2 pkt za każdy obraz bez ALT</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-muted-foreground min-w-fit">•</span>
                  <span><strong>Liczba słów (min 300):</strong> -10 pkt jeśli mniej</span>
                </li>
              </ul>
              <p className="text-xs font-semibold mt-3 text-blue-900 dark:text-blue-100">
                Start: 100 punktów → odejmowane za każdy problem
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Co to jest Readability Score?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Wynik czytelności używa algorytmu <strong>Flesch Reading Ease</strong> (ze Screaming Frog):
              </p>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">90-100</Badge>
                  <span>Bardzo łatwy (dzieci 11 lat)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">60-70</Badge>
                  <span>Łatwy (uczniowie 13-15 lat)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">30-50</Badge>
                  <span>Trudny (studenci)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">0-30</Badge>
                  <span>Bardzo trudny (absolwenci)</span>
                </li>
              </ul>
              <p className="text-xs font-semibold mt-3 text-purple-900 dark:text-purple-100">
                Twój wynik: {content.readability_score || 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Metryki Treści</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-card p-4 rounded-lg border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Jakość Treści</div>
                <div className="text-2xl font-bold mt-1">{content.quality_score || 0}/100</div>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Liczba Słów</div>
                <div className="text-2xl font-bold mt-1">{content.word_count || 0}</div>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Czytelność (Flesch)</div>
                <div className="text-2xl font-bold mt-1">{content.readability_score || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Rekomendacje SEO</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {content.recommendations?.map((item: string, i: number) => (
                <li key={i} className="text-sm bg-muted p-3 rounded-md border flex gap-3">
                  <span className="font-bold text-muted-foreground">{i+1}.</span>
                  <span>{item}</span>
                </li>
              )) || <p className="text-muted-foreground">Brak rekomendacji.</p>}
            </ul>
          </CardContent>
        </Card>

        {/* AI Summary */}
        {content.summary && (
          <Card>
            <CardHeader>
              <CardTitle>Podsumowanie AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{content.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Content Status Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>Status Elementów</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-3 rounded-lg border ${content.has_title ? 'bg-green-50 dark:bg-green-950 border-green-200' : 'bg-red-50 dark:bg-red-950 border-red-200'}`}>
                <div className="text-xs font-medium">Title Tag</div>
                <div className="text-lg font-bold mt-1">{content.has_title ? '✓' : '✗'}</div>
              </div>
              <div className={`p-3 rounded-lg border ${content.has_meta_description ? 'bg-green-50 dark:bg-green-950 border-green-200' : 'bg-red-50 dark:bg-red-950 border-red-200'}`}>
                <div className="text-xs font-medium">Meta Description</div>
                <div className="text-lg font-bold mt-1">{content.has_meta_description ? '✓' : '✗'}</div>
              </div>
              <div className={`p-3 rounded-lg border ${content.has_h1 ? 'bg-green-50 dark:bg-green-950 border-green-200' : 'bg-red-50 dark:bg-red-950 border-red-200'}`}>
                <div className="text-xs font-medium">H1 Tag</div>
                <div className="text-lg font-bold mt-1">{content.has_h1 ? '✓' : '✗'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
