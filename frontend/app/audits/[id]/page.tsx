'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { auditsAPI, isAuthenticated } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatScore, getScoreColor, getStatusBadgeVariant } from '@/lib/utils'
import { ArrowLeft, Download, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function AuditDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
    }
  }, [router])

  // Fetch audit details
  const {
    data: audit,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['audit', params.id],
    queryFn: () => auditsAPI.get(params.id),
    enabled: isAuthenticated(),
    refetchInterval: (data) => {
      // Poll every 5 seconds if processing
      if (data?.status === 'processing' || data?.status === 'pending') {
        return 5000
      }
      return false
    },
  })

  const downloadPDF = async () => {
    try {
      const blob = await auditsAPI.downloadPDF(params.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sitespector_audit_${params.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  if (!isAuthenticated()) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!audit) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Audyt nie został znaleziony</h1>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do dashboardu
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{audit.url}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(audit.status)}>
                {audit.status === 'pending' && 'Oczekujący'}
                {audit.status === 'processing' && 'W trakcie'}
                {audit.status === 'completed' && 'Ukończony'}
                {audit.status === 'failed' && 'Błąd'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDate(audit.created_at)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {audit.status === 'completed' && (
              <Button onClick={downloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Pobierz PDF
              </Button>
            )}
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Processing State */}
      {(audit.status === 'pending' || audit.status === 'processing') && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {audit.status === 'pending' ? 'Oczekiwanie na rozpoczęcie...' : 'Analiza w trakcie...'}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Audyt może potrwać do 10 minut. Możesz zamknąć tę stronę - wyniki będą dostępne w dashboardzie.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed State */}
      {audit.status === 'failed' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Wystąpił błąd podczas analizy
              </h3>
              {audit.error_message && (
                <p className="text-sm text-muted-foreground">{audit.error_message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed State */}
      {audit.status === 'completed' && (
        <>
          {/* Score Overview */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Wynik ogólny</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(audit.overall_score)}`}>
                  {formatScore(audit.overall_score)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>SEO</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(audit.seo_score)}`}>
                  {formatScore(audit.seo_score)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Wydajność</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(audit.performance_score)}`}>
                  {formatScore(audit.performance_score)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Treść</CardDescription>
                <CardTitle className={`text-4xl ${getScoreColor(audit.content_score)}`}>
                  {formatScore(audit.content_score)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Detailed Results */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Podsumowanie</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="performance">Wydajność</TabsTrigger>
              <TabsTrigger value="content">Treść</TabsTrigger>
              <TabsTrigger value="competitors">Konkurencja</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Podsumowanie audytu</CardTitle>
                  <CardDescription>
                    Kluczowe informacje i rekomendacje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {audit.is_local_business && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          🏢 Wykryto lokalną firmę
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Rekomendacje dla lokalnego SEO są dostępne w zakładce SEO.
                        </p>
                      </div>
                    )}
                    <p className="text-muted-foreground">
                      Szczegółowe wyniki znajdują się w pozostałych zakładkach oraz raporcie PDF.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analiza SEO</CardTitle>
                  <CardDescription>
                    Techniczne aspekty optymalizacji dla wyszukiwarek
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Wyniki analizy SEO dostępne w pełnym raporcie PDF.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analiza wydajności</CardTitle>
                  <CardDescription>
                    Core Web Vitals i optymalizacja szybkości
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Szczegółowe metryki wydajności dostępne w raporcie PDF.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analiza treści</CardTitle>
                  <CardDescription>
                    Jakość contentu i czytelność
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Analiza treści i rekomendacje dostępne w raporcie PDF.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="competitors" className="space-y-4">
              {audit.competitors.length > 0 ? (
                audit.competitors.map((competitor) => (
                  <Card key={competitor.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{competitor.url}</CardTitle>
                      <CardDescription>
                        <Badge variant={getStatusBadgeVariant(competitor.status)}>
                          {competitor.status}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Analiza konkurencji dostępna w raporcie PDF.
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Brak dodanych konkurentów
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

