'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { auditsAPI, isAuthenticated, CreateAuditData } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDate, formatScore, getScoreColor, getStatusBadgeVariant } from '@/lib/utils'
import { ArrowLeft, Download, Loader2, RefreshCw, Trash, AlertCircle, FileJson } from 'lucide-react'
import Link from 'next/link'
import type { Audit } from '@/lib/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AuditDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isAuth, setIsAuth] = useState(false)

  // Check authentication (client-side only)
  useEffect(() => {
    const authStatus = isAuthenticated()
    setIsAuth(authStatus)
    if (!authStatus) {
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
    enabled: isAuth,
    refetchInterval: (query) => {
      const data = query?.state?.data as Audit | undefined
      // Poll every 5 seconds if processing
      if (data?.status === 'processing' || data?.status === 'pending') {
        return 5000
      }
      return false
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => auditsAPI.delete(id),
    onSuccess: () => {
      router.push('/dashboard')
    },
  })

  // Retry/Restart mutation (create new audit with same data)
  const retryMutation = useMutation({
    mutationFn: (data: CreateAuditData) => auditsAPI.create(data),
    onSuccess: (newAudit) => {
      router.push(`/audits/${newAudit.id}`)
    },
  })

  const handleDelete = () => {
    if (audit) {
        deleteMutation.mutate(audit.id)
    }
  }

  const handleRetry = () => {
    if (audit) {
        const competitors = audit.competitors?.map(c => c.url) || []
        retryMutation.mutate({
            url: audit.url,
            competitors: competitors
        })
    }
  }

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

  const downloadRawData = async () => {
    try {
      // Direct download via browser to handle headers better
      // We need to get the token
      const token = localStorage.getItem('access_token')
      if (!token) {
          console.error('No access token found')
          return
      }

      // Using fetch to get blob with auth header
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/audits/${params.id}/raw`, {
          headers: {
              'Authorization': `Bearer ${token}`
          }
      })
      
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_${params.id}_raw.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading raw data:', error)
    }
  }

  if (!isAuth) {
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

  const renderSeoResults = (results: any) => {
      const crawl = results?.crawl
      if (!crawl) return <p className="text-muted-foreground">Brak danych z crawlowania.</p>
      return (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Meta Title</CardTitle></CardHeader>
                      <CardContent>
                          <div className="text-lg font-semibold break-words">{crawl.title || '-'}</div>
                          <p className="text-xs text-muted-foreground mt-1">Długość: {crawl.title?.length || 0} znaków</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Meta Description</CardTitle></CardHeader>
                      <CardContent>
                           <div className="text-sm break-words">{crawl.meta_desc || '-'}</div>
                           <p className="text-xs text-muted-foreground mt-1">Długość: {crawl.meta_desc?.length || 0} znaków</p>
                      </CardContent>
                  </Card>
              </div>
              
               <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Nagłówki H1</CardTitle></CardHeader>
                  <CardContent>
                      {crawl.h1_tags && crawl.h1_tags.length > 0 ? (
                          <ul className="list-disc pl-5 space-y-1">
                              {crawl.h1_tags.map((h1: string, i: number) => (
                                  <li key={i} className="text-sm">{h1}</li>
                              ))}
                          </ul>
                      ) : (
                          <span className="text-yellow-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Brak nagłówków H1</span>
                      )}
                  </CardContent>
              </Card>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-card p-4 rounded-lg border">
                       <div className="text-xs text-muted-foreground uppercase tracking-wider">Status Code</div>
                       <div className="text-2xl font-bold mt-1">{crawl.status_code || '-'}</div>
                   </div>
                   <div className="bg-card p-4 rounded-lg border">
                       <div className="text-xs text-muted-foreground uppercase tracking-wider">Load Time</div>
                       <div className="text-2xl font-bold mt-1">{crawl.load_time ? `${Math.round(crawl.load_time * 1000)}ms` : '-'}</div>
                   </div>
                   <div className="bg-card p-4 rounded-lg border">
                       <div className="text-xs text-muted-foreground uppercase tracking-wider">Word Count</div>
                       <div className="text-2xl font-bold mt-1">{crawl.word_count || 0}</div>
                   </div>
                   <div className="bg-card p-4 rounded-lg border">
                       <div className="text-xs text-muted-foreground uppercase tracking-wider">Page Size</div>
                       <div className="text-2xl font-bold mt-1">{crawl.size_bytes ? `${Math.round(crawl.size_bytes / 1024)} KB` : '-'}</div>
                   </div>
               </div>
          </div>
      )
  }

  const renderPerformanceResults = (results: any) => {
      const lh = results?.lighthouse?.desktop
      if (!lh) return <p className="text-muted-foreground">Brak danych Lighthouse.</p>
      
      const metrics = [
          { label: 'First Contentful Paint', value: lh.fcp ? `${lh.fcp}ms` : '-', score: lh.performance_score },
          { label: 'Largest Contentful Paint', value: lh.lcp ? `${lh.lcp}ms` : '-', score: lh.performance_score },
          { label: 'Total Blocking Time', value: lh.total_blocking_time ? `${lh.total_blocking_time}ms` : '-', score: lh.performance_score },
          { label: 'Cumulative Layout Shift', value: lh.cls !== undefined ? lh.cls.toFixed(3) : '-', score: lh.performance_score },
          { label: 'Speed Index', value: lh.speed_index ? `${lh.speed_index}ms` : '-', score: lh.performance_score },
          { label: 'Time to First Byte', value: lh.ttfb ? `${lh.ttfb}ms` : '-', score: lh.performance_score },
      ]

      return (
          <div className="space-y-6">
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
                              <div className="text-xs text-muted-foreground mt-1">Wynik: {formatScore(metric.score)}</div>
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </div>
      )
  }

   const renderContentResults = (results: any) => {
      const content = results?.content_analysis
      if (!content) return <p className="text-muted-foreground">Brak analizy treści AI.</p>
      
      return (
          <div className="space-y-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Analiza Treści</CardTitle>
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
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">Czytelność</div>
                              <div className="text-2xl font-bold mt-1">{content.readability_score || 0}/100</div>
                          </div>
                      </div>
                  </CardContent>
              </Card>

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

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 break-all">{audit.url}</h1>
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

          <div className="flex flex-wrap gap-2">
            {audit.status === 'completed' && (
              <>
                <Button onClick={downloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Pobierz PDF
                </Button>
                <Button variant="secondary" onClick={downloadRawData} title="Pobierz surowe dane (ZIP)">
                  <FileJson className="mr-2 h-4 w-4" />
                  Raw Data
                </Button>
              </>
            )}
            
             <Button variant="outline" onClick={() => refetch()} disabled={isLoading} title="Odśwież status">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button variant="outline" onClick={handleRetry} title="Uruchom ponownie audyt">
                <RefreshCw className="h-4 w-4 mr-2" /> Restart
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="destructive" size="icon">
                        <Trash className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno usunąć ten audyt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tej operacji nie można cofnąć. Wszystkie dane audytu oraz raporty zostaną trwale usunięte.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Usuń</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
           
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
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-600 mb-2">
                Wystąpił błąd podczas analizy
              </h3>
              {audit.error_message && (
                <p className="text-sm text-muted-foreground max-w-lg mx-auto">{audit.error_message}</p>
              )}
              <Button onClick={handleRetry} className="mt-6" variant="default">Spróbuj ponownie</Button>
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
                      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                          🏢 Wykryto lokalną firmę
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Strona wykazuje cechy biznesu lokalnego. Rekomendacje dla lokalnego SEO są dostępne w zakładce SEO.
                        </p>
                      </div>
                    )}
                    
                    {audit.results?.content_analysis?.summary && (
                        <div className="prose dark:prose-invert max-w-none text-sm">
                            <h4 className="text-sm font-bold uppercase text-muted-foreground mb-2">Wnioski z analizy AI</h4>
                            <p>{audit.results.content_analysis.summary}</p>
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
                 {renderSeoResults(audit.results)}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
                 {renderPerformanceResults(audit.results)}
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
                 {renderContentResults(audit.results)}
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
                         {competitor.status === 'completed' ? (
                             renderSeoResults(competitor.results)
                         ) : (
                             <p className="text-muted-foreground">Brak wyników dla tego konkurenta.</p>
                         )}
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
