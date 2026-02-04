'use client'

/**
 * Competitors Analysis Page
 * 
 * Displays competitor audit results for comparison.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { formatScore, getScoreColor, getStatusBadgeVariant } from '@/lib/utils'
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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Analiza Konkurencji</h1>
      
      {competitors.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>Brak dodanych konkurentów do porównania.</p>
            <p className="text-sm mt-2">Podczas tworzenia nowego audytu możesz dodać do 3 konkurentów.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {competitors.map((competitor: any) => (
            <Card key={competitor.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{competitor.url}</CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant={getStatusBadgeVariant(competitor.status)}>
                        {competitor.status === 'pending' && 'Oczekujący'}
                        {competitor.status === 'processing' && 'W trakcie'}
                        {competitor.status === 'completed' && 'Ukończony'}
                        {competitor.status === 'failed' && 'Błąd'}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {competitor.status === 'completed' && competitor.results ? (
                  <div>
                    {/* Competitor scores */}
                    {competitor.results.lighthouse?.desktop && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Performance</div>
                          <div className={`text-2xl font-bold mt-1 ${getScoreColor(competitor.results.lighthouse.desktop.performance_score)}`}>
                            {formatScore(competitor.results.lighthouse.desktop.performance_score)}
                          </div>
                        </div>
                        <div className="bg-card p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Accessibility</div>
                          <div className={`text-2xl font-bold mt-1 ${getScoreColor(competitor.results.lighthouse.desktop.accessibility_score)}`}>
                            {formatScore(competitor.results.lighthouse.desktop.accessibility_score)}
                          </div>
                        </div>
                        <div className="bg-card p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Best Practices</div>
                          <div className={`text-2xl font-bold mt-1 ${getScoreColor(competitor.results.lighthouse.desktop.best_practices_score)}`}>
                            {formatScore(competitor.results.lighthouse.desktop.best_practices_score)}
                          </div>
                        </div>
                        <div className="bg-card p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">SEO</div>
                          <div className={`text-2xl font-bold mt-1 ${getScoreColor(competitor.results.lighthouse.desktop.seo_score)}`}>
                            {formatScore(competitor.results.lighthouse.desktop.seo_score)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SEO metrics */}
                    {competitor.results.crawl && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-card p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Title</div>
                          <div className="text-sm mt-1 truncate">{competitor.results.crawl.title || 'Brak'}</div>
                        </div>
                        <div className="bg-card p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Word Count</div>
                          <div className="text-lg font-bold mt-1">{competitor.results.crawl.word_count || 0}</div>
                        </div>
                        <div className="bg-card p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Load Time</div>
                          <div className="text-lg font-bold mt-1">
                            {competitor.results.crawl.load_time ? `${Math.round(competitor.results.crawl.load_time * 1000)}ms` : '-'}
                          </div>
                        </div>
                        <div className="bg-card p-3 rounded-lg border">
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">Status</div>
                          <div className="text-lg font-bold mt-1">{competitor.results.crawl.status_code || '-'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : competitor.status === 'processing' ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
                    <span className="text-muted-foreground">Analiza w trakcie...</span>
                  </div>
                ) : competitor.status === 'failed' ? (
                  <p className="text-red-600">Analiza nie powiodła się</p>
                ) : (
                  <p className="text-muted-foreground">Oczekiwanie na rozpoczęcie analizy...</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Summary */}
      {competitors.length > 0 && competitors.some((c: any) => c.status === 'completed') && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Podsumowanie Porównania</CardTitle>
            <CardDescription>
              Twoja strona vs konkurencja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Przeanalizowano {competitors.filter((c: any) => c.status === 'completed').length} konkurentów.
              Szczegółowe porównanie metryki według metryki będzie dostępne wkrótce.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
